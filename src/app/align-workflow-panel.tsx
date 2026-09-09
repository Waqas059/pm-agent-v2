"use client";

import { useEffect, useState } from "react";
import { authenticatedFetch } from "@/lib/supabase/auth-fetch";
import { recordSessionAiRun } from "@/lib/usage";
import { communicationFormatLabels, communicationFormats, type AlignOutput, type CommunicationFormat } from "@/lib/workflows/align-contract";
import ArtifactActions from "./artifact-actions";
import { NextBestAction } from "./workspace-primitives";

type WorkflowResult = { id: string; model: string; status: string; output: AlignOutput };

export default function AlignWorkflowPanel() {
  const [format, setFormat] = useState<CommunicationFormat>("executive_update");
  const [request, setRequest] = useState("");
  const [result, setResult] = useState<WorkflowResult | null>(null);
  const [message, setMessage] = useState("");
  const [isRunning, setIsRunning] = useState(false);
  const [handoffRevision, setHandoffRevision] = useState(0);

  useEffect(() => {
    const refresh = () => setHandoffRevision((value) => value + 1);
    window.addEventListener("pm-handoff-approved", refresh);
    return () => window.removeEventListener("pm-handoff-approved", refresh);
  }, []);

  useEffect(() => {
    let active = true;
    void authenticatedFetch("/api/workflows/handoffs?target=align_communicate")
      .then((response) => response.json() as Promise<{ handoff?: { source_workflow?: string; source_artifact_id?: string | null; payload?: { discovery?: { executiveSummary?: string }; define?: { executiveSummary?: string; productBrief?: { problemStatement?: string; proposedSolution?: string } } } } | null }>)
      .then((payload) => {
        const handoff = payload.handoff;
        const summary = handoff?.payload?.discovery?.executiveSummary
          ?? handoff?.payload?.define?.executiveSummary
          ?? [handoff?.payload?.define?.productBrief?.problemStatement, handoff?.payload?.define?.productBrief?.proposedSolution].filter(Boolean).join(" ");
        if (active && summary && !request) {
          const sourceLabel = handoff?.source_workflow === "define_specify" ? "saved Define brief" : "Discover summary";
          setRequest(`Share the approved ${sourceLabel} with stakeholders: ${summary}`);
          setMessage(`Approved ${sourceLabel} loaded for Align.`);
        }
      })
      .catch(() => undefined);
    return () => { active = false; };
  }, [request, handoffRevision]);

  async function executeWorkflow() {
    if (!request.trim()) return;
    setIsRunning(true); setMessage(""); setResult(null);
    try {
      const response = await authenticatedFetch("/api/workflows/align", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ format, request: request.trim() }) });
      const payload = (await response.json()) as { result?: WorkflowResult; error?: string };
      if (!response.ok || !payload.result) throw new Error(payload.error || "The workflow could not be completed.");
      setResult(payload.result);
      recordSessionAiRun();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "The workflow could not be completed.");
    } finally {
      setIsRunning(false);
    }
  }

  function runWorkflow(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void executeWorkflow();
  }

  return <div className="pm-stage-workflow">
    <section className="pm-stage-preview" aria-label="Align stage overview"><div><p className="pm-eyebrow">WHAT ALIGN PRODUCES</p><h3>Turn the approved direction into a message your team can act on.</h3></div><div className="pm-stage-preview-list"><span>Audience</span><span>Decision ask</span><span>Caveats</span></div></section>
    <details className="pm-progressive-form pm-stage-form"><summary><span>Open Align inputs</span><small>Choose the audience and decision context when ready.</small></summary><form onSubmit={runWorkflow} className="pm-inline-form"><div className="pm-form-grid pm-form-grid-experiment"><label htmlFor="align-format">Communication format<select id="align-format" value={format} onChange={(event) => setFormat(event.target.value as CommunicationFormat)}>{communicationFormats.map((item) => <option key={item} value={item}>{communicationFormatLabels[item]}</option>)}</select></label><label htmlFor="align-request">What decision should this message communicate?<textarea id="align-request" required maxLength={2000} rows={3} value={request} onChange={(event) => setRequest(event.target.value)} placeholder="For example: Explain the setup-flow opportunity and the decision needed." /></label></div><div className="pm-form-actions"><span>This drafts a message for review. It does not save or send anything.</span><button type="submit" disabled={isRunning || !request.trim()} className="pm-button pm-button-primary">{isRunning ? "Drafting…" : "Draft message"}</button></div></form></details>
    {isRunning && <p role="status" aria-live="polite" className="kit-notice">Working on your request using saved context and evidence. The result will be ready for your review when the workflow completes.</p>}
    {message && <div role="alert" className="pm-inline-alert"><span>{message}</span><button type="button" onClick={() => void executeWorkflow()} disabled={isRunning || !request.trim()} className="pm-button pm-button-secondary">Retry</button></div>}
    {result && <div className="pm-stage-result"><section className="pm-result-lead"><div><p className="pm-eyebrow">{communicationFormatLabels[result.output.format]}</p><h3>{result.output.title}</h3></div><span className="pm-status-badge pm-status-amber"><span />{result.output.audience}</span><p>{result.output.message}</p></section><FindingSection title="Key points" items={result.output.keyPoints} /><StringSection title="Decisions or asks" items={result.output.decisionsOrAsks} /><FindingSection title="Caveats" items={result.output.caveats} /><div className="grid gap-5 lg:grid-cols-2"><StringSection title="Open questions" items={result.output.openQuestions} /><StringSection title="Limitations" items={result.output.limitations} /></div><p className="pm-run-meta">Run {result.id} · {result.model} · Review required.</p><NextBestAction action="Review the decision message before sharing it." href="#artifacts">The output remains a draft until you save and review it.</NextBestAction><ArtifactActions kind="communication_message" sourceWorkflow="align_communicate" title={result.output.title} content={result.output} /></div>}
  </div>;
}

function FindingSection({ title, items }: { title: string; items: AlignOutput["keyPoints"] }) { return <section className="pm-result-section"><h3>{title}</h3>{items.length === 0 ? <p className="pm-result-empty">None returned.</p> : <div className="pm-result-list">{items.map((item) => <article key={item.title}><h4>{item.title}</h4><p>{item.detail}</p><Citations keys={item.citationKeys} /></article>)}</div>}</section>; }
function StringSection({ title, items }: { title: string; items: string[] }) { return <section className="pm-result-section"><h3>{title}</h3>{items.length === 0 ? <p className="pm-result-empty">None returned.</p> : <ul>{items.map((item) => <li key={item}>{item}</li>)}</ul>}</section>; }
function Citations({ keys }: { keys: string[] }) { return <div className="pm-citations">{keys.map((citationKey) => <span key={citationKey}>[{citationKey}]</span>)}</div>; }
