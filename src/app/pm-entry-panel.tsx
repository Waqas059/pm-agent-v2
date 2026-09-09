"use client";

import { FormEvent, useState } from "react";
import { authenticatedFetch } from "@/lib/supabase/auth-fetch";
import UiIcon from "./ui-icons";

type PlanStep = { name: string; label: string; description: string; reason: string; requiresHumanApproval: boolean; mutatesData: boolean };

export default function PmEntryPanel({ compact = false }: { compact?: boolean }) {
  const [request, setRequest] = useState("");
  const [steps, setSteps] = useState<PlanStep[]>([]);
  const [message, setMessage] = useState("");
  const [isPlanning, setIsPlanning] = useState(false);

  async function plan(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!request.trim()) return;
    setIsPlanning(true); setMessage(""); setSteps([]);
    try {
      const response = await authenticatedFetch("/api/pm/plan", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ request: request.trim() }) });
      const payload = await response.json() as { plan?: { steps: PlanStep[] }; error?: string };
      if (!response.ok || !payload.plan) throw new Error(payload.error || "The PM request could not be planned.");
      setSteps(payload.plan.steps);
    } catch (error) { setMessage(error instanceof Error ? error.message : "The PM request could not be planned."); }
    finally { setIsPlanning(false); }
  }

  return <div className={`signal-entry-inner ${compact ? "signal-entry-compact" : ""}`}>
    {!compact && <div className="signal-command-heading"><div><p className="signal-overline">ASK BOOTSTRAP PM</p><p>Turn a product question into a reviewable path.</p></div><span className="signal-plan-badge"><span aria-hidden="true" />Plan first</span></div>}
    <form onSubmit={plan} className="signal-command-form">
      <label htmlFor="pm-entry-request" className="sr-only">What would you like Bootstrap PM to help you figure out?</label>
      <div className="signal-command-field"><textarea id="pm-entry-request" required maxLength={2000} rows={1} value={request} onChange={(event) => setRequest(event.target.value)} placeholder="Ask Bootstrap PM anything… e.g. analyze our onboarding drop-off" className="pm-field" /><span className="signal-command-hint" aria-hidden="true">⌘ K</span></div>
      <button type="submit" disabled={isPlanning || !request.trim()} className="pm-button-primary signal-command-submit" aria-label={isPlanning ? "Preparing PM plan" : "Show me the path"}>{isPlanning ? <span className="signal-command-loading">…</span> : <UiIcon name="arrow-up-right" size={20} />}<span className="sr-only">{isPlanning ? "Preparing plan" : "Show me the path"}</span></button>
    </form>
    {message && <p role="alert" className="signal-command-message">{message}</p>}
    {steps.length > 0 && <div className="pm-panel-soft signal-plan-result"><div className="signal-plan-result-heading"><h3>Proposed internal path</h3><span>Review before action</span></div><ol>{steps.map((step, index) => <li key={`${step.name}-${index}`}><span>{index + 1}</span><div><p>{step.label}</p><small>{step.reason}</small><em>{step.mutatesData ? "Writes data" : "Read or draft"}{step.requiresHumanApproval ? " · Human approval required" : ""}</em></div></li>)}</ol></div>}
  </div>;
}
