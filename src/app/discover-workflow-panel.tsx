"use client";
import CitationChip from "./citation-chip";

import { useState } from "react";
import { authenticatedFetch } from "@/lib/supabase/auth-fetch";
import { recordSessionAiRun } from "@/lib/usage";

import type { DiscoverOutput } from "@/lib/workflows/discover-contract";

type WorkflowResult = {
  id: string;
  model: string;
  status: string;
  output: DiscoverOutput;
};

export default function DiscoverWorkflowPanel({ compact = false }: { compact?: boolean }) {
  const [question, setQuestion] = useState("");
  const [result, setResult] = useState<WorkflowResult | null>(null);
  const [message, setMessage] = useState("");
  const [isRunning, setIsRunning] = useState(false);
  const [handoffMessage, setHandoffMessage] = useState("");

  async function approveHandoff(targetWorkflow: "define_specify" | "align_communicate") {
    if (!result) return;
    setHandoffMessage("");
    const response = await authenticatedFetch("/api/workflows/handoffs", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ sourceRunId: result.id, targetWorkflow, payload: { discovery: result.output } }) });
    const payload = await response.json() as { error?: string };
    if (response.ok) {
      window.dispatchEvent(new Event("pm-handoff-approved"));
      window.location.hash = targetWorkflow === "define_specify" ? "define" : "align";
    }
    setHandoffMessage(response.ok ? `Approved for ${targetWorkflow === "define_specify" ? "Define" : "Align"}.` : payload.error || "The handoff could not be approved.");
  }

  async function executeWorkflow() {
    if (!question.trim()) return;

    setIsRunning(true);
    setMessage("");
    setResult(null);

    try {
      const response = await authenticatedFetch("/api/workflows/discover", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: question.trim() }),
      });
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

  const questionForm = <form onSubmit={runWorkflow}>
    <label htmlFor="discover-question">Discovery question<textarea id="discover-question" required maxLength={2000} rows={2} value={question} onChange={(event) => setQuestion(event.target.value)} placeholder="For example: Which steps in setup create the most friction for new customers?" /></label>
    <div className="discover-question-actions"><p>Only saved citations can support findings.</p><button type="submit" disabled={isRunning || !question.trim()}>{isRunning ? "Synthesizing…" : "Run discovery"}</button></div>
  </form>;

  return (
    <div className="product-workflow-panel discover-workflow-panel">
      {compact ? <details className="discover-question-editor discover-question-editor-compact"><summary><span>Edit discovery question</span><span className="discover-ready-state"><span />{isRunning ? "Synthesizing" : "Ready"}</span></summary>{questionForm}</details> : <section className="discover-question-editor" aria-labelledby="discover-heading"><div className="discover-surface-heading"><div><p className="product-work-panel-kicker">DISCOVERY QUESTION</p><h2 id="discover-heading">What are we trying to understand?</h2></div><span className="discover-ready-state"><span />{isRunning ? "Synthesizing" : "Ready"}</span></div><p className="discover-surface-description">Write the question that should guide the evidence review. Bootstrap PM will return source-backed themes, pain points, opportunities, and gaps for your review.</p>{questionForm}</section>}

      {isRunning && <p role="status" aria-live="polite" className="kit-notice">Working on your request using saved context and evidence. The result will be ready for your review when the workflow completes.</p>}
      {message && <div role="alert" className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-[#f0d4d0] bg-[#fff9f8] px-4 py-3 text-sm leading-6 text-[#a04c43]"><span>{message}</span><button type="button" onClick={() => void executeWorkflow()} disabled={isRunning || !question.trim()} className="min-h-11 rounded-lg border border-[#d9aaa0] bg-white px-3 py-2 text-xs font-semibold text-[#8e4038] transition-colors hover:border-[#b9786d] disabled:cursor-not-allowed disabled:opacity-50">Retry</button></div>}

      {result && (
        <div className="discover-result">
          <div className="discover-synthesis">
            <p className="product-work-panel-kicker">AI SYNTHESIS</p>
            <p>{result.output.executiveSummary}</p>
          </div>
          <FindingGroup title="Themes" items={result.output.themes} accent="bg-[#eef1ff] text-[#5269d8]" />
          <FindingGroup title="Pain points" items={result.output.painPoints} accent="bg-[#fff1ed] text-[#b5654b]" />
          <FindingGroup title="Opportunities" items={result.output.opportunities} accent="bg-[#f5edff] text-[#8c5fba]" />
          <div className="grid gap-5 lg:grid-cols-2">
            <TextGroup title="Open questions" items={result.output.openQuestions} />
            <TextGroup title="Limitations" items={result.output.limitations} />
          </div>
          <div className="flex flex-wrap items-center gap-3"><p className="text-xs leading-5 text-[#8d98a9]">Run {result.id} · {result.model} · Review required.</p><button type="button" onClick={() => void approveHandoff("define_specify")} className="rounded-lg border border-[#cdd6f6] bg-white px-3 py-2 text-xs font-semibold text-[#5269d8]">Approve &amp; continue to Define →</button><button type="button" onClick={() => void approveHandoff("align_communicate")} className="rounded-lg border border-[#f0d9cf] bg-white px-3 py-2 text-xs font-semibold text-[#b45f40]">Approve &amp; continue to Align →</button></div>
          {handoffMessage && <p role="status" className="text-xs text-[#4d8c65]">{handoffMessage}</p>}
        </div>
      )}
    </div>
  );
}

function FindingGroup({ title, items, accent }: { title: string; items: DiscoverOutput["themes"]; accent: string }) {
  return (
    <section className="rounded-xl border border-[#e3e7ee] bg-white p-5">
      <h3 className="text-base font-semibold text-[#192235]">{title}</h3>
      {items.length === 0 ? <p className="mt-3 text-sm text-[#9aa4b3]">No supported findings returned.</p> : <div className="mt-4 grid gap-3 lg:grid-cols-2">{items.map((item) => <article key={`${title}-${item.title}`} className="rounded-lg border border-[#e3e7ee] p-4"><span className={`inline-flex rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.12em] ${accent}`}>{title}</span><h4 className="mt-3 text-sm font-semibold text-[#192235]">{item.title}</h4><p className="mt-2 text-sm leading-6 text-[#68748a]">{item.summary}</p><div className="mt-3 flex flex-wrap gap-1.5">{item.citationKeys.map((citationKey) => <CitationChip key={citationKey} citationKey={citationKey} />)}</div></article>)}</div>}
    </section>
  );
}

function TextGroup({ title, items }: { title: string; items: string[] }) {
  return <section className="rounded-xl border border-[#e3e7ee] bg-white p-5"><h3 className="text-base font-semibold text-[#192235]">{title}</h3>{items.length === 0 ? <p className="mt-3 text-sm text-[#9aa4b3]">None recorded.</p> : <ul className="mt-3 space-y-2">{items.map((item) => <li key={item} className="flex gap-2 text-sm leading-6 text-[#68748a]"><span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[#aab5c4]" />{item}</li>)}</ul>}</section>;
}
