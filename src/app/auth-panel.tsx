"use client";

import { FormEvent, useEffect, useState } from "react";

import { createClient } from "@/lib/supabase/client";

type AuthMode = "sign_in" | "sign_up";
type AuthStatus = "loading" | "signed_out" | "signed_in" | "not_configured";

export default function AuthPanel() {
  const [status, setStatus] = useState<AuthStatus>("loading");
  const [mode, setMode] = useState<AuthMode>("sign_in");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [needsConfirmation, setNeedsConfirmation] = useState(false);
  const [authError, setAuthError] = useState(false);

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

      void supabase.auth.getUser().then(({ data }) => {
        if (!isMounted) return;
        setUserEmail(data.user?.email ?? null);
        setStatus(data.user ? "signed_in" : "signed_out");
      });

      const authState = supabase.auth.onAuthStateChange((_event, session) => {
        if (!isMounted) return;
        setUserEmail(session?.user.email ?? null);
        setStatus(session?.user ? "signed_in" : "signed_out");
      });
      subscription = authState.data.subscription;
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
        <button type="button" onClick={handleSignOut} className="rounded-lg border border-[#e3e7ee] bg-white px-3 py-2 text-xs font-semibold text-[#526075] transition-colors hover:border-[#cbd3df] hover:text-[#192235]">
          Sign out
        </button>
        {authError ? <span className="max-w-64 rounded-lg border border-[#f0d4d0] bg-[#fff9f8] px-3 py-2 text-xs leading-5 text-[#a04c43]" role="alert">Confirmation link could not be completed. Your current session is still active.</span> : null}
        {message && !authError ? <span className="sr-only" role="status">{message}</span> : null}
      </div>
    );
  }

  return (
    <div className="relative">
      <button type="button" onClick={() => setIsOpen((open) => !open)} className="rounded-lg bg-[#192235] px-3.5 py-2 text-xs font-semibold text-white transition-colors hover:bg-[#303d59]">
        Sign in
      </button>
      {isOpen ? (
        <div className="absolute right-0 top-12 z-20 w-[min(22rem,calc(100vw-2.5rem))] rounded-2xl border border-[#e3e7ee] bg-white p-5 shadow-[0_14px_40px_rgba(25,34,53,0.14)]">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#5269d8]">Workspace access</p>
            <h2 className="mt-2 text-lg font-semibold tracking-[-0.03em] text-[#192235]">{mode === "sign_in" ? "Sign in to continue" : "Create your account"}</h2>
            <p className="mt-1 text-xs leading-5 text-[#68748a]">Your workspace data and workflows are protected by Supabase.</p>
          </div>

          <form className="mt-5 space-y-3" onSubmit={handleSubmit}>
            <label className="block text-xs font-semibold text-[#526075]" htmlFor="auth-email">Email
              <input id="auth-email" name="email" type="email" autoComplete="email" required value={email} onChange={(event) => setEmail(event.target.value)} className="mt-1.5 w-full rounded-lg border border-[#d8dee8] px-3 py-2.5 text-sm font-normal text-[#192235] outline-none transition focus:border-[#5269d8] focus:ring-2 focus:ring-[#5269d8]/15" />
            </label>
            <label className="block text-xs font-semibold text-[#526075]" htmlFor="auth-password">Password
              <input id="auth-password" name="password" type="password" autoComplete={mode === "sign_in" ? "current-password" : "new-password"} minLength={6} required value={password} onChange={(event) => setPassword(event.target.value)} className="mt-1.5 w-full rounded-lg border border-[#d8dee8] px-3 py-2.5 text-sm font-normal text-[#192235] outline-none transition focus:border-[#5269d8] focus:ring-2 focus:ring-[#5269d8]/15" />
            </label>
            <button type="submit" disabled={isSubmitting} className="w-full rounded-lg bg-[#5269d8] px-3 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#435ac6] disabled:cursor-wait disabled:opacity-60">
              {isSubmitting ? "Working…" : mode === "sign_in" ? "Sign in" : "Create account"}
            </button>
          </form>

          {message ? <p className="mt-3 rounded-lg bg-[#f3f5fb] px-3 py-2.5 text-xs leading-5 text-[#526075]" role="status">{message}</p> : null}
          {needsConfirmation && email ? (
            <button type="button" onClick={() => void resendConfirmation()} disabled={isSubmitting} className="mt-3 text-xs font-semibold text-[#5269d8] hover:text-[#435ac6] disabled:opacity-60">
              Resend confirmation email
            </button>
          ) : null}
          <button type="button" onClick={() => { setMode(mode === "sign_in" ? "sign_up" : "sign_in"); setMessage(""); }} className="mt-4 text-xs font-semibold text-[#5269d8] hover:text-[#435ac6]">
            {mode === "sign_in" ? "Need an account? Create one" : "Already have an account? Sign in"}
          </button>
        </div>
      ) : null}
    </div>
  );
}
