"use client";

import { useEffect, useState } from "react";
import { authenticatedFetch } from "@/lib/supabase/auth-fetch";
import { createClient } from "@/lib/supabase/client";
import PmEntryPanel from "./pm-entry-panel";
import UiIcon, { type IconName } from "./ui-icons";
import { CompactEmptyState, NextBestAction, StatusBadge } from "./workspace-primitives";
import { resolveDisplayFirstName } from "@/lib/beta/name";

type EvidencePreview = { id: string; kind: string; title: string; content: string; source_label: string; created_at: string };
type WorkflowRun = { id: string; workflow_name: string; status: string; input: unknown; created_at: string; updated_at: string };
type Snapshot = {
  name: string;
  greetingName: string;
  greeting: string;
  context: number;
  documents: number;
  evidence: number;
  decisions: { id: string; title: string; status: string }[];
  assumptions: { id: string; statement: string; impact: string; status: string; updated_at: string }[];
  artifacts: { id: string; title: string; kind: string }[];
  runs: WorkflowRun[];
  evidenceItems: EvidencePreview[];
};

const stageLabels = { discover: "Discover", define: "Define", align: "Align", deliver: "Deliver" } as const;
const stageIcons: Record<keyof typeof stageLabels, IconName> = { discover: "compass", define: "file", align: "message", deliver: "archive" };

function stageForWorkflow(name: string): keyof typeof stageLabels {
  if (name === "define_specify") return "define";
  if (name === "align_communicate") return "align";
  return "discover";
}

function workflowHref(name: string) {
  if (name === "define_specify") return "#define";
  if (name === "align_communicate") return "#align";
  return "#discover";
}

