"use client";

import { FormEvent, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { trackClientProductEvent } from "@/lib/analytics-client";
import type { Database } from "@/lib/supabase/database.types";

type Decision = Database["public"]["Tables"]["decision_records"]["Row"];
type Assumption = Database["public"]["Tables"]["assumptions"]["Row"];
type Evidence = Database["public"]["Tables"]["evidence_items"]["Row"];
type Artifact = Database["public"]["Tables"]["artifacts"]["Row"];

export default function DecisionAssumptionPanel() {
  const [workspaceId, setWorkspaceId] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [decisions, setDecisions] = useState<Decision[]>([]);
  const [assumptions, setAssumptions] = useState<Assumption[]>([]);
  const [evidenceItems, setEvidenceItems] = useState<Evidence[]>([]);
  const [artifacts, setArtifacts] = useState<Artifact[]>([]);
  const [decision, setDecision] = useState({ title: "", decision: "", rationale: "", risk_notes: "" });
  const [alternatives, setAlternatives] = useState("");
  const [linkedEvidenceIds, setLinkedEvidenceIds] = useState<string[]>([]);
  const [linkedAssumptionIds, setLinkedAssumptionIds] = useState<string[]>([]);
  const [linkedArtifactIds, setLinkedArtifactIds] = useState<string[]>([]);
  const [assumption, setAssumption] = useState({ statement: "", validation_plan: "", impact: "medium" as "low" | "medium" | "high", owner: "" });
  const [message, setMessage] = useState("");

  useEffect(() => {
    const load = async () => {
      try {
        const supabase = createClient();
        const { data: auth } = await supabase.auth.getUser();
        if (!auth.user) return;
        setUserId(auth.user.id);
        const { data: workspace } = await supabase.from("workspaces").select("id").order("created_at", { ascending: true }).limit(1).maybeSingle();
        if (!workspace) return;
        setWorkspaceId(workspace.id);
        const [{ data: decisionRows }, { data: assumptionRows }, { data: evidenceRows }, { data: artifactRows }] = await Promise.all([
          supabase.from("decision_records").select("*").eq("workspace_id", workspace.id).order("updated_at", { ascending: false }),
          supabase.from("assumptions").select("*").eq("workspace_id", workspace.id).order("updated_at", { ascending: false }),
          supabase.from("evidence_items").select("*").eq("workspace_id", workspace.id).order("created_at", { ascending: false }),
          supabase.from("artifacts").select("*").eq("workspace_id", workspace.id).order("updated_at", { ascending: false }),
        ]);
        setDecisions(decisionRows ?? []);
        setAssumptions(assumptionRows ?? []);
        setEvidenceItems(evidenceRows ?? []);
        setArtifacts(artifactRows ?? []);
      } catch {
        setMessage("Sign in and configure Supabase to use decisions and assumptions.");
      }
    };
    void load();
  }, []);

  async function saveDecision(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!workspaceId || !userId || !decision.title.trim() || !decision.decision.trim() || !decision.rationale.trim()) return;
    const supabase = createClient();
    const { data, error } = await supabase.from("decision_records").insert({ workspace_id: workspaceId, ...decision, title: decision.title.trim(), decision: decision.decision.trim(), rationale: decision.rationale.trim(), alternatives: alternatives.split("\n").map((item) => item.trim()).filter(Boolean), evidence_ids: linkedEvidenceIds, assumption_ids: linkedAssumptionIds, artifact_ids: linkedArtifactIds, created_by: userId, updated_by: userId }).select("*").single();
    if (error) { setMessage("The decision could not be saved."); return; }
    setDecisions((current) => [data, ...current]);
    setDecision({ title: "", decision: "", rationale: "", risk_notes: "" });
    setAlternatives("");
    setLinkedEvidenceIds([]);
    setLinkedAssumptionIds([]);
    setLinkedArtifactIds([]);
    trackClientProductEvent("decision_created", "decisions");
    setMessage("Decision record saved.");
  }

  async function saveAssumption(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!workspaceId || !userId || !assumption.statement.trim() || !assumption.validation_plan.trim()) return;
    const supabase = createClient();
    const { data, error } = await supabase.from("assumptions").insert({ workspace_id: workspaceId, ...assumption, statement: assumption.statement.trim(), validation_plan: assumption.validation_plan.trim(), owner: assumption.owner.trim(), created_by: userId, updated_by: userId }).select("*").single();
    if (error) { setMessage("The assumption could not be saved."); return; }
    setAssumptions((current) => [data, ...current]);
    setAssumption({ statement: "", validation_plan: "", impact: "medium", owner: "" });
    trackClientProductEvent("assumption_created", "assumptions");
    setMessage("Assumption added to the registry.");
  }

  return <div>
    <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start"><div><p className="text-xs font-bold uppercase tracking-[0.18em] text-[#5269d8]">DECISIONS & ASSUMPTIONS</p><h2 id="decision-assumption-heading" className="mt-2 text-2xl font-semibold tracking-[-0.04em] text-[#192235]">Make reasoning durable</h2><p className="mt-2 max-w-2xl text-sm leading-6 text-[#68748a]">Record what was decided, why it was decided, and which beliefs still need validation. These records stay scoped to this workspace.</p></div><span className="inline-flex w-fit items-center gap-2 rounded-full border border-[#dfe4ff] bg-[#f6f7ff] px-3 py-2 text-xs font-semibold text-[#5269d8]">Human owned</span></div>
    <div className="mt-6 grid gap-5 lg:grid-cols-2">
      <form onSubmit={saveDecision} className="rounded-xl border border-[#e3e7ee] bg-white p-4"><h3 className="text-base font-semibold text-[#192235]">Decision record</h3><div className="mt-4 grid gap-3"><input aria-label="Decision title" required maxLength={200} value={decision.title} onChange={(e) => setDecision({ ...decision, title: e.target.value })} placeholder="Decision title" className="rounded-lg border border-[#d8dee8] px-3 py-2.5 text-sm" /><textarea aria-label="Decision" required maxLength={5000} value={decision.decision} onChange={(e) => setDecision({ ...decision, decision: e.target.value })} placeholder="What was decided?" className="min-h-20 rounded-lg border border-[#d8dee8] px-3 py-2.5 text-sm" /><textarea aria-label="Decision alternatives" maxLength={5000} value={alternatives} onChange={(e) => setAlternatives(e.target.value)} placeholder="Alternatives considered (one per line)" className="min-h-20 rounded-lg border border-[#d8dee8] px-3 py-2.5 text-sm" /><textarea aria-label="Decision rationale" required maxLength={5000} value={decision.rationale} onChange={(e) => setDecision({ ...decision, rationale: e.target.value })} placeholder="Rationale and evidence considered" className="min-h-20 rounded-lg border border-[#d8dee8] px-3 py-2.5 text-sm" /><input aria-label="Decision risks" maxLength={5000} value={decision.risk_notes} onChange={(e) => setDecision({ ...decision, risk_notes: e.target.value })} placeholder="Risks or trade-offs (optional)" className="rounded-lg border border-[#d8dee8] px-3 py-2.5 text-sm" /></div><LinkPicker legend="Link supporting evidence" items={evidenceItems.map((item) => ({ id: item.id, label: item.title, detail: item.source_label }))} selectedIds={linkedEvidenceIds} onToggle={(id) => setLinkedEvidenceIds((current) => current.includes(id) ? current.filter((value) => value !== id) : [...current, id])} emptyLabel="Add evidence first to link it here." /><LinkPicker legend="Link assumptions" items={assumptions.map((item) => ({ id: item.id, label: item.statement, detail: `${item.impact} impact · ${item.status}` }))} selectedIds={linkedAssumptionIds} onToggle={(id) => setLinkedAssumptionIds((current) => current.includes(id) ? current.filter((value) => value !== id) : [...current, id])} emptyLabel="No assumptions available yet." /><LinkPicker legend="Link resulting artifacts" items={artifacts.map((item) => ({ id: item.id, label: item.title, detail: item.kind.replace("_", " ") }))} selectedIds={linkedArtifactIds} onToggle={(id) => setLinkedArtifactIds((current) => current.includes(id) ? current.filter((value) => value !== id) : [...current, id])} emptyLabel="Save an artifact first to link it here." /><button type="submit" className="mt-4 rounded-lg bg-[#5269d8] px-4 py-2.5 text-sm font-semibold text-white">Save decision</button></form>
      <form onSubmit={saveAssumption} className="rounded-xl border border-[#e3e7ee] bg-white p-4"><h3 className="text-base font-semibold text-[#192235]">Assumption registry</h3><div className="mt-4 grid gap-3"><textarea aria-label="Assumption statement" required maxLength={3000} value={assumption.statement} onChange={(e) => setAssumption({ ...assumption, statement: e.target.value })} placeholder="What do we believe but still need to validate?" className="min-h-20 rounded-lg border border-[#d8dee8] px-3 py-2.5 text-sm" /><textarea aria-label="Validation plan" required maxLength={3000} value={assumption.validation_plan} onChange={(e) => setAssumption({ ...assumption, validation_plan: e.target.value })} placeholder="How will we validate it?" className="min-h-20 rounded-lg border border-[#d8dee8] px-3 py-2.5 text-sm" /><div className="grid grid-cols-2 gap-3"><select aria-label="Assumption impact" value={assumption.impact} onChange={(e) => setAssumption({ ...assumption, impact: e.target.value as typeof assumption.impact })} className="rounded-lg border border-[#d8dee8] px-3 py-2.5 text-sm"><option value="low">Low impact</option><option value="medium">Medium impact</option><option value="high">High impact</option></select><input aria-label="Assumption owner" maxLength={200} value={assumption.owner} onChange={(e) => setAssumption({ ...assumption, owner: e.target.value })} placeholder="Owner (optional)" className="rounded-lg border border-[#d8dee8] px-3 py-2.5 text-sm" /></div></div><button type="submit" className="mt-4 rounded-lg bg-[#5269d8] px-4 py-2.5 text-sm font-semibold text-white">Add assumption</button></form>
    </div>
    {message && <p role="status" className="mt-4 text-xs text-[#4d8c65]">{message}</p>}
    <div className="mt-5 grid gap-3 lg:grid-cols-2"><div className="rounded-xl border border-[#e3e7ee] bg-white p-4"><h3 className="text-sm font-semibold text-[#192235]">Recent decisions</h3>{decisions.length === 0 ? <p className="mt-3 text-xs text-[#9aa4b3]">No decision records yet.</p> : <div className="mt-3 space-y-3">{decisions.map((item) => <article key={item.id} className="rounded-lg bg-[#fafbfc] p-3"><div className="flex justify-between gap-2"><p className="text-sm font-semibold text-[#192235]">{item.title}</p><span className="text-[10px] font-bold uppercase text-[#5269d8]">{item.status}</span></div><p className="mt-1 text-xs leading-5 text-[#68748a]">{item.decision}</p><details className="kit-record-detail"><summary>Rationale &amp; risks</summary><h4>Why this direction</h4><p>{item.rationale}</p><h4>Risks</h4><p>{item.risk_notes || "No risks recorded."}</p><p>{item.evidence_ids.length} linked evidence items · {item.artifact_ids.length} linked artifacts</p><p>Updated {new Date(item.updated_at).toLocaleDateString()}</p></details></article>)}</div>}</div><div className="rounded-xl border border-[#e3e7ee] bg-white p-4"><h3 className="text-sm font-semibold text-[#192235]">Assumptions to validate</h3>{assumptions.length === 0 ? <p className="mt-3 text-xs text-[#9aa4b3]">No assumptions registered yet.</p> : <div className="mt-3 space-y-3">{assumptions.map((item) => <article key={item.id} className="rounded-lg bg-[#fafbfc] p-3"><div className="flex justify-between gap-2"><p className="text-sm font-semibold text-[#192235]">{item.statement}</p><span className="text-[10px] font-bold uppercase text-[#aa7625]">{item.impact} impact · {item.status}</span></div><p className="mt-1 text-xs leading-5 text-[#68748a]">Plan: {item.validation_plan}</p><p className="mt-2 text-xs">Owner: {item.owner || "Unassigned"} · {item.evidence_ids.length} linked evidence items</p></article>)}</div>}</div></div>
  </div>;
}

function LinkPicker({ legend, items, selectedIds, onToggle, emptyLabel }: { legend: string; items: Array<{ id: string; label: string; detail: string }>; selectedIds: string[]; onToggle: (id: string) => void; emptyLabel: string }) {
  return <fieldset className="mt-4 rounded-lg border border-[#e3e7ee] bg-[#fafbfc] p-3"><legend className="px-1 text-xs font-semibold text-[#526075]">{legend}</legend>{items.length === 0 ? <p className="mt-1 text-xs leading-5 text-[#8d98a9]">{emptyLabel}</p> : <div className="mt-1 grid gap-1.5">{items.slice(0, 8).map((item) => <label key={item.id} className="flex min-h-11 cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-xs text-[#526075] hover:bg-white"><input type="checkbox" checked={selectedIds.includes(item.id)} onChange={() => onToggle(item.id)} className="h-4 w-4 accent-[#5269d8]" /><span className="min-w-0"><span className="block truncate font-semibold text-[#192235]">{item.label}</span><span className="block truncate text-[11px] text-[#8d98a9]">{item.detail}</span></span></label>)}</div>}</fieldset>;
}
