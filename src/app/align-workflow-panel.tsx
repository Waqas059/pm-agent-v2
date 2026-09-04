"use client";

import { useState } from "react";
import { recordSessionAiRun } from "@/lib/usage";
import { communicationFormatLabels, communicationFormats, type AlignOutput, type CommunicationFormat } from "@/lib/workflows/align-contract";
import ArtifactActions from "./artifact-actions";

type WorkflowResult = { id: string; model: string; status: string; output: AlignOutput };

export default function AlignWorkflowPanel() {
  const [format, setFormat] = useState<CommunicationFormat>("executive_update");
  const [request, setRequest] = useState("");
  const [result, setResult] = useState<WorkflowResult | null>(null);
  const [message, setMessage] = useState("");
  const [isRunning, setIsRunning] = useState(false);
  async function runWorkflow(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!request.trim()) return;
    setIsRunning(true); setMessage(""); setResult(null);
    try {
      const response = await fetch("/api/workflows/align", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ format, request: request.trim() }) });
      const payload = (await response.json()) as { result?: WorkflowResult; error?: string };
      if (!response.ok || !payload.result) throw new Error(payload.error || "The workflow could not be completed.");
      setResult(payload.result);
      recordSessionAiRun();
    } catch (error) { setMessage(error instanceof Error ? error.message : "The workflow could not be completed."); } finally { setIsRunning(false); }
  }
  return <div>
    <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start"><div><p className="text-xs font-bold uppercase tracking-[0.18em] text-[#c46b49]">Workflow 03 · Align &amp; communicate</p><h2 id="align-heading" className="mt-2 text-2xl font-semibold tracking-[-0.04em] text-[#192235]">Turn context into a useful message</h2><p className="mt-2 max-w-2xl text-sm leading-6 text-[#68748a]">Choose a communication format and the workflow will draft a grounded message for review using the same context and evidence.</p></div><span className="inline-flex w-fit items-center gap-2 rounded-full border border-[#f0d9cf] bg-[#fffaf7] px-3 py-2 text-xs font-semibold text-[#b45f40]"><span className="h-2 w-2 rounded-full bg-[#d17b54]" />Ready</span></div>
    <form onSubmit={runWorkflow} className="mt-6 rounded-xl border border-[#f0d9cf] bg-[#fffaf7] p-4 sm:p-5"><div className="grid gap-4 sm:grid-cols-[minmax(0,220px)_minmax(0,1fr)]"><label htmlFor="align-format" className="grid content-start gap-2 text-xs font-semibold text-[#526075]">Communication format<select id="align-format" value={format} onChange={(event) => setFormat(event.target.value as CommunicationFormat)} className="rounded-lg border border-[#d8dee8] bg-white px-3.5 py-3 text-sm font-normal text-[#192235] outline-none focus:border-[#c46b49] focus:ring-2 focus:ring-[#f5e5df]">{communicationFormats.map((item) => <option key={item} value={item}>{communicationFormatLabels[item]}</option>)}</select></label><label htmlFor="align-request" className="grid gap-2 text-xs font-semibold text-[#526075]">What should this message communicate?<textarea id="align-request" required maxLength={2000} rows={3} value={request} onChange={(event) => setRequest(event.target.value)} placeholder="For example: Explain the setup-flow opportunity and the decision needed." className="resize-y rounded-lg border border-[#d8dee8] bg-white px-3.5 py-3 text-sm font-normal leading-6 text-[#192235] outline-none placeholder:text-[#a0a9b8] focus:border-[#c46b49] focus:ring-2 focus:ring-[#f5e5df]" /></label></div><div className="mt-4 flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center"><p className="text-xs leading-5 text-[#8d98a9]">This drafts a message for review. It does not save or send anything.</p><button type="submit" disabled={isRunning || !request.trim()} className="inline-flex items-center justify-center rounded-lg bg-[#c46b49] px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#a95032] disabled:cursor-not-allowed disabled:opacity-50">{isRunning ? "Drafting…" : "Draft message"}</button></div></form>
    {message && <div role="alert" className="mt-4 rounded-lg border border-[#f0d4d0] bg-[#fff9f8] px-4 py-3 text-sm leading-6 text-[#a04c43]">{message}</div>}
    {result && <div className="mt-6 space-y-5"><section className="rounded-xl border border-[#e3e7ee] bg-white p-5"><div className="flex flex-wrap items-start justify-between gap-3"><div><p className="text-xs font-bold uppercase tracking-[0.16em] text-[#8d98a9]">{communicationFormatLabels[result.output.format]}</p><h3 className="mt-2 text-xl font-semibold text-[#192235]">{result.output.title}</h3></div><span className="rounded-full bg-[#f5e9e3] px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.12em] text-[#b45f40]">{result.output.audience}</span></div><p className="mt-4 whitespace-pre-wrap text-sm leading-7 text-[#526075]">{result.output.message}</p></section><FindingSection title="Key points" items={result.output.keyPoints} /><StringSection title="Decisions or asks" items={result.output.decisionsOrAsks} /><FindingSection title="Caveats" items={result.output.caveats} /><div className="grid gap-5 lg:grid-cols-2"><StringSection title="Open questions" items={result.output.openQuestions} /><StringSection title="Limitations" items={result.output.limitations} /></div><p className="text-xs leading-5 text-[#8d98a9]">Run {result.id} · {result.model} · Review required.</p><ArtifactActions kind="communication_message" sourceWorkflow="align_communicate" title={result.output.title} content={result.output} /></div>}
  </div>;
}
function FindingSection({ title, items }: { title: string; items: AlignOutput["keyPoints"] }) { return <section className="rounded-xl border border-[#e3e7ee] bg-white p-5"><h3 className="text-base font-semibold text-[#192235]">{title}</h3>{items.length === 0 ? <p className="mt-3 text-sm text-[#9aa4b3]">None returned.</p> : <div className="mt-4 grid gap-3 lg:grid-cols-2">{items.map((item) => <article key={item.title} className="rounded-lg border border-[#e3e7ee] p-4"><h4 className="text-sm font-semibold text-[#192235]">{item.title}</h4><p className="mt-2 text-sm leading-6 text-[#68748a]">{item.detail}</p><Citations keys={item.citationKeys} /></article>)}</div>}</section>; }
function StringSection({ title, items }: { title: string; items: string[] }) { return <section className="rounded-xl border border-[#e3e7ee] bg-white p-5"><h3 className="text-base font-semibold text-[#192235]">{title}</h3>{items.length === 0 ? <p className="mt-3 text-sm text-[#9aa4b3]">None returned.</p> : <ul className="mt-3 space-y-2">{items.map((item) => <li key={item} className="flex gap-2 text-sm leading-6 text-[#68748a]"><span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[#aab5c4]" />{item}</li>)}</ul>}</section>; }
function Citations({ keys }: { keys: string[] }) { return <div className="mt-3 flex flex-wrap gap-1.5">{keys.map((citationKey) => <span key={citationKey} className="rounded bg-[#f3f5f8] px-2 py-1 font-mono text-[10px] font-semibold text-[#68748a]">[{citationKey}]</span>)}</div>; }
