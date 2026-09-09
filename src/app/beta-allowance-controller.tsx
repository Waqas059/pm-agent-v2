"use client";

import { useEffect, useState } from "react";

import { authenticatedFetch } from "@/lib/supabase/auth-fetch";

type Usage = { used?: number; allowance?: number | null; remaining?: number | null; registered?: boolean };
type Contact = { name?: string; phone?: string; email?: string; handle?: string };

export default function BetaAllowanceController() {
  const [usage, setUsage] = useState<Usage | null>(null);
  const [contact, setContact] = useState<Contact>({});
  const [displayName, setDisplayName] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [requestMessage, setRequestMessage] = useState("");

  useEffect(() => {
    const onUsage = (event: Event) => {
      const next = (event as CustomEvent<Usage>).detail;
      setUsage(next);
      if (next.registered && next.remaining === 0) {
        setNotice(null);
        setOpen(true);
      } else if (next.registered && (next.remaining === 2 || next.remaining === 1)) {
        setNotice(`${next.remaining} beta requests remaining`);
      }
    };
    window.addEventListener("pm-agent:beta-usage", onUsage);
    const timer = window.setTimeout(() => {
      void authenticatedFetch(`/api/beta/me?locale=${encodeURIComponent(window.navigator.language)}`, { cache: "no-store" }).then(async (response) => response.ok ? await response.json() as { betaUsage?: Usage; contact?: Contact; displayName?: string | null } : null).then((payload) => {
        if (!payload) return;
        if (payload.betaUsage) setUsage(payload.betaUsage);
        if (payload.contact) setContact(payload.contact);
        if (payload.displayName) setDisplayName(payload.displayName);
      }).catch(() => undefined);
    }, 0);
    return () => { window.clearTimeout(timer); window.removeEventListener("pm-agent:beta-usage", onUsage); };
  }, []);

  const showModal = open && usage?.registered && usage.remaining === 0;
  if (!notice && !showModal) return null;
  const name = displayName ? `, ${displayName}` : "";
  const contactHref = contact.email ? `mailto:${contact.email}` : contact.phone ? `tel:${contact.phone}` : undefined;

  return <>{notice && <div className="beta-access-notice" role="status"><span>{notice}</span><button type="button" aria-label="Dismiss usage notice" onClick={() => setNotice(null)}>×</button></div>}{showModal && <div className="beta-access-modal-backdrop" role="presentation"><section className="beta-access-modal" role="dialog" aria-modal="true" aria-labelledby="global-beta-access-title"><button type="button" className="beta-access-modal-close" aria-label="Close" onClick={() => setOpen(false)}>×</button><p className="pm-eyebrow">BETA ALLOWANCE COMPLETE</p><h2 id="global-beta-access-title">Thanks for trying Bootstrap PM{name}</h2><p>You&apos;ve used your {usage.allowance ?? 10} beta AI requests.</p><p>I hope Bootstrap PM helped you turn product questions into clearer, evidence-backed decisions. Want to continue using Bootstrap PM or share your feedback?</p><div className="beta-access-contact-details"><strong>{contact.name || "Waqas Arshad"}</strong>{contact.phone && <span>WhatsApp / Phone: {contact.phone}</span>}{contact.email && <span>Email: {contact.email}</span>}{contact.handle && <span>Handle: {contact.handle}</span>}</div><div className="beta-access-modal-actions"><button type="button" className="pm-button pm-button-primary" onClick={() => { setRequestMessage("Requesting…"); void authenticatedFetch("/api/beta/continuation", { method: "POST" }).then(async (response) => { const payload = await response.json() as { error?: string }; setRequestMessage(response.ok ? "Thanks. Your request for continued beta access has been recorded." : payload.error || "Request could not be sent."); }).catch(() => setRequestMessage("Request could not be sent.")); }}>Request more access</button><a className="pm-button pm-button-secondary" href="#feedback" onClick={() => setOpen(false)}>Give feedback</a>{contactHref && <a className="beta-access-contact-link" href={contactHref} onClick={() => { void authenticatedFetch("/api/beta/events", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ eventName: "beta_contact_clicked" }) }); }}>Contact Waqas</a>}</div><p className="beta-access-modal-footer">You can still review your existing work, evidence, decisions, and artifacts.</p>{requestMessage && <p role="status" className="pm-status-message">{requestMessage}</p>}</section></div>}</>;
}
