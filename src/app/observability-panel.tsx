"use client";

import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Database } from "@/lib/supabase/database.types";

type Run = Database["public"]["Tables"]["workflow_runs"]["Row"];

export default function ObservabilityPanel() {
  const [runs, setRuns] = useState<Run[]>([]);
  const [message, setMessage] = useState("Loading workflow metrics…");

  useEffect(() => {
    let active = true;
    void (async () => {
      try {
        const supabase = createClient();
        const { data: auth } = await supabase.auth.getUser();
        if (!auth.user) { if (active) setMessage("Sign in to view workflow metrics."); return; }
        const { data: workspace } = await supabase.from("workspaces").select("id").order("created_at", { ascending: true }).limit(1).maybeSingle();
        if (!workspace) { if (active) setMessage("Create a workspace to view workflow metrics."); return; }
        const { data, error } = await supabase.from("workflow_runs").select("*").eq("workspace_id", workspace.id).order("created_at", { ascending: false }).limit(20);
        if (error) throw error;
        if (active) { setRuns(data ?? []); setMessage(""); }
      } catch { if (active) setMessage("Workflow metrics are not available yet."); }
    })();
    return () => { active = false; };
  }, []);

  const completed = runs.filter((run) => run.status === "completed");
  const averageDuration = useMemo(() => {
    const values = completed.flatMap((run) => run.duration_ms === null ? [] : [run.duration_ms]);
    return values.length ? Math.round(values.reduce((sum, value) => sum + value, 0) / values.length) : null;
  }, [completed]);
  const totalTokens = useMemo(() => completed.reduce((sum, run) => sum + (run.total_tokens ?? 0), 0), [completed]);

  return <div>
    <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start"><div><p className="text-xs font-bold uppercase tracking-[0.18em] text-[#4d8c65]">AI OBSERVABILITY</p><h2 id="observability-heading" className="mt-2 text-2xl font-semibold tracking-[-0.04em] text-[#192235]">See how workflows perform</h2><p className="mt-2 max-w-2xl text-sm leading-6 text-[#68748a]">Workflow telemetry records status, model, latency, and safe size metrics. Prompts, outputs, credentials, and provider payloads are not stored in this panel.</p></div><span className="inline-flex w-fit items-center gap-2 rounded-full border border-[#cfe5d6] bg-[#f5fbf6] px-3 py-2 text-xs font-semibold text-[#4d8c65]">Privacy-aware</span></div>
    <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4"><Metric label="Recent runs" value={String(runs.length)} /><Metric label="Completed" value={String(completed.length)} /><Metric label="Average latency" value={averageDuration === null ? "—" : `${averageDuration} ms`} /><Metric label="Total tokens" value={totalTokens > 0 ? totalTokens.toLocaleString() : "—"} /></div>
    {message && <p className="mt-4 text-xs text-[#8d98a9]">{message}</p>}
    {completed.length > 0 && <div className="mt-5 overflow-x-auto rounded-xl border border-[#e3e7ee] bg-white"><table className="w-full min-w-[620px] text-left text-xs"><thead className="border-b border-[#e3e7ee] text-[10px] uppercase tracking-[0.12em] text-[#8d98a9]"><tr><th className="px-4 py-3">Workflow</th><th className="px-4 py-3">Model</th><th className="px-4 py-3">Latency</th><th className="px-4 py-3">Tokens</th><th className="px-4 py-3">Tools</th></tr></thead><tbody>{completed.slice(0, 5).map((run) => <tr key={run.id} className="border-b border-[#f0f2f5] last:border-0"><td className="px-4 py-3 font-semibold text-[#192235]">{run.workflow_name}</td><td className="px-4 py-3 text-[#68748a]">{run.model ?? "—"}</td><td className="px-4 py-3 text-[#68748a]">{run.duration_ms === null ? "—" : `${run.duration_ms} ms`}</td><td className="px-4 py-3 text-[#68748a]">{run.total_tokens === null ? "—" : run.total_tokens.toLocaleString()}</td><td className="px-4 py-3 text-[#68748a]">{run.tool_names.join(" → ") || "—"}</td></tr>)}</tbody></table></div>}
  </div>;
}

function Metric({ label, value }: { label: string; value: string }) { return <div className="rounded-xl border border-[#e3e7ee] bg-white p-4"><p className="text-[10px] font-bold uppercase tracking-[0.12em] text-[#8d98a9]">{label}</p><p className="mt-2 text-xl font-semibold tracking-[-0.03em] text-[#192235]">{value}</p></div>; }