function workflowLabel(name: string) {
  return name.replaceAll("_", " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function runQuestion(input: unknown) {
  if (!input || typeof input !== "object" || Array.isArray(input)) return "";
  const value = (input as Record<string, unknown>).question;
  return typeof value === "string" ? value.trim() : "";
}

function dateLabel(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Recently";
  return new Intl.DateTimeFormat("en", { month: "short", day: "numeric" }).format(date);
}

function personLabel(metadata: unknown) {
  if (metadata && typeof metadata === "object" && !Array.isArray(metadata)) {
    const values = metadata as Record<string, unknown>;
    return resolveDisplayFirstName(null, typeof values.full_name === "string" ? values.full_name : null, typeof values.first_name === "string" ? values.first_name : null);
  }
  return null;
}

export default function WorkspaceOverview() {
  const [data, setData] = useState<Snapshot | null>(null);
  const [message, setMessage] = useState("Loading your workspace…");
  const [revision, setRevision] = useState(0);

  useEffect(() => {
    try {
      const { data: subscription } = createClient().auth.onAuthStateChange((event) => {
        if (event === "SIGNED_IN" || event === "SIGNED_OUT") {
          setData(null);
          setRevision((value) => value + 1);
        }
      });
      return () => subscription.subscription.unsubscribe();
    } catch {
      // The loading message below remains honest when Supabase is unavailable.
    }
  }, []);

  useEffect(() => {
    let active = true;
    void (async () => {
      try {
        const db = createClient();
        const { data: auth, error: authError } = await db.auth.getUser();
        if (authError || !auth.user) {
          if (active) setMessage("Sign in to see your product work and review queue.");
          return;
        }

        const { data: workspace, error: workspaceError } = await db.from("workspaces").select("id,name").order("created_at", { ascending: true }).limit(1).maybeSingle();
        if (workspaceError) throw workspaceError;
        if (!workspace) {
          if (active) setMessage("Create your workspace in Product context to get started.");
          return;
        }
        void authenticatedFetch("/api/analytics", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ eventName: "workspace_viewed", surface: "home" }) }).catch(() => undefined);
        const betaResponse = await authenticatedFetch(`/api/beta/me?locale=${encodeURIComponent(window.navigator.language)}`, { cache: "no-store" }).catch(() => null);
        const betaPayload = betaResponse?.ok ? await betaResponse.json() as { greeting?: string; displayName?: string } : null;

        const [context, documents, evidence, decisions, assumptions, artifacts, runs, evidenceItems] = await Promise.all([
          db.from("context_items").select("id", { count: "exact", head: true }).eq("workspace_id", workspace.id),
          db.from("documents").select("id", { count: "exact", head: true }).eq("workspace_id", workspace.id),
          db.from("evidence_items").select("id", { count: "exact", head: true }).eq("workspace_id", workspace.id),
          db.from("decision_records").select("id,title,status").eq("workspace_id", workspace.id).order("updated_at", { ascending: false }).limit(5),
          db.from("assumptions").select("id,statement,impact,status,updated_at").eq("workspace_id", workspace.id).order("updated_at", { ascending: false }),
          db.from("artifacts").select("id,title,kind").eq("workspace_id", workspace.id).order("updated_at", { ascending: false }).limit(3),
          db.from("workflow_runs").select("id,workflow_name,status,input,created_at,updated_at").eq("workspace_id", workspace.id).order("updated_at", { ascending: false }).limit(5),
          db.from("evidence_items").select("id,kind,title,content,source_label,created_at").eq("workspace_id", workspace.id).order("created_at", { ascending: false }).limit(3),
        ]);

        if ([context, documents, evidence, decisions, assumptions, artifacts, runs, evidenceItems].some((item) => item.error)) throw Error("load");
        if (active) {
          setData({
            name: workspace.name,
            greetingName: betaPayload?.displayName || personLabel(auth.user.user_metadata) || "",
            greeting: betaPayload?.greeting || "Welcome",
            context: context.count ?? 0,
            documents: documents.count ?? 0,
            evidence: evidence.count ?? 0,
            decisions: decisions.data ?? [],
            assumptions: assumptions.data ?? [],
            artifacts: artifacts.data ?? [],
            runs: runs.data ?? [],
            evidenceItems: evidenceItems.data ?? [],
          });
          setMessage("");
        }
      } catch {
        if (active) setMessage("Workspace summary could not be loaded. Open a library or refresh to retry.");
      }
    })();
    return () => { active = false; };
  }, [revision]);

  const openAssumptions = data?.assumptions.filter((item) => item.status === "unvalidated") ?? [];
  const attentionItems = [
    ...(data?.decisions ?? []).map((item) => ({ type: "Decision", title: item.title, detail: item.status, date: "Review", href: "#decisions", icon: "split" as IconName, tone: "coral" })),
    ...openAssumptions.map((item) => ({ type: "Assumption", title: item.statement, detail: `${item.impact} impact · needs validation`, date: dateLabel(item.updated_at), href: "#decisions", icon: "check" as IconName, tone: "amber" })),
    ...(data?.evidenceItems ?? []).slice(0, 2).map((item) => ({ type: "Evidence", title: item.title, detail: item.source_label, date: dateLabel(item.created_at), href: "#evidence", icon: "scan" as IconName, tone: "blue" })),
  ].slice(0, 3);
  const firstRun = data?.runs[0];
  const nextAction = attentionItems[0]
    ? { action: `Review ${attentionItems[0].type.toLowerCase()}: ${attentionItems[0].title}`, href: attentionItems[0].href, detail: "Start with the item closest to a product decision." }
    : firstRun
      ? { action: `Review ${stageLabels[stageForWorkflow(firstRun.workflow_name)]} output`, href: workflowHref(firstRun.workflow_name), detail: "Carry the reviewed work into the next stage." }
      : { action: "Start with a focused product question", href: "#discover", detail: "Turn the question into a source-backed investigation." };

  const isLoading = !data && message.startsWith("Loading");
  const hasUnavailableState = !data && !isLoading;
  const needsWorkspace = message.startsWith("Create your workspace");

  return (
    <section className="pm-home" aria-label="Bootstrap PM home workspace">
      <header className="pm-home-header"><div><p className="pm-eyebrow">{data?.name || "PRODUCT WORKSPACE"}</p><h1>{data?.greeting ?? "Welcome"}{data?.greetingName ? `, ${data.greetingName}` : ""}</h1><p className="pm-page-description">Your focused place to move a product question toward a decision.</p></div><div className="pm-home-header-note"><span className="pm-home-live-dot" aria-hidden="true" />Private workspace<br /><strong>Context stays with the work.</strong></div></header>

      <section className="pm-ask-surface" aria-labelledby="pm-ask-heading">
        <div><p className="pm-eyebrow">START HERE</p><h2 id="pm-ask-heading">Ask Bootstrap PM</h2></div>
        <PmEntryPanel compact />
      </section>

      {message && !hasUnavailableState && <p role="status" className="pm-status-message">{message}</p>}

      {isLoading ? <div className="pm-loading-state" role="status" aria-label="Loading workspace summary"><span className="pm-loading-line pm-loading-line-wide" /><span className="pm-loading-line" /><span className="pm-loading-line pm-loading-line-short" /><p>Loading your work queue and review items…</p></div> : hasUnavailableState ? <section className="pm-home-unavailable" role={needsWorkspace ? "status" : "alert"}><div><p className="pm-eyebrow">{needsWorkspace ? "READY WHEN YOU ARE" : "WORKSPACE UNAVAILABLE"}</p><h2>{needsWorkspace ? "Start your product workspace." : "We couldn’t read your workspace summary."}</h2><p>{message}</p></div><div className="pm-home-unavailable-actions"><button type="button" className="pm-button pm-button-secondary" onClick={() => { setMessage("Loading your workspace…"); setRevision((value) => value + 1); }}>Try again</button><a className="pm-button pm-button-ghost" href="#context">Open product context <UiIcon name="arrow-up-right" size={14} /></a></div></section> : <div className="pm-home-grid"><div className="pm-home-main">
      <section className="pm-home-section" aria-labelledby="product-work-heading">
        <div className="pm-section-header"><div><p className="pm-eyebrow">WORK QUEUE</p><h2 id="product-work-heading">Your product work</h2></div><a href="#activity" className="pm-inline-link">View all <UiIcon name="arrow-up-right" size={13} /></a></div>
        {data?.runs.length ? <div className="pm-work-list">{data.runs.slice(0, 3).map((run) => { const stage = stageForWorkflow(run.workflow_name); return <a className="pm-work-row" href={workflowHref(run.workflow_name)} key={run.id}><span className="pm-work-row-icon"><UiIcon name={stageIcons[stage]} size={17} /></span><span className="pm-work-row-copy"><strong>{runQuestion(run.input) || workflowLabel(run.workflow_name)}</strong><small>{workflowLabel(run.workflow_name)} · Updated {dateLabel(run.updated_at)}</small></span><StatusBadge label={stageLabels[stage]} tone={stage === "align" ? "violet" : stage === "define" ? "blue" : "neutral"} /><UiIcon name="chevron-right" size={15} /></a>; })}</div> : <CompactEmptyState title="No active product work yet" body="Start with the product question you need to answer." icon="compass" action={<a className="pm-button pm-button-primary" href="#discover">Start product work <UiIcon name="arrow-up-right" size={14} /></a>} />}
      </section>

      <section className="pm-home-section" aria-labelledby="attention-heading">
        <div className="pm-section-header"><div><p className="pm-eyebrow">REVIEW QUEUE</p><h2 id="attention-heading">Needs your attention</h2></div><a href="#decisions" className="pm-inline-link">View all <UiIcon name="arrow-up-right" size={13} /></a></div>
        {attentionItems.length ? <div className="pm-attention-list">{attentionItems.map((item) => <a className="pm-attention-row" key={`${item.type}-${item.title}`} href={item.href}><span className={`pm-attention-icon pm-tone-${item.tone}`}><UiIcon name={item.icon} size={15} /></span><span><strong>{item.title}</strong><small>{item.detail}</small></span><StatusBadge label={item.type} tone={item.tone as "blue" | "amber" | "coral"} /><span className="pm-attention-date">{item.date}</span><UiIcon name="chevron-right" size={14} /></a>)}</div> : <CompactEmptyState title="Nothing needs your attention yet" body="New decisions, assumptions, and evidence will appear here when they need review." icon="check" />}
      </section>

      <NextBestAction action={nextAction.action} href={nextAction.href}>{nextAction.detail}</NextBestAction>
      </div><aside className="pm-home-rail" aria-label="Workspace readiness">
        <section className="pm-home-rail-card" aria-labelledby="readiness-heading"><div className="pm-section-header"><div><p className="pm-eyebrow">READINESS</p><h2 id="readiness-heading">Your foundation</h2></div><UiIcon name="layers" size={18} /></div><ul className="pm-readiness-list"><li><a href="#context"><span><UiIcon name="layers" size={15} /><strong>Product context</strong></span><b>{data?.context ?? 0}</b><small>{data?.context ? "facts saved" : "Add the product basics"}</small></a></li><li><a href="#documents"><span><UiIcon name="files" size={15} /><strong>Documents</strong></span><b>{data?.documents ?? 0}</b><small>{data?.documents ? "files available" : "Add a source file"}</small></a></li><li><a href="#evidence"><span><UiIcon name="scan" size={15} /><strong>Evidence</strong></span><b>{data?.evidence ?? 0}</b><small>{data?.evidence ? "items traceable" : "Record what you know"}</small></a></li></ul></section>
        <section className="pm-home-rail-card pm-home-evidence-card" aria-labelledby="evidence-preview-heading"><div className="pm-section-header"><div><p className="pm-eyebrow">RECENT KNOWLEDGE</p><h2 id="evidence-preview-heading">Latest evidence</h2></div><a href="#evidence" className="pm-inline-link" aria-label="Open evidence library"><UiIcon name="arrow-up-right" size={14} /></a></div>{data?.evidenceItems.length ? <ul className="pm-evidence-preview-list">{data.evidenceItems.map((item) => <li key={item.id}><span className="pm-evidence-kind">{item.kind}</span><strong>{item.title}</strong><small>{item.source_label} · {dateLabel(item.created_at)}</small></li>)}</ul> : <CompactEmptyState title="No evidence saved yet" body="Evidence gives Discover something concrete to work with." action={<a className="pm-button pm-button-secondary" href="#evidence">Add evidence <UiIcon name="arrow-up-right" size={14} /></a>} />}</section>
      </aside></div>}
    </section>
  );
}
