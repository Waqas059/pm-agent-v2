import { NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";
import type { Database, Json } from "@/lib/supabase/database.types";

type ArtifactKind = Database["public"]["Enums"]["artifact_kind"];
const kinds: ArtifactKind[] = ["product_brief", "communication_message"];
const workflows = ["define_specify", "align_communicate"] as const;
const MAX_CONTENT_LENGTH = 100_000;

function errorResponse(message: string, status: number) { return NextResponse.json({ error: message }, { status }); }
function isRecord(value: unknown): value is Record<string, unknown> { return typeof value === "object" && value !== null && !Array.isArray(value); }

async function getWorkspace() {
  const supabase = await createClient();
  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError || !userData.user) return { supabase, user: null, workspace: null, response: errorResponse("Sign in before managing artifacts.", 401) };
  const { data: workspace, error } = await supabase.from("workspaces").select("id").order("created_at", { ascending: true }).limit(1).maybeSingle();
  if (error) throw error;
  if (!workspace) return { supabase, user: userData.user, workspace: null, response: errorResponse("Create a product workspace before saving artifacts.", 422) };
  return { supabase, user: userData.user, workspace, response: null };
}

export async function GET() {
  try {
    const { supabase, response } = await getWorkspace();
    if (response) return response;
    const { data: artifacts, error } = await supabase.from("artifacts").select("id, kind, title, source_workflow, created_at, updated_at").order("updated_at", { ascending: false });
    if (error) throw error;
    const ids = (artifacts ?? []).map((artifact) => artifact.id);
    const { data: versions, error: versionsError } = ids.length ? await supabase.from("artifact_versions").select("id, artifact_id, version, created_at").in("artifact_id", ids).order("version", { ascending: false }) : { data: [], error: null };
    if (versionsError) throw versionsError;
    return NextResponse.json({ artifacts: (artifacts ?? []).map((artifact) => ({ ...artifact, versions: (versions ?? []).filter((version) => version.artifact_id === artifact.id) })) });
  } catch { return errorResponse("Artifacts could not be loaded.", 502); }
}

export async function POST(request: Request) {
  let body: unknown;
  try { body = await request.json(); } catch { return errorResponse("Provide a valid JSON request.", 400); }
  if (!isRecord(body)) return errorResponse("Artifact details are required.", 400);
  const kind = body.kind;
  const sourceWorkflow = body.sourceWorkflow;
  const title = body.title;
  const content = body.content;
  if (!kinds.includes(kind as ArtifactKind) || !workflows.includes(sourceWorkflow as (typeof workflows)[number])) return errorResponse("Choose a supported artifact type.", 400);
  if (typeof title !== "string" || !title.trim() || title.trim().length > 300) return errorResponse("Enter an artifact title of 300 characters or fewer.", 400);
  if (!isRecord(content)) return errorResponse("Artifact content must be a JSON object.", 400);
  if (JSON.stringify(content).length > MAX_CONTENT_LENGTH) return errorResponse("This artifact is too large to save.", 422);
  try {
    const { supabase, user, workspace, response } = await getWorkspace();
    if (response) return response;
    const { data: artifact, error } = await supabase.from("artifacts").insert({ workspace_id: workspace!.id, kind: kind as ArtifactKind, title: title.trim(), source_workflow: sourceWorkflow as (typeof workflows)[number], created_by: user!.id }).select("id, kind, title, source_workflow, created_at, updated_at").single();
    if (error) throw error;
    const { data: version, error: versionError } = await supabase.from("artifact_versions").insert({ artifact_id: artifact.id, workspace_id: workspace!.id, version: 1, content: content as Json, created_by: user!.id }).select("id, artifact_id, version, created_at").single();
    if (versionError) { await supabase.from("artifacts").delete().eq("id", artifact.id); throw versionError; }
    return NextResponse.json({ artifact: { ...artifact, version } }, { status: 201 });
  } catch { return errorResponse("The artifact could not be saved.", 502); }
}
