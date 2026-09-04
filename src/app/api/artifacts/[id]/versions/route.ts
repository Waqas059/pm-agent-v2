import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import type { Json } from "@/lib/supabase/database.types";

function errorResponse(message: string, status: number) { return NextResponse.json({ error: message }, { status }); }
function isRecord(value: unknown): value is Record<string, unknown> { return typeof value === "object" && value !== null && !Array.isArray(value); }

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  let body: unknown;
  try { body = await request.json(); } catch { return errorResponse("Provide a valid JSON request.", 400); }
  if (!isRecord(body) || !isRecord(body.content)) return errorResponse("Artifact content must be a JSON object.", 400);
  if (JSON.stringify(body.content).length > 100_000) return errorResponse("This artifact version is too large to save.", 422);
  try {
    const supabase = await createClient();
    const { data: userData, error: userError } = await supabase.auth.getUser();
    if (userError || !userData.user) return errorResponse("Sign in before saving an artifact version.", 401);
    const { id } = await context.params;
    const { data: artifact, error: artifactError } = await supabase.from("artifacts").select("id, workspace_id, title").eq("id", id).maybeSingle();
    if (artifactError) throw artifactError;
    if (!artifact) return errorResponse("Artifact not found.", 404);
    const { data: latest, error: latestError } = await supabase.from("artifact_versions").select("version").eq("artifact_id", id).order("version", { ascending: false }).limit(1).maybeSingle();
    if (latestError) throw latestError;
    const nextVersion = (latest?.version ?? 0) + 1;
    const { data: version, error: versionError } = await supabase.from("artifact_versions").insert({ artifact_id: id, workspace_id: artifact.workspace_id, version: nextVersion, content: body.content as Json, created_by: userData.user.id }).select("id, artifact_id, version, created_at").single();
    if (versionError) throw versionError;
    const { error: updateError } = await supabase.from("artifacts").update({ title: artifact.title }).eq("id", id);
    if (updateError) throw updateError;
    return NextResponse.json({ version });
  } catch { return errorResponse("The artifact version could not be saved.", 502); }
}
