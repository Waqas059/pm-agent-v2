"use client";

import { useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import DiscoverWorkflowPanel from "./discover-workflow-panel";
import DefineWorkflowPanel from "./define-workflow-panel";
import AlignWorkflowPanel from "./align-workflow-panel";
import UiIcon, { type IconName } from "./ui-icons";
import { CompactEmptyState, NextBestAction } from "./workspace-primitives";

type Stage = "discover" | "define" | "align" | "deliver";
type EvidenceItem = { id: string; kind: string; title: string; content: string; source_label: string; created_at: string };
type Run = { id: string; workflow_name: string; status: string; input: unknown; updated_at: string; created_at: string };
type WorkData = {
  name: string;
  title: string;
  question: string;
  run: Run | null;
  evidence: EvidenceItem[];
  assumptions: { id: string; statement: string; impact: string; status: string }[];
  decisions: { id: string; title: string; status: string }[];
};

const stages: { id: Stage | "deliver"; label: string; description: string; icon: IconName }[] = [
  { id: "discover", label: "Discover", description: "Understand the problem", icon: "compass" },
  { id: "define", label: "Define", description: "Shape the opportunity", icon: "file" },
  { id: "align", label: "Align", description: "Make the decision", icon: "message" },
  { id: "deliver", label: "Deliver", description: "Create the output", icon: "archive" },
];

function extractQuestion(input: unknown) {
  if (!input || typeof input !== "object" || Array.isArray(input)) return "";
  const record = input as Record<string, unknown>;
  for (const key of ["question", "opportunity", "request", "title"]) {
    const value = record[key];
    if (typeof value === "string" && value.trim()) return value.trim();
  }
  return "";
}

function workflowLabel(name: string) {
  return name.replaceAll("_", " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function conciseTitle(value: string) {
  const normalized = value.replace(/^share the approved discover summary with stakeholders:\s*/i, "").trim();
  if (normalized.length <= 72) return normalized;
  const sentence = normalized.split(/[.!?](?:\s|$)/)[0]?.trim() || normalized;
  return sentence.length <= 72 ? sentence : `${sentence.slice(0, 69).trimEnd()}…`;
}

function workItemTitle(value: string) {
  if (/setup/i.test(value) && /friction/i.test(value)) return "Setup friction investigation";
  return conciseTitle(value);
}

function stageForRun(run: Run | null) {
  if (run?.workflow_name === "define_specify") return "define";
  if (run?.workflow_name === "align_communicate") return "align";
  return "discover";
}

function dateLabel(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Recently";
  return new Intl.DateTimeFormat("en", { month: "short", day: "numeric", year: "numeric" }).format(date);
}

function stageHref(stage: Stage | "deliver") {
  return `#${stage}`;
}

function DiscoverOverview({ data }: { data: WorkData | null }) {
  const evidenceCount = data?.evidence.length ?? 0;
  const assumptionCount = data?.assumptions.length ?? 0;
  const currentUnderstanding = data?.evidence[0]?.content || "No source-backed understanding is recorded yet.";

  return (
    <section className="product-work-discovery-frame" aria-label="Discovery frame">
      <div className="product-work-discovery-question">
        <p className="product-work-panel-kicker">DISCOVERY QUESTION</p>
        <h3>{data?.question || "What are we trying to understand?"}</h3>
        <p>Keep the question narrow enough to produce a decision.</p>
      </div>
      <div className="product-work-discovery-section">
        <div><p className="product-work-panel-kicker">CURRENT UNDERSTANDING</p><p>{currentUnderstanding}</p></div>
      </div>
      <div className="product-work-discovery-section product-work-discovery-evidence">
        <div className="product-work-discovery-section-heading"><p className="product-work-panel-kicker">EVIDENCE</p><a href="#evidence">Open library <UiIcon name="arrow-up-right" size={12} /></a></div>
        {evidenceCount ? <ul>{data?.evidence.map((item) => <li key={item.id}><span>{item.title}</span><small>{item.source_label}</small></li>)}</ul> : <p>No source-backed evidence is recorded yet.</p>}
      </div>
      <div className="product-work-discovery-section">
        <p className="product-work-panel-kicker">OPEN QUESTIONS</p>
        {assumptionCount ? <ul>{data?.assumptions.map((item) => <li key={item.id}><span aria-hidden="true">○</span>{item.statement}</li>)}</ul> : <p>Run Discover to surface unresolved questions and gaps.</p>}
      </div>
    </section>
  );
}

export default function ProductWorkScreen({ activeStage, focusTarget = null }: { activeStage: Stage; focusTarget?: "discover-question" | null }) {
  const [data, setData] = useState<WorkData | null>(null);
  const [message, setMessage] = useState("Loading product work…");
  const [intelligenceOpen, setIntelligenceOpen] = useState(true);
  const collapsedIntelligenceButtonRef = useRef<HTMLButtonElement>(null);
  const shouldRestoreIntelligenceFocus = useRef(false);

  useEffect(() => {
    if (typeof window.matchMedia !== "function") return;
    const query = window.matchMedia("(max-width: 1024px)");
    const sync = () => setIntelligenceOpen(!query.matches);
    sync();
    query.addEventListener("change", sync);
    return () => query.removeEventListener("change", sync);
  }, []);

  useEffect(() => {
    if (focusTarget !== "discover-question" || activeStage !== "discover") return;
    const frame = window.requestAnimationFrame(() => {
      const editor = document.querySelector<HTMLDetailsElement>(".discover-question-editor-compact");
      editor?.setAttribute("open", "");
      const question = document.getElementById("discover-question");
      question?.scrollIntoView({ block: "center", behavior: "smooth" });
      question?.focus({ preventScroll: true });
    });
    return () => window.cancelAnimationFrame(frame);
  }, [activeStage, focusTarget]);

  useEffect(() => {
    if (!intelligenceOpen && shouldRestoreIntelligenceFocus.current) {
      collapsedIntelligenceButtonRef.current?.focus();
      shouldRestoreIntelligenceFocus.current = false;
    }
  }, [intelligenceOpen]);

  function closeIntelligence() {
    shouldRestoreIntelligenceFocus.current = true;
    setIntelligenceOpen(false);
  }

  function openIntelligence() {
    setIntelligenceOpen(true);
  }

  useEffect(() => {
    let active = true;
    void (async () => {
      try {
        const db = createClient();
        const { data: auth, error: authError } = await db.auth.getUser();
        if (authError || !auth.user) {
          if (active) setMessage("Sign in to open a connected Product Work workspace.");
          return;
        }
        const { data: workspace, error: workspaceError } = await db.from("workspaces").select("id,name").order("created_at", { ascending: true }).limit(1).maybeSingle();
        if (workspaceError) throw workspaceError;
        if (!workspace) {
          if (active) setMessage("Create a workspace before opening Product Work.");
          return;
        }
        const [runs, evidence, assumptions, decisions] = await Promise.all([
          db.from("workflow_runs").select("id,workflow_name,status,input,updated_at,created_at").eq("workspace_id", workspace.id).order("updated_at", { ascending: false }).limit(6),
          db.from("evidence_items").select("id,kind,title,content,source_label,created_at").eq("workspace_id", workspace.id).order("created_at", { ascending: false }).limit(3),
          db.from("assumptions").select("id,statement,impact,status").eq("workspace_id", workspace.id).eq("status", "unvalidated").order("updated_at", { ascending: false }).limit(3),
          db.from("decision_records").select("id,title,status").eq("workspace_id", workspace.id).order("updated_at", { ascending: false }).limit(3),
        ]);
        if ([runs, evidence, assumptions, decisions].some((item) => item.error)) throw Error("load");
        if (active) {
          const latestRun = runs.data?.[0] ?? null;
          const workItemRun = runs.data?.find((item) => item.workflow_name === "discover_synthesize" && extractQuestion(item.input)) ?? latestRun;
          const workQuestion = workItemRun ? extractQuestion(workItemRun.input) : "";
          setData({ name: workspace.name, title: workQuestion ? workItemTitle(workQuestion) : workItemRun ? workflowLabel(workItemRun.workflow_name) : "New product work", question: workQuestion, run: latestRun, evidence: evidence.data ?? [], assumptions: assumptions.data ?? [], decisions: decisions.data ?? [] });
          setMessage("");
        }
      } catch {
        if (active) setMessage("Product Work could not be loaded. Open Home or refresh to retry.");
      }
    })();
    return () => { active = false; };
  }, []);

  const workStage = stageForRun(data?.run ?? null);
  const currentStage = stages.find((stage) => stage.id === activeStage) ?? stages[0];
  const statusLabel = !data ? "Loading" : data.run?.status === "running" ? "In progress" : data.run?.status === "failed" ? "Needs review" : "Reviewable";

  return (
    <section className={`product-work-screen product-work-screen-${activeStage} ${intelligenceOpen ? "" : "product-work-screen-collapsed"}`} aria-label="Product Work workspace">
      <header className="product-work-header">
        <div className="product-work-breadcrumb"><a href="#overview">Home</a><span aria-hidden="true">/</span><span>Product work</span><span aria-hidden="true">/</span><strong>{currentStage.label}</strong></div>
        <div className="product-work-heading-row"><div><p className="signal-overline">PRODUCT WORK / {currentStage.label.toUpperCase()}</p><h1>{data?.title ?? "Current product work"}</h1><p>One connected workspace for the question, evidence, decision, and output.</p></div><span className={`product-work-status ${!data ? "is-loading" : ""}`}><span />{statusLabel}</span></div>
        <nav className="product-stage-nav" aria-label="Product Work stages">
          {stages.map((stage) => <a key={stage.id} href={stageHref(stage.id)} className={`${stage.id === activeStage ? "is-current" : ""} ${stage.id === workStage ? "is-recorded" : ""}`} aria-current={stage.id === activeStage ? "step" : undefined}><span className="product-stage-icon"><UiIcon name={stage.icon} size={16} /></span><span><strong>{stage.label}</strong><small>{stage.description}</small></span>{stage.id === workStage && <em aria-label="Latest recorded workflow stage">Recorded</em>}</a>)}
        </nav>
      </header>

      <div className="product-work-body">
        <main className="product-work-canvas">
          <div className="product-work-canvas-header"><div><p className="signal-overline">{currentStage.label.toUpperCase()} / WORKING SURFACE</p><h2 id={`${activeStage}-heading`}>{currentStage.description}</h2></div><span className="product-work-run-meta">{data?.run ? `Run updated ${dateLabel(data.run.updated_at)}` : "No workflow run recorded yet"}</span></div>
          {message && <p role="status" className="product-work-status-message">{message}</p>}
          <div className="product-work-stage-panels">
            <section hidden={activeStage !== "discover"} className="product-work-stage-panel" aria-labelledby="discover-heading"><DiscoverOverview data={data} /><NextBestAction action="Investigate which setup steps create the most friction." href="#discover-question">Start with the decision this evidence needs to inform.</NextBestAction><DiscoverWorkflowPanel compact /></section>
            <section hidden={activeStage !== "define"} className="product-work-stage-panel" aria-labelledby="define-heading"><DefineWorkflowPanel /></section>
            <section hidden={activeStage !== "align"} className="product-work-stage-panel" aria-labelledby="align-heading"><AlignWorkflowPanel /></section>
            <section hidden={activeStage !== "deliver"} className="product-work-stage-panel" aria-labelledby="deliver-heading"><div className="pm-stage-intro"><div><p className="pm-eyebrow">WORKFLOW 04 · DELIVER</p><h2 id="deliver-output-heading">Choose what to produce next</h2><p className="pm-page-description">Turn the approved direction into an output your team can use.</p></div></div><div className="pm-deliver-options"><a href="#artifacts"><strong>PRD</strong><span>Turn the defined opportunity into a reviewable product brief.</span><UiIcon name="file" size={16} /></a><a href="#decisions"><strong>Decision record</strong><span>Preserve the choice, rationale, and evidence behind it.</span><UiIcon name="split" size={16} /></a><a href="#metrics"><strong>Experiment plan</strong><span>Make the next measurable bet explicit.</span><UiIcon name="chart" size={16} /></a><a href="#artifacts"><strong>Opportunity brief</strong><span>Share the context and next action with stakeholders.</span><UiIcon name="archive" size={16} /></a></div><CompactEmptyState title="Deliverables stay reviewable" body="Create or save an output through the existing workflow and artifact library." icon="archive" action={<a className="pm-button pm-button-secondary" href="#artifacts">Open artifacts <UiIcon name="arrow-up-right" size={14} /></a>} /><NextBestAction action="Open the artifact library and choose the output to share." href="#artifacts">The delivery destination remains the existing durable workspace.</NextBestAction></section>
          </div>
        </main>

        {!intelligenceOpen && <button ref={collapsedIntelligenceButtonRef} type="button" className="signal-intelligence-collapsed" onClick={openIntelligence} aria-controls="product-work-intelligence" aria-expanded={false} aria-label="Open contextual intelligence"><UiIcon name="activity" size={16} /><span>Intelligence</span><UiIcon name="chevron-down" size={14} /></button>}
        {intelligenceOpen && <button type="button" className="signal-intelligence-scrim" onClick={closeIntelligence} aria-label="Close contextual intelligence" />}
        {intelligenceOpen && <aside id="product-work-intelligence" className="pm-context-drawer" aria-label="Product Work context">
          <div className="pm-context-drawer-header"><div><p className="pm-eyebrow">CONTEXT</p><h2>For this product work</h2></div><button type="button" onClick={closeIntelligence} aria-label="Collapse contextual panel"><UiIcon name="chevron-down" size={16} /></button></div>
          <div className="pm-context-counts"><a href="#evidence"><span>Evidence</span><strong>{data?.evidence.length ?? "—"}</strong></a><a href="#decisions"><span>Assumptions</span><strong>{data?.assumptions.length ?? "—"}</strong></a><a href="#decisions"><span>Decisions</span><strong>{data?.decisions.length ?? "—"}</strong></a></div>
          {data?.evidence.length ? <div className="pm-context-insight"><p className="pm-eyebrow">CONTEXTUAL INSIGHT</p><p>Current evidence confirms that {data.evidence[0].content.toLowerCase().replace(/[.!?]$/, "")}, but does not yet identify the highest-friction step.</p><a href="#evidence">View evidence <UiIcon name="arrow-up-right" size={13} /></a></div> : <p className="pm-context-empty">Add source-backed evidence to make this panel useful.</p>}
        </aside>}
      </div>
    </section>
  );
}
