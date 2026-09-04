import { NextResponse } from "next/server";

import { runDefineWorkflow } from "@/lib/workflows/define";
import { startWorkflowRun, updateWorkflowRun, updateWorkflowStep } from "@/lib/workflows/runs";
import { createClient } from "@/lib/supabase/server";

const MAX_OPPORTUNITY_LENGTH = 2_000;

function errorResponse(message: string, status: number) {
  return NextResponse.json({ error: message }, { status });
}

export async function POST(request: Request) {
  let body: unknown;
  let runId: string | null = null;
  let stepId: string | null = null;

  try {
    body = await request.json();
  } catch {
    return errorResponse("Provide a valid JSON request.", 400);
  }

  if (typeof body !== "object" || body === null || Array.isArray(body)) {
    return errorResponse("An opportunity to define is required.", 400);
  }

  const opportunityValue = (body as Record<string, unknown>).opportunity;
  if (typeof opportunityValue !== "string" || !opportunityValue.trim() || opportunityValue.trim().length > MAX_OPPORTUNITY_LENGTH) {
    return errorResponse("Enter an opportunity of 2,000 characters or fewer.", 400);
  }

  try {
    const supabase = await createClient();
    const { data: userData, error: userError } = await supabase.auth.getUser();
    if (userError || !userData.user) return errorResponse("Sign in before running a definition workflow.", 401);

    const { data: workspace, error: workspaceError } = await supabase
      .from("workspaces")
      .select("id")
      .order("created_at", { ascending: true })
      .limit(1)
      .maybeSingle();
    if (workspaceError) throw workspaceError;
    if (!workspace) return errorResponse("Create a product workspace before running definition.", 422);

    const [{ data: contextItems, error: contextError }, { data: evidenceRows, error: evidenceError }, { data: citationRows, error: citationError }] = await Promise.all([
      supabase
        .from("context_items")
        .select("category, title, content")
        .eq("workspace_id", workspace.id)
        .order("updated_at", { ascending: false }),
      supabase
        .from("evidence_items")
        .select("id, kind, title, content, source_label")
        .eq("workspace_id", workspace.id)
        .order("created_at", { ascending: false }),
      supabase
        .from("evidence_citations")
        .select("evidence_item_id, citation_key")
        .eq("workspace_id", workspace.id),
    ]);

    if (contextError) throw contextError;
    if (evidenceError) throw evidenceError;
    if (citationError) throw citationError;

    const citationByEvidenceId = new Map((citationRows ?? []).map((citation) => [citation.evidence_item_id, citation.citation_key]));
    const evidenceItems = (evidenceRows ?? []).flatMap((item) => {
      const citationKey = citationByEvidenceId.get(item.id);
      return citationKey ? [{ ...item, citationKey }] : [];
    });

    if (evidenceItems.length === 0) {
      return errorResponse("Add at least one citation-backed evidence item before running definition.", 422);
    }

    const started = await startWorkflowRun(supabase, {
      workspaceId: workspace.id,
      workflowName: "define_specify",
      stepKey: "define",
      runInput: { opportunity: opportunityValue.trim() },
      userId: userData.user.id,
    });
    runId = started.run.id;
    stepId = started.step.id;
    const result = await runDefineWorkflow({
      opportunity: opportunityValue,
      contextItems: contextItems ?? [],
      evidenceItems,
    });

    const completedAt = new Date().toISOString();
    await updateWorkflowStep(supabase, stepId, { status: "completed", output: result.output, completed_at: completedAt });
    await updateWorkflowRun(supabase, runId, { status: "completed", output: result.output, completed_at: completedAt });

    return NextResponse.json({ result: { ...result, id: runId } });
  } catch (error) {
    if (runId) {
      const supabase = await createClient().catch(() => null);
      if (supabase) {
        const failedAt = new Date().toISOString();
        if (stepId) await updateWorkflowStep(supabase, stepId, { status: "failed", error_message: "The definition step failed.", completed_at: failedAt }).catch(() => undefined);
        await updateWorkflowRun(supabase, runId, { status: "failed", error_message: "The definition workflow failed.", completed_at: failedAt }).catch(() => undefined);
      }
    }
    const message = error instanceof Error ? error.message : "The definition workflow could not be completed.";
    if (message.startsWith("Supabase is not configured")) {
      return errorResponse("Connect Supabase before running a definition workflow.", 503);
    }
    if (message.startsWith("OpenAI is not configured")) {
      return errorResponse("Configure the server-side OpenAI settings before running a definition workflow.", 503);
    }
    if (message.startsWith("The selected context and evidence are too large")) {
      return errorResponse(message, 422);
    }
    return errorResponse("The definition workflow could not be completed. Review the inputs and try again.", 502);
  }
}
