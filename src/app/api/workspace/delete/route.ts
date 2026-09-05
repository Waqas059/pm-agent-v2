import { NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";

const BUCKET_NAME = "documents";
const STORAGE_DELETE_BATCH_SIZE = 100;

function errorResponse(message: string, status: number) {
  return NextResponse.json({ error: message }, { status });
}

async function getOwnerWorkspace(supabase: Awaited<ReturnType<typeof createClient>>, userId: string, workspaceId?: string) {
  let query = supabase
    .from("workspaces")
    .select("id, name, owner_id")
    .eq("owner_id", userId)
    .order("created_at", { ascending: true })
    .limit(1);

  if (workspaceId) query = query.eq("id", workspaceId);
  const { data, error } = await query.maybeSingle();
  if (error) throw error;
  return data;
}

async function getWorkspaceCounts(supabase: Awaited<ReturnType<typeof createClient>>, workspaceId: string) {
  const [context, documents, evidence, citations, artifacts, runs, handoffs, decisions, assumptions] = await Promise.all([
    supabase.from("context_items").select("id", { count: "exact", head: true }).eq("workspace_id", workspaceId),
    supabase.from("documents").select("id, storage_path", { count: "exact" }).eq("workspace_id", workspaceId),
    supabase.from("evidence_items").select("id", { count: "exact", head: true }).eq("workspace_id", workspaceId),
    supabase.from("evidence_citations").select("id", { count: "exact", head: true }).eq("workspace_id", workspaceId),
    supabase.from("artifacts").select("id", { count: "exact", head: true }).eq("workspace_id", workspaceId),
    supabase.from("workflow_runs").select("id", { count: "exact", head: true }).eq("workspace_id", workspaceId),
    supabase.from("workflow_handoffs").select("id", { count: "exact", head: true }).eq("workspace_id", workspaceId),
    supabase.from("decision_records").select("id", { count: "exact", head: true }).eq("workspace_id", workspaceId),
    supabase.from("assumptions").select("id", { count: "exact", head: true }).eq("workspace_id", workspaceId),
  ]);

  const result = [context, documents, evidence, citations, artifacts, runs, handoffs, decisions, assumptions];
  const failed = result.find((item) => item.error);
  if (failed?.error) throw failed.error;

  return {
    counts: {
      context_items: context.count ?? 0,
      documents: documents.count ?? 0,
      evidence_items: evidence.count ?? 0,
      evidence_citations: citations.count ?? 0,
      artifacts: artifacts.count ?? 0,
      workflow_runs: runs.count ?? 0,
      workflow_handoffs: handoffs.count ?? 0,
      decision_records: decisions.count ?? 0,
      assumptions: assumptions.count ?? 0,
    },
    storagePaths: (documents.data ?? []).map((document) => document.storage_path),
  };
}

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: userData, error: userError } = await supabase.auth.getUser();
    if (userError || !userData.user) return errorResponse("Sign in before reviewing workspace deletion.", 401);

    const workspace = await getOwnerWorkspace(supabase, userData.user.id);
    if (!workspace) return errorResponse("Only a workspace owner can review workspace deletion.", 403);

    const { counts, storagePaths } = await getWorkspaceCounts(supabase, workspace.id);
    return NextResponse.json({
      workspace: { id: workspace.id, name: workspace.name },
      counts,
      storageObjectCount: storagePaths.length,
      confirmationText: `DELETE ${workspace.name}`,
    });
  } catch {
    return errorResponse("The workspace deletion preview could not be loaded.", 502);
  }
}

export async function DELETE(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return errorResponse("Provide a valid deletion confirmation.", 400);
  }

  if (typeof body !== "object" || body === null || Array.isArray(body)) {
    return errorResponse("Provide a valid deletion confirmation.", 400);
  }

  const values = body as Record<string, unknown>;
  const workspaceId = values.workspaceId;
  const confirmation = values.confirmation;
  if (typeof workspaceId !== "string" || typeof confirmation !== "string") {
    return errorResponse("Provide the workspace ID and exact confirmation text.", 400);
  }

  let operationId: string | null = null;
  try {
    const supabase = await createClient();
    const { data: userData, error: userError } = await supabase.auth.getUser();
    if (userError || !userData.user) return errorResponse("Sign in before deleting a workspace.", 401);

    const workspace = await getOwnerWorkspace(supabase, userData.user.id, workspaceId);
    if (!workspace) return errorResponse("Only the workspace owner can delete this workspace.", 403);
    const expectedConfirmation = `DELETE ${workspace.name}`;
    if (confirmation !== expectedConfirmation) return errorResponse(`Type ${expectedConfirmation} to confirm deletion.`, 422);

    const { counts, storagePaths } = await getWorkspaceCounts(supabase, workspace.id);
    const { data: operation, error: operationError } = await supabase
      .from("workspace_deletion_operations")
      .insert({
        workspace_id: workspace.id,
        requested_by: userData.user.id,
        status: "started",
        record_counts: counts,
        storage_object_count: storagePaths.length,
      })
      .select("id")
      .single();
    if (operationError) throw operationError;
    operationId = operation.id;

    for (let index = 0; index < storagePaths.length; index += STORAGE_DELETE_BATCH_SIZE) {
      const batch = storagePaths.slice(index, index + STORAGE_DELETE_BATCH_SIZE);
      const { error: storageError } = await supabase.storage.from(BUCKET_NAME).remove(batch);
      if (storageError) throw storageError;
    }

    const { data: deletedWorkspace, error: workspaceError } = await supabase
      .from("workspaces")
      .delete()
      .eq("id", workspace.id)
      .eq("owner_id", userData.user.id)
      .select("id")
      .maybeSingle();
    if (workspaceError) throw workspaceError;
    if (!deletedWorkspace) throw new Error("Workspace deletion did not remove the selected workspace.");

    const { error: completeError } = await supabase
      .from("workspace_deletion_operations")
      .update({ status: "completed", completed_at: new Date().toISOString() })
      .eq("id", operationId);
    if (completeError) throw completeError;

    return NextResponse.json({ deleted: true });
  } catch {
    if (operationId) {
      const supabase = await createClient().catch(() => null);
      if (supabase) {
        try {
          await supabase
            .from("workspace_deletion_operations")
            .update({ status: "failed", failure_reason: "Workspace deletion did not complete.", completed_at: new Date().toISOString() })
            .eq("id", operationId);
        } catch {
          // Preserve the original failure response if the audit update also fails.
        }
      }
    }
    return errorResponse("Workspace deletion did not complete. No success is being claimed; review the deletion status before retrying.", 502);
  }
}
