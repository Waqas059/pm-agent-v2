"use client";

import { FormEvent, useState } from "react";

type PlanStep = { name: string; label: string; description: string; reason: string; requiresHumanApproval: boolean; mutatesData: boolean };

export default function PmEntryPanel() {
  const [request, setRequest] = useState("");
  const [steps, setSteps] = useState<PlanStep[]>([]);
  const [message, setMessage] = useState("");
  const [isPlanning, setIsPlanning] = useState(false);

  async function plan(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!request.trim()) return;
    setIsPlanning(true); setMessage(""); setSteps([]);
    try {
      const response = await fetch("/api/pm/plan", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ request: request.trim() }) });
      const payload = await response.json() as { plan?: { steps: PlanStep[] }; error?: string };
      if (!response.ok || !payload.plan) throw new Error(payload.error || "The PM request could not be planned.");
      setSteps(payload.plan.steps);
    } catch (error) { setMessage(error instanceof Error ? error.message : "The PM request could not be planned."); }
    finally { setIsPlanning(false); }
  }

  return <div>
    <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start"><div><p className="text-xs font-bold uppercase tracking-[0.18em] text-[#4f46c7]">Ask PM Agent</p><h2 id="pm-entry-heading" className="mt-2 text-2xl font-semibold tracking-[-0.05em] text-[#172033]">Turn a messy question into a clear next step.</h2><p className="mt-2 max-w-2xl text-sm leading-6 text-[#667085]">Describe the outcome you need. PM Agent will show the approved internal capabilities it proposes before any workflow or write action happens.</p></div><span className="inline-flex w-fit items-center gap-2 rounded-full border border-[#dfe2ff] bg-[#f2f3ff] px-3 py-2 text-xs font-semibold text-[#4f46c7]"><span className="h-1.5 w-1.5 rounded-full bg-[#4f46c7]" />Plan first</span></div>
    <form onSubmit={plan} className="mt-6 flex flex-col gap-3 sm:flex-row"><label htmlFor="pm-entry-request" className="sr-only">PM request</label><textarea id="pm-entry-request" required maxLength={2000} rows={2} value={request} onChange={(event) => setRequest(event.target.value)} placeholder="For example: Our WhatsApp activation is declining. Help me understand why and what we should do." className="pm-field min-h-20 flex-1 resize-y px-3.5 py-3 text-sm leading-6 outline-none placeholder:text-[#98a2b3]" /><button type="submit" disabled={isPlanning || !request.trim()} className="pm-button-primary h-fit px-5 py-3 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-50">{isPlanning ? "Preparing plan…" : "Show me the path"}</button></form>
    {message && <p role="alert" className="mt-3 text-sm text-[#a04c43]">{message}</p>}
    {steps.length > 0 && <div className="pm-panel-soft mt-5 p-4 sm:p-5"><div className="flex items-center justify-between gap-3"><h3 className="text-sm font-semibold text-[#172033]">Proposed internal path</h3><span className="text-xs font-semibold text-[#4f46c7]">Review before action</span></div><ol className="mt-4 space-y-3">{steps.map((step, index) => <li key={`${step.name}-${index}`} className="flex gap-3"><span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#dfe2ff] text-xs font-bold text-[#4f46c7]">{index + 1}</span><div><p className="text-sm font-semibold text-[#172033]">{step.label}</p><p className="mt-1 text-xs leading-5 text-[#667085]">{step.reason}</p><div className="mt-1 flex flex-wrap gap-2 text-[10px] font-bold uppercase tracking-[0.1em] text-[#98a2b3]"><span>{step.mutatesData ? "Writes data" : "Read or draft"}</span>{step.requiresHumanApproval && <span>Human approval required</span>}</div></div></li>)}</ol></div>}
  </div>;
}
