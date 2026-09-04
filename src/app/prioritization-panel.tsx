"use client";

import { FormEvent, useMemo, useState } from "react";
import { calculatePriorityScore, getPlanningLane, type PlanningLane } from "@/lib/planning";

type Candidate = { id: string; title: string; impact: number; confidence: number; urgency: number; effort: number };

const scoreOptions = [1, 2, 3, 4, 5];
const initialForm = { title: "", impact: 3, confidence: 3, urgency: 3, effort: 3 };

export default function PrioritizationPanel() {
  const [items, setItems] = useState<Candidate[]>([]);
  const [form, setForm] = useState(initialForm);
  const rankedItems = useMemo(() => [...items].sort((a, b) => calculatePriorityScore(b) - calculatePriorityScore(a)), [items]);

  function addItem(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!form.title.trim()) return;
    setItems((current) => [...current, { ...form, title: form.title.trim(), id: crypto.randomUUID() }]);
    setForm(initialForm);
  }

  return <div>
    <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start"><div><p className="text-xs font-bold uppercase tracking-[0.18em] text-[#4d8c65]">T16 · DETERMINISTIC PLANNING</p><h2 id="planning-heading" className="mt-2 text-2xl font-semibold tracking-[-0.04em] text-[#192235]">Prioritize the work with a clear method</h2><p className="mt-2 max-w-2xl text-sm leading-6 text-[#68748a]">Compare initiatives using impact, confidence, urgency, and effort. The score is transparent and calculated locally; no AI call is used.</p></div><span className="inline-flex w-fit items-center gap-2 rounded-full border border-[#cfe5d6] bg-[#f5fbf6] px-3 py-2 text-xs font-semibold text-[#4d8c65]"><span className="h-2 w-2 rounded-full bg-[#53b67b]" />Ready</span></div>
    <form onSubmit={addItem} className="mt-6 rounded-xl border border-[#cfe5d6] bg-[#f8fcf9] p-4 sm:p-5"><div className="grid gap-4 lg:grid-cols-[minmax(0,1.5fr)_repeat(4,minmax(80px,0.5fr))]"><label htmlFor="priority-title" className="grid gap-2 text-xs font-semibold text-[#526075]">Initiative or opportunity<input id="priority-title" required maxLength={200} value={form.title} onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))} placeholder="For example: Reduce setup steps" className="rounded-lg border border-[#d8dee8] bg-white px-3.5 py-3 text-sm font-normal text-[#192235] outline-none placeholder:text-[#a0a9b8] focus:border-[#4d8c65] focus:ring-2 focus:ring-[#e1f0e5]" /></label>{(["impact", "confidence", "urgency", "effort"] as const).map((field) => <label key={field} htmlFor={`priority-${field}`} className="grid gap-2 text-xs font-semibold capitalize text-[#526075]">{field}<select id={`priority-${field}`} value={form[field]} onChange={(event) => setForm((current) => ({ ...current, [field]: Number(event.target.value) }))} className="rounded-lg border border-[#d8dee8] bg-white px-3 py-3 text-sm font-normal text-[#192235] outline-none focus:border-[#4d8c65] focus:ring-2 focus:ring-[#e1f0e5]">{scoreOptions.map((score) => <option key={score} value={score}>{score} / 5</option>)}</select></label>)}</div><div className="mt-4 flex flex-wrap items-center justify-between gap-3"><p className="text-xs leading-5 text-[#8d98a9]">Formula: impact × confidence × urgency ÷ effort.</p><button type="submit" className="rounded-lg bg-[#4d8c65] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#3d7453]">Add to plan</button></div></form>
    {rankedItems.length === 0 ? <div className="mt-6 rounded-xl border border-dashed border-[#d8dee8] px-5 py-8 text-center text-sm text-[#9aa4b3]">Add initiatives above to calculate a ranked plan.</div> : <div className="mt-6 overflow-hidden rounded-xl border border-[#e3e7ee] bg-white"><div className="grid grid-cols-[42px_minmax(0,1fr)_72px_78px_36px] gap-3 border-b border-[#e3e7ee] bg-[#fafbfc] px-4 py-3 text-[10px] font-bold uppercase tracking-[0.12em] text-[#8d98a9]"><span>#</span><span>Initiative</span><span>Score</span><span>Lane</span><span /></div>{rankedItems.map((item, index) => { const lane: PlanningLane = getPlanningLane(index); return <div key={item.id} className="grid grid-cols-[42px_minmax(0,1fr)_72px_78px_36px] items-center gap-3 border-b border-[#f0f2f5] px-4 py-3 last:border-0"><span className="text-sm font-semibold text-[#8d98a9]">{index + 1}</span><div><p className="text-sm font-semibold text-[#192235]">{item.title}</p><p className="mt-1 text-[11px] text-[#8d98a9]">I {item.impact} · C {item.confidence} · U {item.urgency} · E {item.effort}</p></div><span className="text-sm font-bold text-[#4d8c65]">{calculatePriorityScore(item).toFixed(2)}</span><span className={`w-fit rounded-full px-2 py-1 text-[10px] font-bold uppercase tracking-[0.1em] ${lane === "Now" ? "bg-[#e4f3e8] text-[#4d8c65]" : lane === "Next" ? "bg-[#eef1ff] text-[#5269d8]" : "bg-[#f3f5f8] text-[#8d98a9]"}`}>{lane}</span><button type="button" aria-label={`Remove ${item.title}`} onClick={() => setItems((current) => current.filter((candidate) => candidate.id !== item.id))} className="text-lg leading-none text-[#a0a9b8] hover:text-[#b4534b]">×</button></div>; })}</div>}
  </div>;
}
