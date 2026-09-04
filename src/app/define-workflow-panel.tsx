"use client";

import { useEffect, useState } from "react";
import { recordSessionAiRun } from "@/lib/usage";

import type { DefineOutput } from "@/lib/workflows/define-contract";
import ArtifactActions from "./artifact-actions";

type WorkflowResult = {
  id: string;
  model: string;
  status: string;
  output: DefineOutput;
};

export default function DefineWorkflowPanel() {
  const [opportunity, setOpportunity] = useState("");
  const [result, setResult] = useState<WorkflowResult | null>(null);
  const [message, setMessage] = useState("");
  const [isRunning, setIsRunning] = useState(false);

  useEffect(() => {
    let active = true;
    void fetch("/api/workflows/handoffs?target=define_specify")
      .then((response) => response.json() as Promise<{ handoff?: { payload?: { discovery?: { opportunities?: Array<{ title?: string }> } } } | null }>)
      .then((payload) => {
        const title = payload.handoff?.payload?.discovery?.opportunities?.[0]?.title;
        if (active && title && !opportunity) {
          setOpportunity(title);
          setMessage("Approved Discover handoff loaded for Define.");
        }
      })
      .catch(() => undefined);
    return () => { active = false; };
  }, [opportunity]);

  async function runWorkflow(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!opportunity.trim()) return;

    setIsRunning(true);
    setMessage("");
    setResult(null);

    try {
      const response = await fetch("/api/workflows/define", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ opportunity: opportunity.trim() }),
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
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#8c5fba]">Workflow 02 · Define &amp; specify</p>
          <h2 id="define-heading" className="mt-2 text-2xl font-semibold tracking-[-0.04em] text-[#192235]">Turn an opportunity into a buildable brief</h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-[#68748a]">Start with a validated opportunity. The workflow reuses your saved context and citation-backed evidence to draft a reviewable product brief.</p>
        </div>
        <span className="inline-flex w-fit items-center gap-2 rounded-full border border-[#e2d3f0] bg-[#fbf8ff] px-3 py-2 text-xs font-semibold text-[#8c5fba]"><span className="h-2 w-2 rounded-full bg-[#a06bd8]" />Ready</span>
      </div>

      <form onSubmit={runWorkflow} className="mt-6 rounded-xl border border-[#e2d3f0] bg-[#fbf8ff] p-4 sm:p-5">
        <label htmlFor="define-opportunity" className="grid gap-2 text-xs font-semibold text-[#526075]">
          What opportunity should we define?
          <textarea id="define-opportunity" required maxLength={2000} rows={3} value={opportunity} onChange={(event) => setOpportunity(event.target.value)} placeholder="For example: Shorten and streamline the setup flow." className="resize-y rounded-lg border border-[#d8dee8] bg-white px-3.5 py-3 text-sm font-normal leading-6 text-[#192235] outline-none placeholder:text-[#a0a9b8] focus:border-[#8c5fba] focus:ring-2 focus:ring-[#eee4f7]" />
        </label>
        <div className="mt-4 flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center">
          <p className="text-xs leading-5 text-[#8d98a9]">This drafts a specification for review. It does not save a permanent artifact yet.</p>
          <button type="submit" disabled={isRunning || !opportunity.trim()} className="inline-flex items-center justify-center rounded-lg bg-[#8c5fba] px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#754aa6] disabled:cursor-not-allowed disabled:opacity-50">{isRunning ? "Defining…" : "Create brief"}</button>
        </div>
      </form>

      {message && <div role="alert" className="mt-4 rounded-lg border border-[#f0d4d0] bg-[#fff9f8] px-4 py-3 text-sm leading-6 text-[#a04c43]">{message}</div>}

      {result && (
        <div className="mt-6 space-y-5">
          <div className="rounded-xl border border-[#d8dee8] bg-white p-5"><p className="text-xs font-bold uppercase tracking-[0.16em] text-[#8d98a9]">Executive summary</p><p className="mt-3 text-sm leading-7 text-[#526075]">{result.output.executiveSummary}</p></div>
          <section className="rounded-xl border border-[#e3e7ee] bg-white p-5"><h3 className="text-base font-semibold text-[#192235]">Product brief</h3><div className="mt-4 grid gap-4 sm:grid-cols-2"><BriefField label="Problem" value={result.output.productBrief.problemStatement} /><BriefField label="Target user" value={result.output.productBrief.targetUser} /><BriefField label="Proposed solution" value={result.output.productBrief.proposedSolution} /><BriefField label="Desired outcome" value={result.output.productBrief.desiredOutcome} /></div><Citations keys={result.output.productBrief.citationKeys} /></section>
          <StringSection title="In scope" items={result.output.inScope} />
          <StringSection title="Out of scope" items={result.output.outOfScope} />
          <section className="rounded-xl border border-[#e3e7ee] bg-white p-5"><h3 className="text-base font-semibold text-[#192235]">User stories</h3><div className="mt-4 grid gap-3 lg:grid-cols-2">{result.output.userStories.map((story) => <article key={story.title} className="rounded-lg border border-[#e3e7ee] p-4"><h4 className="text-sm font-semibold text-[#192235]">{story.title}</h4><p className="mt-2 text-sm leading-6 text-[#68748a]">{story.story}</p><p className="mt-3 text-xs font-semibold uppercase tracking-[0.12em] text-[#8d98a9]">Acceptance criteria</p><ul className="mt-2 space-y-2">{story.acceptanceCriteria.map((criterion) => <li key={criterion} className="flex gap-2 text-sm leading-6 text-[#68748a]"><span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[#aab5c4]" />{criterion}</li>)}</ul><Citations keys={story.citationKeys} /></article>)}</div>{result.output.userStories.length === 0 && <p className="mt-3 text-sm text-[#9aa4b3]">No user stories returned.</p>}</section>
          <section className="rounded-xl border border-[#e3e7ee] bg-white p-5"><h3 className="text-base font-semibold text-[#192235]">Success metrics</h3><div className="mt-4 grid gap-3 lg:grid-cols-2">{result.output.successMetrics.map((metric) => <article key={metric.name} className="rounded-lg border border-[#e3e7ee] p-4"><div className="flex items-start justify-between gap-3"><h4 className="text-sm font-semibold text-[#192235]">{metric.name}</h4><span className="rounded-full bg-[#eef6f0] px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.12em] text-[#4d8c65]">{metric.direction}</span></div><p className="mt-2 text-sm leading-6 text-[#68748a]">{metric.definition}</p><Citations keys={metric.citationKeys} /></article>)}</div>{result.output.successMetrics.length === 0 && <p className="mt-3 text-sm text-[#9aa4b3]">No supported metrics returned.</p>}</section>
          <section className="rounded-xl border border-[#e3e7ee] bg-white p-5"><h3 className="text-base font-semibold text-[#192235]">Risks</h3><div className="mt-4 grid gap-3 lg:grid-cols-2">{result.output.risks.map((risk) => <article key={risk.title} className="rounded-lg border border-[#e3e7ee] p-4"><h4 className="text-sm font-semibold text-[#192235]">{risk.title}</h4><p className="mt-2 text-sm leading-6 text-[#68748a]">{risk.description}</p><p className="mt-3 text-xs font-semibold uppercase tracking-[0.12em] text-[#8d98a9]">Mitigation</p><p className="mt-2 text-sm leading-6 text-[#68748a]">{risk.mitigation}</p><Citations keys={risk.citationKeys} /></article>)}</div>{result.output.risks.length === 0 && <p className="mt-3 text-sm text-[#9aa4b3]">No risks returned.</p>}</section>
          <div className="grid gap-5 lg:grid-cols-2"><StringSection title="Open questions" items={result.output.openQuestions} /><StringSection title="Limitations" items={result.output.limitations} /></div>
          <p className="text-xs leading-5 text-[#8d98a9]">Run {result.id} · {result.model} · Review required.</p>
          <ArtifactActions kind="product_brief" sourceWorkflow="define_specify" title={`Product brief: ${result.output.productBrief.problemStatement.slice(0, 240)}`} content={result.output} />
        </div>
      )}
    </div>
  );
}

function BriefField({ label, value }: { label: string; value: string }) { return <div><p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#8d98a9]">{label}</p><p className="mt-2 text-sm leading-6 text-[#68748a]">{value}</p></div>; }
function Citations({ keys }: { keys: string[] }) { return <div className="mt-3 flex flex-wrap gap-1.5">{keys.map((citationKey) => <span key={citationKey} className="rounded bg-[#f3f5f8] px-2 py-1 font-mono text-[10px] font-semibold text-[#68748a]">[{citationKey}]</span>)}</div>; }
function StringSection({ title, items }: { title: string; items: string[] }) { return <section className="rounded-xl border border-[#e3e7ee] bg-white p-5"><h3 className="text-base font-semibold text-[#192235]">{title}</h3>{items.length === 0 ? <p className="mt-3 text-sm text-[#9aa4b3]">None returned.</p> : <ul className="mt-3 space-y-2">{items.map((item) => <li key={item} className="flex gap-2 text-sm leading-6 text-[#68748a]"><span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[#aab5c4]" />{item}</li>)}</ul>}</section>; }
