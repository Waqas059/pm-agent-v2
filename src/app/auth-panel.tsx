"use client";

import { FormEvent, useEffect, useRef, useState } from "react";

import { createClient } from "@/lib/supabase/client";
import { authenticatedFetch } from "@/lib/supabase/auth-fetch";

type AuthMode = "sign_in" | "sign_up";
type AuthStatus = "loading" | "signed_out" | "signed_in" | "not_configured";
type AuthPanelProps = { triggerLabel?: string; initialEmail?: string; openOnMount?: boolean };

export default function AuthPanel({ triggerLabel = "Sign in", initialEmail = "", openOnMount = false }: AuthPanelProps) {
  const [status, setStatus] = useState<AuthStatus>("loading");
  const [mode, setMode] = useState<AuthMode>("sign_in");
  const [email, setEmail] = useState(initialEmail);
  const [password, setPassword] = useState("");
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [isOpen, setIsOpen] = useState(openOnMount);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [needsConfirmation, setNeedsConfirmation] = useState(false);
  const [authError, setAuthError] = useState(false);
  const [isBetaAdmin, setIsBetaAdmin] = useState(false);
  const authTriggerRef = useRef<HTMLButtonElement>(null);
  const authDialogRef = useRef<HTMLDivElement>(null);
  const emailInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!isOpen) return;

    const focusTimer = window.setTimeout(() => emailInputRef.current?.focus(), 0);
    const handleDialogKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        setIsOpen(false);
        window.setTimeout(() => authTriggerRef.current?.focus(), 0);
        return;
      }

      if (event.key !== "Tab" || !authDialogRef.current) return;
      const focusable = Array.from(authDialogRef.current.querySelectorAll<HTMLElement>("button, input"))
        .filter((element) => !element.hasAttribute("disabled"));
      if (focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", handleDialogKeyDown);
    return () => {
      window.clearTimeout(focusTimer);
      document.removeEventListener("keydown", handleDialogKeyDown);
    };
  }, [isOpen]);

  useEffect(() => {
    let isMounted = true;
    let subscription: { unsubscribe: () => void } | undefined;

    try {
      const supabase = createClient();

      const callbackError = new URLSearchParams(window.location.search).get("auth_error");
      if (callbackError === "confirmation") {
        window.setTimeout(() => {
          if (!isMounted) return;
          setAuthError(true);
          setIsOpen(true);
          setMessage("That confirmation link is invalid or expired. Request a new link or sign in again.");
        }, 0);
      }

      // The header is a session indicator, not an authorization boundary. Use
      // the active session here so an expired/cached user cannot look signed in
      // while protected server requests correctly reject the missing token.
      void supabase.auth.getSession().then(({ data }) => {
        if (!isMounted) return;
        setUserEmail(data.session?.user.email ?? null);
        setStatus(data.session ? "signed_in" : "signed_out");
        if (data.session) void authenticatedFetch("/api/admin/beta/access", { cache: "no-store" }).then(async (response) => response.ok ? await response.json() as { isAdmin?: boolean } : null).then((payload) => { if (isMounted) setIsBetaAdmin(payload?.isAdmin === true); }).catch(() => undefined);
      });

      const authState = supabase.auth.onAuthStateChange((_event, session) => {
        if (!isMounted) return;
        setUserEmail(session?.user.email ?? null);
        setStatus(session?.user ? "signed_in" : "signed_out");
        if (!session?.user) setIsBetaAdmin(false);
        if (session?.user) void authenticatedFetch("/api/admin/beta/access", { cache: "no-store" }).then(async (response) => response.ok ? await response.json() as { isAdmin?: boolean } : null).then((payload) => { if (isMounted) setIsBetaAdmin(payload?.isAdmin === true); }).catch(() => undefined);
      });
      subscription = authState.data.subscription;

      const invalidateSession = () => {
        if (!isMounted) return;
        setUserEmail(null);
        setIsBetaAdmin(false);
        setStatus("signed_out");
        setIsOpen(false);
      };
      window.addEventListener("pm-auth-invalid", invalidateSession);
      const cleanupInvalidSession = () => window.removeEventListener("pm-auth-invalid", invalidateSession);
      const originalCleanup = subscription?.unsubscribe;
      subscription = {
        unsubscribe: () => {
          originalCleanup?.();
          cleanupInvalidSession();
        },
      };
    } catch (error) {
      if (isMounted && error instanceof Error && error.message.startsWith("Supabase is not configured")) {
        window.setTimeout(() => {
          if (isMounted) setStatus("not_configured");
        }, 0);
      }
    }

    return () => {
      isMounted = false;
      subscription?.unsubscribe();
    };
  }, []);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setMessage("");
    setNeedsConfirmation(false);

    try {
      const supabase = createClient();
      const result = mode === "sign_in"
        ? await supabase.auth.signInWithPassword({ email, password })
        : await supabase.auth.signUp({
            email,
            password,
            options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
          });

      if (result.error) {
        if (mode === "sign_in" && result.error.message.toLowerCase().includes("email not confirmed")) {
          setNeedsConfirmation(true);
        }
        throw result.error;
      }

      if (mode === "sign_up" && !result.data.session) {
        setMessage("Account created. Check your email to confirm it, then sign in.");
        setNeedsConfirmation(true);
        setMode("sign_in");
      } else {
        setMessage("Signed in. Refreshing your protected workspace…");
        window.location.reload();
      }
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to complete authentication.");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function resendConfirmation() {
    setIsSubmitting(true);
    setMessage("");

    try {
      const supabase = createClient();
      const { error } = await supabase.auth.resend({
        type: "signup",
        email,
        options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
      });
      if (error) throw error;
      setMessage("A new confirmation email was sent. Use the newest email link.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to resend the confirmation email.");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleSignOut() {
    setMessage("");

    try {
      const supabase = createClient();
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      window.location.reload();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to sign out.");
    }
  }

  if (status === "loading") {
    return <span className="text-xs font-medium text-[#8d98a9]">Checking access…</span>;
  }

  if (status === "not_configured") {
    return <span className="text-xs font-medium text-[#a06b58]">Supabase configuration needed</span>;
  }

  if (status === "signed_in") {
    return (
      <div className="flex items-center gap-2 sm:gap-3">
        <span className="hidden max-w-44 truncate text-xs font-medium text-[#68748a] sm:inline">{userEmail}</span>
        <button type="button" onClick={handleSignOut} className="min-h-11 rounded-lg border border-[#e3e7ee] bg-white px-3 py-2 text-xs font-semibold text-[#526075] transition-colors hover:border-[#cbd3df] hover:text-[#192235]">
          Sign out
        </button>
        {isBetaAdmin && <a href="/admin/beta" className="min-h-11 inline-flex items-center rounded-lg border border-[#e3e7ee] bg-white px-3 py-2 text-xs font-semibold text-[#526075] transition-colors hover:border-[#cbd3df] hover:text-[#192235]">Beta admin</a>}
        {authError ? <span className="max-w-64 rounded-lg border border-[#f0d4d0] bg-[#fff9f8] px-3 py-2 text-xs leading-5 text-[#a04c43]" role="alert">Confirmation link could not be completed. Your current session is still active.</span> : null}
        {message && !authError ? <span className="sr-only" role="status">{message}</span> : null}
      </div>
    );
  }

  return (
    <div className="relative">
      <button ref={authTriggerRef} type="button" onClick={() => setIsOpen((open) => !open)} aria-expanded={isOpen} aria-controls="auth-dialog" className="min-h-11 rounded-lg bg-[#192235] px-3.5 py-2 text-xs font-semibold text-white transition-colors hover:bg-[#303d59]">
        {triggerLabel}
      </button>
      {isOpen ? (
        <div ref={authDialogRef} id="auth-dialog" role="dialog" aria-modal="true" aria-labelledby="auth-dialog-title" className="absolute right-0 top-12 z-20 w-[min(22rem,calc(100vw-2.5rem))] rounded-2xl border border-[#e3e7ee] bg-white p-5 shadow-[0_14px_40px_rgba(25,34,53,0.14)]">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#5269d8]">Workspace access</p>
            <h2 id="auth-dialog-title" className="mt-2 text-lg font-semibold tracking-[-0.03em] text-[#192235]">{mode === "sign_in" ? "Sign in to continue" : "Create your account"}</h2>
            <p className="mt-1 text-xs leading-5 text-[#68748a]">Your workspace data and workflows are protected by Supabase.</p>
          </div>

          <form className="mt-5 space-y-3" onSubmit={handleSubmit}>
            <label className="block text-xs font-semibold text-[#526075]" htmlFor="auth-email">Email
              <input ref={emailInputRef} id="auth-email" name="email" type="email" autoComplete="email" required value={email} onChange={(event) => setEmail(event.target.value)} className="mt-1.5 w-full rounded-lg border border-[#d8dee8] px-3 py-2.5 text-sm font-normal text-[#192235] outline-none transition focus:border-[#5269d8] focus:ring-2 focus:ring-[#5269d8]/15" />
            </label>
            <label className="block text-xs font-semibold text-[#526075]" htmlFor="auth-password">Password
              <input id="auth-password" name="password" type="password" autoComplete={mode === "sign_in" ? "current-password" : "new-password"} minLength={6} required value={password} onChange={(event) => setPassword(event.target.value)} className="mt-1.5 w-full rounded-lg border border-[#d8dee8] px-3 py-2.5 text-sm font-normal text-[#192235] outline-none transition focus:border-[#5269d8] focus:ring-2 focus:ring-[#5269d8]/15" />
            </label>
            <button type="submit" disabled={isSubmitting} className="min-h-11 w-full rounded-lg bg-[#5269d8] px-3 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#435ac6] disabled:cursor-wait disabled:opacity-60">
              {isSubmitting ? "Working…" : mode === "sign_in" ? "Sign in" : "Create account"}
            </button>
          </form>

          {message ? <p className="mt-3 rounded-lg bg-[#f3f5fb] px-3 py-2.5 text-xs leading-5 text-[#526075]" role="status">{message}</p> : null}
          {needsConfirmation && email ? (
            <button type="button" onClick={() => void resendConfirmation()} disabled={isSubmitting} className="mt-3 inline-flex min-h-11 items-center text-xs font-semibold text-[#5269d8] hover:text-[#435ac6] disabled:opacity-60">
              Resend confirmation email
            </button>
          ) : null}
          <button type="button" onClick={() => { setMode(mode === "sign_in" ? "sign_up" : "sign_in"); setMessage(""); }} className="mt-4 inline-flex min-h-11 items-center text-xs font-semibold text-[#5269d8] hover:text-[#435ac6]">
            {mode === "sign_in" ? "Need an account? Create one" : "Already have an account? Sign in"}
          </button>
        </div>
      ) : null}
    </div>
  );
}
