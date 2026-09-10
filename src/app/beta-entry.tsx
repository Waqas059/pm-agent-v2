"use client";

import { FormEvent, useEffect, useRef, useState } from "react";

import AuthPanel from "./auth-panel";

type BetaEntryProps = { triggerLabel?: string };

export default function BetaEntry({ triggerLabel = "Use Bootstrap PM" }: BetaEntryProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [registeredEmail, setRegisteredEmail] = useState<string | null>(null);
  const [registrationMode, setRegistrationMode] = useState<"sign_in" | "sign_up">("sign_up");
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
    try {
      const response = await fetch("/api/beta/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), email: email.trim() }),
      });
      const payload = await response.json() as { participant?: { email?: string }; created?: boolean; error?: string };
      if (!response.ok) throw Error(payload.error || "We could not start your Bootstrap PM access.");
      const savedEmail = payload.participant?.email || email.trim().toLowerCase();
      setRegisteredEmail(savedEmail);
      setRegistrationMode(payload.created === false ? "sign_in" : "sign_up");
      setIsOpen(false);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "We could not start your Bootstrap PM access.");
    } finally {
      setIsSubmitting(false);
    }
  }

  if (registeredEmail) {
    return <div className="beta-entry-auth"><p className="beta-entry-auth-note" role="status">Registration saved. Continue with your account.</p><AuthPanel triggerLabel="Continue to workspace" initialEmail={registeredEmail} initialMode={registrationMode} openOnMount /></div>;
  }

  return <div className="beta-entry">
    <button ref={triggerRef} type="button" className="beta-entry-trigger" onClick={() => { setMessage(""); setIsOpen(true); }} aria-expanded={isOpen} aria-controls="beta-registration-dialog">{triggerLabel}</button>
    {isOpen ? <div className="beta-entry-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setIsOpen(false); }}>
      <div ref={dialogRef} id="beta-registration-dialog" className="beta-entry-dialog" role="dialog" aria-modal="true" aria-labelledby="beta-registration-title">
        <button type="button" className="beta-entry-close" aria-label="Close registration" onClick={() => setIsOpen(false)}>×</button>
        <p className="public-landing-kicker">BOOTSTRAP PM BETA</p>
        <h2 id="beta-registration-title">Start using Bootstrap PM</h2>
        <p>Tell us who you are and we’ll take you to the secure account step.</p>
        <form onSubmit={handleSubmit} className="beta-entry-form">
          <label htmlFor="beta-entry-name">Name<input ref={nameInputRef} id="beta-entry-name" name="name" type="text" autoComplete="name" value={name} onChange={(event) => setName(event.target.value)} required maxLength={160} /></label>
          <label htmlFor="beta-entry-email">Email<input id="beta-entry-email" name="email" type="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} required maxLength={320} /></label>
          <button type="submit" className="beta-entry-submit" disabled={isSubmitting}>{isSubmitting ? "Saving…" : "Continue"}</button>
        </form>
        {message ? <p className="beta-entry-error" role="alert">{message}</p> : null}
        <p className="beta-entry-footnote">Your email is used to connect this registration to your Bootstrap PM workspace.</p>
      </div>
    </div> : null}
  </div>;
}
