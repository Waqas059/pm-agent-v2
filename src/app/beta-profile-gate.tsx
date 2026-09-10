"use client";

import { FormEvent, ReactNode, useEffect, useState } from "react";

import { authenticatedFetch } from "@/lib/supabase/auth-fetch";
import { createClient } from "@/lib/supabase/client";

type GateState = "loading" | "profile" | "ready" | "error";

export default function BetaProfileGate({ children }: { children: ReactNode }) {
  const [state, setState] = useState<GateState>("loading");
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    let active = true;
    void (async () => {
      try {
        const response = await authenticatedFetch("/api/beta/me", { cache: "no-store" });
        const payload = await response.json() as { participant?: unknown; isAdmin?: boolean; isAnonymous?: boolean; userEmail?: string; error?: string };
        if (!response.ok) throw Error(payload.error || "Beta access could not be checked.");
        if (!active) return;
        if (payload.isAnonymous && !payload.participant && !payload.isAdmin) {
          await createClient().auth.signOut({ scope: "local" });
          throw Error("Your private workspace could not be opened. Please start again.");
        }
        setEmail(payload.userEmail || "");
        setState(payload.isAdmin || payload.participant ? "ready" : "profile");
      } catch (error) {
        if (!active) return;
        setMessage(error instanceof Error ? error.message : "Beta access could not be checked.");
        setState("error");
      }
    })();
    return () => { active = false; };
  }, []);

  async function completeProfile(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setMessage("");
    try {
      const response = await authenticatedFetch("/api/beta/profile", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name: name.trim() }) });
      const payload = await response.json() as { error?: string };
      if (!response.ok) throw Error(payload.error || "Beta profile could not be completed.");
      setState("ready");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Beta profile could not be completed.");
    } finally {
      setSubmitting(false);
    }
  }

  if (state === "ready") return <>{children}</>;
  if (state === "loading") return <main className="beta-profile-page" aria-busy="true"><div className="beta-profile-panel"><p className="pm-eyebrow">BOOTSTRAP PM BETA</p><h1>Checking your beta access</h1><p>One moment while we connect your account to the workspace.</p></div></main>;
  if (state === "error") return <main className="beta-profile-page"><div className="beta-profile-panel"><p className="pm-eyebrow">BOOTSTRAP PM BETA</p><h1>We could not check your access</h1><p role="alert">{message}</p><button type="button" className="pm-button pm-button-primary" onClick={() => window.location.reload()}>Try again</button></div></main>;
  return <main className="beta-profile-page"><div className="beta-profile-panel"><p className="pm-eyebrow">BOOTSTRAP PM BETA</p><h1>Complete your Bootstrap PM beta profile</h1><p>We use your name to personalize the workspace. Your signed-in email stays locked to this account.</p><form className="beta-profile-form" onSubmit={completeProfile}><label htmlFor="beta-profile-name">Name<input id="beta-profile-name" name="name" autoComplete="name" required maxLength={160} value={name} onChange={(event) => setName(event.target.value)} /></label><label htmlFor="beta-profile-email">Email<input id="beta-profile-email" name="email" type="email" value={email} readOnly aria-readonly="true" /></label><button type="submit" className="pm-button pm-button-primary" disabled={submitting}>{submitting ? "Saving…" : "Continue"}</button></form>{message ? <p className="beta-profile-error" role="alert">{message}</p> : null}</div></main>;
}
