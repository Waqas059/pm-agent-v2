"use client";

import { useEffect, useState } from "react";
import { authenticatedFetch } from "@/lib/supabase/auth-fetch";
import { BETA_AI_RUN_LIMIT, getUsageLabel, getUsagePercent, readSessionAiRuns } from "@/lib/usage";

export default function UsagePanel() {
  const [used, setUsed] = useState(0);
  const [limit, setLimit] = useState(BETA_AI_RUN_LIMIT);
  const [serverUsed, setServerUsed] = useState<number | null>(null);
  const [showCompletion, setShowCompletion] = useState(false);
  const [requestMessage, setRequestMessage] = useState("");
  const [contact, setContact] = useState<{ name?: string; phone?: string; email?: string; handle?: string }>({});

  useEffect(() => {
    const refresh = () => setUsed(readSessionAiRuns());
    refresh();
    window.addEventListener("pm-agent:usage-updated", refresh);
    void authenticatedFetch("/api/usage", { cache: "no-store" })
      .then(async (response) => {
        if (!response.ok) return null;
        const payload = (await response.json()) as { used?: unknown; limit?: unknown };
        if (typeof payload.limit === "number" && payload.limit >= 0) setLimit(payload.limit);
        return typeof payload.used === "number" && Number.isInteger(payload.used) && payload.used >= 0 ? payload.used : null;
      })
      .then((value) => setServerUsed(value))
      .catch(() => undefined);
    void authenticatedFetch(`/api/beta/me?locale=${encodeURIComponent(window.navigator.language)}`, { cache: "no-store" }).then(async (response) => response.ok ? await response.json() as { contact?: typeof contact } : null).then((payload) => { if (payload?.contact) setContact(payload.contact); }).catch(() => undefined);
    return () => window.removeEventListener("pm-agent:usage-updated", refresh);
  }, []);

  const displayedUsed = serverUsed ?? used;
  const status = getUsageLabel(displayedUsed, limit);
  const percent = getUsagePercent(displayedUsed, limit);

  return <div>
    <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start"><div><p className="text-xs font-bold uppercase tracking-[0.18em] text-[#b45f40]">USAGE FOUNDATION</p><h2 id="usage-heading" className="mt-2 text-2xl font-semibold tracking-[-0.04em] text-[#192235]">Keep AI usage visible</h2><p className="mt-2 max-w-2xl text-sm leading-6 text-[#68748a]">A small workspace meter makes usage understandable before billing or provider routing is added. It uses the server count when available and falls back to this browser if the status request fails.</p></div><span className={`inline-flex w-fit items-center gap-2 rounded-full border px-3 py-2 text-xs font-semibold ${status === "Limit reached" ? "border-[#f1c9c1] bg-[#fff6f4] text-[#b45f40]" : "border-[#f5dfbd] bg-[#fffaf0] text-[#aa7625]"}`}><span className="h-2 w-2 rounded-full bg-current" />{status}</span></div>
    <div className="mt-6 rounded-xl border border-[#f1dfd7] bg-[#fffaf7] p-4 sm:p-5"><div className="flex flex-wrap items-end justify-between gap-3"><div><p className="text-xs font-semibold text-[#8d98a9]">Beta guardrail · meaningful AI generations</p><p className="mt-2 text-2xl font-semibold tracking-[-0.04em]">{displayedUsed} <span className="text-sm font-normal text-[#8d98a9]">of {limit}</span></p></div><p className="text-xs text-[#8d98a9]">{Math.max(limit - displayedUsed, 0)} remaining</p></div><div className="mt-4 h-2 overflow-hidden rounded-full bg-[#f2e4df]"><div className="h-full rounded-full bg-[#d17b54] transition-[width]" style={{ width: `${percent}%` }} /></div><p className="mt-3 text-xs leading-5 text-[#68748a]">Views, evidence browsing, deterministic search, uploads, feedback, and exports do not consume this allowance.</p>{displayedUsed >= limit && <button type="button" className="mt-4 min-h-11 rounded-lg border border-[#d8dee8] bg-white px-3 py-2 text-xs font-semibold text-[#526075]" onClick={() => setShowCompletion(true)}>Review beta access options</button>}</div>
    <div className="mt-4 grid gap-3 sm:grid-cols-3"><div className="rounded-xl border border-[#e3e7ee] bg-white p-4"><p className="text-[10px] font-bold uppercase tracking-[0.12em] text-[#8d98a9]">Current plan</p><p className="mt-2 text-sm font-semibold text-[#192235]">Beta workspace</p><p className="mt-1 text-xs text-[#8d98a9]">No charge configured</p></div><div className="rounded-xl border border-[#e3e7ee] bg-white p-4"><p className="text-[10px] font-bold uppercase tracking-[0.12em] text-[#8d98a9]">Provider</p><p className="mt-2 text-sm font-semibold text-[#192235]">OpenAI Responses</p><p className="mt-1 text-xs text-[#8d98a9]">Configured server-side</p></div><div className="rounded-xl border border-[#e3e7ee] bg-white p-4"><p className="text-[10px] font-bold uppercase tracking-[0.12em] text-[#8d98a9]">Usage protection</p><p className="mt-2 text-sm font-semibold text-[#192235]">Server-enforced cap</p><p className="mt-1 text-xs text-[#8d98a9]">Active for this workspace</p></div></div>
    {showCompletion && <div className="beta-access-modal-backdrop" role="presentation"><section className="beta-access-modal" role="dialog" aria-modal="true" aria-labelledby="beta-access-title"><button type="button" className="beta-access-modal-close" aria-label="Close" onClick={() => setShowCompletion(false)}>×</button><p className="pm-eyebrow">BETA ALLOWANCE COMPLETE</p><h3 id="beta-access-title">You have used your current beta AI allowance.</h3><p>You can still review existing work. If the workflow is useful, ask the beta team for more access.</p><div className="beta-access-modal-actions"><button type="button" className="pm-button pm-button-primary" onClick={() => { setRequestMessage("Requesting…"); void authenticatedFetch("/api/beta/continuation", { method: "POST" }).then(async (response) => { const payload = await response.json() as { error?: string }; setRequestMessage(response.ok ? "Request sent for review." : payload.error || "Request could not be sent."); }).catch(() => setRequestMessage("Request could not be sent.")); }}>Request more access</button><a className="pm-button pm-button-secondary" href="#feedback" onClick={() => setShowCompletion(false)}>Give feedback</a></div>{contact.email && <a className="beta-access-contact" href={`mailto:${contact.email}`} onClick={() => { void authenticatedFetch("/api/beta/events", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ eventName: "beta_contact_clicked" }) }); }}>Contact {contact.name || "the beta team"}</a>}{requestMessage && <p role="status" className="pm-status-message">{requestMessage}</p>}</section></div>}
  </div>;
}
