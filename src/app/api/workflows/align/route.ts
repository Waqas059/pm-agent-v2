import { NextResponse } from "next/server";

import { runAlignWorkflow } from "@/lib/workflows/align";
import { communicationFormats, type CommunicationFormat } from "@/lib/workflows/align-contract";
import { createClient } from "@/lib/supabase/server";

const MAX_REQUEST_LENGTH = 2_000;
function errorResponse(message: string, status: number) { return NextResponse.json({ error: message }, { status }); }

export async function POST(request: Request) {
  let body: unknown;
  try { body = await request.json(); } catch { return errorResponse("Provide a valid JSON request.", 400); }
  if (typeof body !== "object" || body === null || Array.isArray(body)) return errorResponse("A communication request is required.", 400);
  const values = body as Record<string, unknown>;
  const format = values.format;
  const requestValue = values.request;
  if (!communicationFormats.includes(format as CommunicationFormat)) return errorResponse("Choose a supported communication format.", 400);
  if (typeof requestValue !== "string" || !requestValue.trim() || requestValue.trim().length > MAX_REQUEST_LENGTH) return errorResponse("Enter a communication request of 2,000 characters or fewer.", 400);

  try {
    const supabase = await createClient();
    const { data: userData, error: userError } = await supabase.auth.getUser();
    if (userError || !userData.user) return errorResponse("Sign in before running a communication workflow.", 401);
    const { data: workspace, error: workspaceError } = await supabase.from("workspaces").select("id").order("created_at", { ascending: true }).limit(1).maybeSingle();
    if (workspaceError) throw workspaceError;
    if (!workspace) return errorResponse("Create a product workspace before running communication.", 422);
    const [{ data: contextItems, error: contextError }, { data: evidenceRows, error: evidenceError }, { data: citationRows, error: citationError }] = await Promise.all([
      supabase.from("context_items").select("category, title, content").eq("workspace_id", workspace.id).order("updated_at", { ascending: false }),
      supabase.from("evidence_items").select("id, kind, title, content, source_label").eq("workspace_id", workspace.id).order("created_at", { ascending: false }),
      supabase.from("evidence_citations").select("evidence_item_id, citation_key").eq("workspace_id", workspace.id),
    ]);
    if (contextError) throw contextError;
    if (evidenceError) throw evidenceError;
    if (citationError) throw citationError;
    const citationByEvidenceId = new Map((citationRows ?? []).map((citation) => [citation.evidence_item_id, citation.citation_key]));
    const evidenceItems = (evidenceRows ?? []).flatMap((item) => {
      const citationKey = citationByEvidenceId.get(item.id);
      return citationKey ? [{ ...item, citationKey }] : [];
    });
    if (evidenceItems.length === 0) return errorResponse("Add at least one citation-backed evidence item before running communication.", 422);
    const result = await runAlignWorkflow({ format: format as CommunicationFormat, request: requestValue, contextItems: contextItems ?? [], evidenceItems });
    return NextResponse.json({ result });
  } catch (error) {
    const message = error instanceof Error ? error.message : "The communication workflow could not be completed.";
    if (message.startsWith("Supabase is not configured")) return errorResponse("Connect Supabase before running a communication workflow.", 503);
    if (message.startsWith("OpenAI is not configured")) return errorResponse("Configure the server-side OpenAI settings before running a communication workflow.", 503);
    if (message.startsWith("The selected context and evidence are too large")) return errorResponse(message, 422);
    return errorResponse("The communication workflow could not be completed. Review the inputs and try again.", 502);
  }
}
