import { NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";
import type { Json } from "@/lib/supabase/database.types";

type Target = "define_specify" | "align_communicate";

function errorResponse(message: string, status: number) { return NextResponse.json({ error: message }, { status }); }

export async function GET(request: Request) {
  const target = new URL(request.url).searchParams.get("target");
  if (target !== "define_specify" && target !== "align_communicate") return errorResponse("Choose a supported handoff target.", 400);
  try {
    const supabase = await createClient();
    const { data: userData, error: userError } = await supabase.auth.getUser();
    if (userError || !userData.user) return errorResponse("Sign in before reading workflow handoffs.", 401);
    const { data: workspace, error: workspaceError } = await supabase.from("workspaces").select("id").order("created_at", { ascending: true }).limit(1).maybeSingle();
    if (workspaceError) throw workspaceError;
    if (!workspace) return NextResponse.json({ handoff: null });
    const { data: handoff, error } = await supabase.from("workflow_handoffs").select("id, source_run_id, target_workflow, status, payload, approved_at").eq("workspace_id", workspace.id).eq("target_workflow", target).eq("status", "approved").order("approved_at", { ascending: false }).limit(1).maybeSingle();
    if (error) throw error;
    return NextResponse.json({ handoff });
  } catch { return errorResponse("Workflow handoff could not be read.", 502); }
}

export async function POST(request: Request) {
  let body: unknown;
  try { body = await request.json(); } catch { return errorResponse("Provide a valid JSON handoff.", 400); }
  if (typeof body !== "object" || body === null || Array.isArray(body)) return errorResponse("A handoff payload is required.", 400);
  const values = body as Record<string, unknown>;
  const target = values.targetWorkflow;
  const sourceRunId = values.sourceRunId;
  const payload = values.payload;
  if (target !== "define_specify" && target !== "align_communicate" || typeof sourceRunId !== "string" || typeof payload !== "object" || payload === null || Array.isArray(payload)) return errorResponse("Provide a supported target, source run, and structured payload.", 400);
  if (JSON.stringify(payload).length > 100_000) return errorResponse("The handoff payload is too large.", 422);
  const handoffPayload = payload as Json;
  try {
    const supabase = await createClient();
    const { data: userData, error: userError } = await supabase.auth.getUser();
    if (userError || !userData.user) return errorResponse("Sign in before approving a workflow handoff.", 401);
    const { data: workspace, error: workspaceError } = await supabase.from("workspaces").select("id").order("created_at", { ascending: true }).limit(1).maybeSingle();
    if (workspaceError) throw workspaceError;
    if (!workspace) return errorResponse("Create a workspace before approving a handoff.", 422);
    const { data: sourceRun, error: sourceError } = await supabase.from("workflow_runs").select("id, workflow_name, status").eq("id", sourceRunId).eq("workspace_id", workspace.id).maybeSingle();
    if (sourceError) throw sourceError;
    if (!sourceRun || sourceRun.workflow_name !== "discover_synthesize" || sourceRun.status !== "completed") return errorResponse("Approve only a completed Discover run.", 422);
    const { data: handoff, error } = await supabase.from("workflow_handoffs").insert({ workspace_id: workspace.id, source_run_id: sourceRun.id, source_workflow: "discover_synthesize", target_workflow: target as Target, status: "approved", payload: handoffPayload, created_by: userData.user.id, approved_by: userData.user.id }).select("id, source_run_id, target_workflow, status, approved_at").single();
    if (error) throw error;
    return NextResponse.json({ handoff }, { status: 201 });
  } catch { return errorResponse("Workflow handoff could not be approved.", 502); }
}
