"use client";

import { FormEvent, useState } from "react";

export default function BetaRegistrationPanel() {
  const [fullName, setFullName] = useState("");
  const [preferredName, setPreferredName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setIsSaving(true); setMessage("");
    try {
      const response = await fetch("/api/beta/register", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ fullName, preferredName, email, locale: navigator.language }) });
      const payload = await response.json() as { error?: string; displayName?: string; country?: string | null };
      if (!response.ok) throw Error(payload.error || "Registration could not be saved.");
      setMessage(`Registration recorded for ${payload.displayName || preferredName || fullName}${payload.country ? ` · ${payload.country}` : ""}. Sign in still uses the existing account flow.`);
    } catch (error) { setMessage(error instanceof Error ? error.message : "Registration could not be saved."); }
    finally { setIsSaving(false); }
  }

  return <section className="beta-registration-panel" aria-labelledby="beta-registration-title"><div><p className="pm-eyebrow">PRIVATE BETA</p><h2 id="beta-registration-title">Register a Product Manager</h2><p>Add a name and email to the beta participant registry. This does not create or change a Supabase login.</p></div><form onSubmit={submit}><label htmlFor="beta-full-name">Full name<input id="beta-full-name" name="fullName" autoComplete="name" required value={fullName} onChange={(event) => setFullName(event.target.value)} /></label><label htmlFor="beta-preferred-name">Preferred name <span>(optional)</span><input id="beta-preferred-name" name="preferredName" autoComplete="nickname" value={preferredName} onChange={(event) => setPreferredName(event.target.value)} /></label><label htmlFor="beta-email">Email<input id="beta-email" name="email" type="email" autoComplete="email" required value={email} onChange={(event) => setEmail(event.target.value)} /></label><div className="beta-registration-actions"><p>Access mode: observe · existing authentication remains unchanged.</p><button type="submit" className="pm-button pm-button-primary" disabled={isSaving}>{isSaving ? "Registering…" : "Register for beta"}</button></div>{message && <p className="pm-status-message" role="status">{message}</p>}</form></section>;
}
