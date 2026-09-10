"use client";

import { FormEvent, useEffect, useRef, useState } from "react";

import { authenticatedFetch } from "@/lib/supabase/auth-fetch";
import { createClient } from "@/lib/supabase/client";

type BetaEntryProps = { triggerLabel?: string };

export default function BetaEntry({ triggerLabel = "Use Bootstrap PM" }: BetaEntryProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);
  const nameInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!isOpen) return;
    const focusTimer = window.setTimeout(() => nameInputRef.current?.focus(), 0);
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        setIsOpen(false);
        window.setTimeout(() => triggerRef.current?.focus(), 0);
        return;
      }
      if (event.key !== "Tab" || !dialogRef.current) return;
      const focusable = Array.from(dialogRef.current.querySelectorAll<HTMLElement>("button, input"))
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
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      window.clearTimeout(focusTimer);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setMessage("");
    let createdAnonymousSession = false;
    try {
      const registrationResponse = await fetch("/api/beta/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), email: email.trim() }),
      });
      const registrationPayload = await registrationResponse.json() as { error?: string };
      if (!registrationResponse.ok) throw Error(registrationPayload.error || "We could not start your Bootstrap PM access.");

      const supabase = createClient();
      const { data: currentSession } = await supabase.auth.getSession();
      if (currentSession.session && !currentSession.session.user.is_anonymous) {
        throw Error("This workspace is already connected to a secure account.");
      }
      if (!currentSession.session) {
        const { data: anonymousSession, error: anonymousError } = await supabase.auth.signInAnonymously();
        if (anonymousError || !anonymousSession.session) throw anonymousError || Error("We could not open your workspace.");
        createdAnonymousSession = true;
      }

      const response = await authenticatedFetch("/api/beta/enter", {
        method: "POST",
      });
      const payload = await response.json() as { email?: string; created?: boolean; error?: string };
      if (!response.ok) throw Error(payload.error || "We could not start your Bootstrap PM access.");
      setName("");
      setEmail("");
      setIsOpen(false);
      window.dispatchEvent(new Event("pm-auth-session-ready"));
    } catch (error) {
      if (createdAnonymousSession) await createClient().auth.signOut({ scope: "local" }).catch(() => undefined);
      setMessage(error instanceof Error && error.message === "This workspace is already connected to a secure account."
        ? error.message
        : "We could not open your workspace. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return <div className="beta-entry">
    <button ref={triggerRef} type="button" className="beta-entry-trigger" onClick={() => { setMessage(""); setIsOpen(true); }} aria-expanded={isOpen} aria-controls="beta-registration-dialog">{triggerLabel}</button>
    {isOpen ? <div className="beta-entry-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setIsOpen(false); }}>
      <div ref={dialogRef} id="beta-registration-dialog" className="beta-entry-dialog" role="dialog" aria-modal="true" aria-labelledby="beta-registration-title">
        <button type="button" className="beta-entry-close" aria-label="Close registration" onClick={() => setIsOpen(false)}>×</button>
        <p className="public-landing-kicker">BOOTSTRAP PM BETA</p>
        <h2 id="beta-registration-title">Start using Bootstrap PM</h2>
        <p>Tell us who you are and we’ll open your private workspace.</p>
        <form onSubmit={handleSubmit} className="beta-entry-form">
          <label htmlFor="beta-entry-name">Name<input ref={nameInputRef} id="beta-entry-name" name="name" type="text" autoComplete="name" value={name} onChange={(event) => setName(event.target.value)} required maxLength={160} /></label>
          <label htmlFor="beta-entry-email">Email<input id="beta-entry-email" name="email" type="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} required maxLength={320} /></label>
          <button type="submit" className="beta-entry-submit" disabled={isSubmitting}>{isSubmitting ? "Preparing…" : "Continue"}</button>
        </form>
        {isSubmitting ? <p className="beta-entry-progress" role="status" aria-live="polite">Preparing your Bootstrap PM workspace…</p> : null}
        {message ? <p className="beta-entry-error" role="alert">{message}</p> : null}
        <p className="beta-entry-footnote">Your email connects this workspace to your beta participant profile.</p>
      </div>
    </div> : null}
  </div>;
}
