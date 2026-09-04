"use client";

import { useState } from "react";
import { recordSessionAiRun } from "@/lib/usage";

import type { DiscoverOutput } from "@/lib/workflows/discover-contract";

type WorkflowResult = {
  id: string;
  model: string;
  status: string;
  output: DiscoverOutput;
};

export default function DiscoverWorkflowPanel() {
  const [question, setQuestion] = useState("");
  const [result, setResult] = useState<WorkflowResult | null>(null);
  const [message, setMessage] = useState("");
  const [isRunning, setIsRunning] = useState(false);

  async function runWorkflow(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!question.trim()) return;

    setIsRunning(true);
    setMessage("");
    setResult(null);

    try {
      const response = await fetch("/api/workflows/discover", {
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

  return (
    <div>
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#5269d8]">Workflow 01 · Discover &amp; synthesize</p>
          <h2 id="discover-heading" className="mt-2 text-2xl font-semibold tracking-[-0.04em] text-[#192235]">Find the signal in your evidence</h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-[#68748a]">Ask a focused discovery question. The workflow combines your saved product context and citation-backed evidence into reviewable themes, pain points, opportunities, and open questions.</p>
        </div>
        <span className="inline-flex w-fit items-center gap-2 rounded-full border border-[#cfe5d6] bg-[#f5fbf6] px-3 py-2 text-xs font-semibold text-[#4d8c65]"><span className="h-2 w-2 rounded-full bg-[#53b67b]" />Ready</span>
      </div>

      <form onSubmit={runWorkflow} className="mt-6 rounded-xl border border-[#cdd6f6] bg-[#f8f9ff] p-4 sm:p-5">
        <label htmlFor="discover-question" className="grid gap-2 text-xs font-semibold text-[#526075]">
          What do you want to discover?
          <textarea id="discover-question" required maxLength={2000} rows={3} value={question} onChange={(event) => setQuestion(event.target.value)} placeholder="For example: What recurring friction should we investigate before planning the next release?" className="resize-y rounded-lg border border-[#d8dee8] bg-white px-3.5 py-3 text-sm font-normal leading-6 text-[#192235] outline-none placeholder:text-[#a0a9b8] focus:border-[#5269d8] focus:ring-2 focus:ring-[#dfe4ff]" />
        </label>
        <div className="mt-4 flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center">
          <p className="text-xs leading-5 text-[#8d98a9]">Only evidence with a saved citation can support findings. Review the result before sharing it.</p>
          <button type="submit" disabled={isRunning || !question.trim()} className="inline-flex items-center justify-center rounded-lg bg-[#5269d8] px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#435ac6] disabled:cursor-not-allowed disabled:opacity-50">{isRunning ? "Synthesizing…" : "Run discovery"}</button>
        </div>
      </form>

      {message && <div role="alert" className="mt-4 rounded-lg border border-[#f0d4d0] bg-[#fff9f8] px-4 py-3 text-sm leading-6 text-[#a04c43]">{message}</div>}

      {result && (
        <div className="mt-6 space-y-5">
          <div className="rounded-xl border border-[#d8dee8] bg-white p-5">
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#8d98a9]">Synthesis</p>
            <p className="mt-3 text-sm leading-7 text-[#526075]">{result.output.executiveSummary}</p>
          </div>
          <FindingGroup title="Themes" items={result.output.themes} accent="bg-[#eef1ff] text-[#5269d8]" />
          <FindingGroup title="Pain points" items={result.output.painPoints} accent="bg-[#fff1ed] text-[#b5654b]" />
          <FindingGroup title="Opportunities" items={result.output.opportunities} accent="bg-[#f5edff] text-[#8c5fba]" />
          <div className="grid gap-5 lg:grid-cols-2">
            <TextGroup title="Open questions" items={result.output.openQuestions} />
            <TextGroup title="Limitations" items={result.output.limitations} />
          </div>
          <p className="text-xs leading-5 text-[#8d98a9]">Run {result.id} · {result.model} · Review required. This result is not saved as a durable artifact yet.</p>
        </div>
      )}
    </div>
  );
}

function FindingGroup({ title, items, accent }: { title: string; items: DiscoverOutput["themes"]; accent: string }) {
  return (
    <section className="rounded-xl border border-[#e3e7ee] bg-white p-5">
      <h3 className="text-base font-semibold text-[#192235]">{title}</h3>
      {items.length === 0 ? <p className="mt-3 text-sm text-[#9aa4b3]">No supported findings returned.</p> : <div className="mt-4 grid gap-3 lg:grid-cols-2">{items.map((item) => <article key={`${title}-${item.title}`} className="rounded-lg border border-[#e3e7ee] p-4"><span className={`inline-flex rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.12em] ${accent}`}>{title}</span><h4 className="mt-3 text-sm font-semibold text-[#192235]">{item.title}</h4><p className="mt-2 text-sm leading-6 text-[#68748a]">{item.summary}</p><div className="mt-3 flex flex-wrap gap-1.5">{item.citationKeys.map((citationKey) => <span key={citationKey} className="rounded bg-[#f3f5f8] px-2 py-1 font-mono text-[10px] font-semibold text-[#68748a]">[{citationKey}]</span>)}</div></article>)}</div>}
    </section>
  );
}

function TextGroup({ title, items }: { title: string; items: string[] }) {
  return <section className="rounded-xl border border-[#e3e7ee] bg-white p-5"><h3 className="text-base font-semibold text-[#192235]">{title}</h3>{items.length === 0 ? <p className="mt-3 text-sm text-[#9aa4b3]">None recorded.</p> : <ul className="mt-3 space-y-2">{items.map((item) => <li key={item} className="flex gap-2 text-sm leading-6 text-[#68748a]"><span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[#aab5c4]" />{item}</li>)}</ul>}</section>;
}
