"use client";

import { useEffect, useState } from "react";
import { BETA_AI_RUN_LIMIT, getUsageLabel, getUsagePercent, readSessionAiRuns } from "@/lib/usage";

export default function UsagePanel() {
  const [used, setUsed] = useState(0);

  useEffect(() => {
    const refresh = () => setUsed(readSessionAiRuns());
    refresh();
    window.addEventListener("pm-agent:usage-updated", refresh);
    return () => window.removeEventListener("pm-agent:usage-updated", refresh);
  }, []);

  const status = getUsageLabel(used, BETA_AI_RUN_LIMIT);
  const percent = getUsagePercent(used, BETA_AI_RUN_LIMIT);

  return <div>
    <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start"><div><p className="text-xs font-bold uppercase tracking-[0.18em] text-[#b45f40]">T18 · USAGE FOUNDATION</p><h2 id="usage-heading" className="mt-2 text-2xl font-semibold tracking-[-0.04em] text-[#192235]">Keep AI usage visible</h2><p className="mt-2 max-w-2xl text-sm leading-6 text-[#68748a]">A small session meter makes usage understandable before billing or provider routing is added. It counts successful workflow runs in this browser only.</p></div><span className={`inline-flex w-fit items-center gap-2 rounded-full border px-3 py-2 text-xs font-semibold ${status === "Limit reached" ? "border-[#f1c9c1] bg-[#fff6f4] text-[#b45f40]" : "border-[#f5dfbd] bg-[#fffaf0] text-[#aa7625]"}`}><span className="h-2 w-2 rounded-full bg-current" />{status}</span></div>
    <div className="mt-6 rounded-xl border border-[#f1dfd7] bg-[#fffaf7] p-4 sm:p-5"><div className="flex flex-wrap items-end justify-between gap-3"><div><p className="text-xs font-semibold text-[#8d98a9]">Beta guardrail · successful AI workflow runs</p><p className="mt-2 text-2xl font-semibold tracking-[-0.04em]">{used} <span className="text-sm font-normal text-[#8d98a9]">of {BETA_AI_RUN_LIMIT}</span></p></div><p className="text-xs text-[#8d98a9]">Browser display · server cap active</p></div><div className="mt-4 h-2 overflow-hidden rounded-full bg-[#f2e4df]"><div className="h-full rounded-full bg-[#d17b54] transition-[width]" style={{ width: `${percent}%` }} /></div><p className="mt-3 text-xs leading-5 text-[#68748a]">The server blocks new active or successful AI runs at the beta limit. This meter is not billing or a claim about account-wide usage.</p></div>
    <div className="mt-4 grid gap-3 sm:grid-cols-3"><div className="rounded-xl border border-[#e3e7ee] bg-white p-4"><p className="text-[10px] font-bold uppercase tracking-[0.12em] text-[#8d98a9]">Current plan</p><p className="mt-2 text-sm font-semibold text-[#192235]">Beta workspace</p><p className="mt-1 text-xs text-[#8d98a9]">No charge configured</p></div><div className="rounded-xl border border-[#e3e7ee] bg-white p-4"><p className="text-[10px] font-bold uppercase tracking-[0.12em] text-[#8d98a9]">Provider</p><p className="mt-2 text-sm font-semibold text-[#192235]">OpenAI Responses</p><p className="mt-1 text-xs text-[#8d98a9]">Configured server-side</p></div><div className="rounded-xl border border-[#e3e7ee] bg-white p-4"><p className="text-[10px] font-bold uppercase tracking-[0.12em] text-[#8d98a9]">Usage protection</p><p className="mt-2 text-sm font-semibold text-[#192235]">Server-enforced cap</p><p className="mt-1 text-xs text-[#8d98a9]">Active for this workspace</p></div></div>
  </div>;
}
