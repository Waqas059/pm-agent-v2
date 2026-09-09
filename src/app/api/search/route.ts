import { NextResponse } from "next/server";
import { createClient, getAuthenticatedUser, isSupabaseUnavailable } from "@/lib/supabase/server";
import { rankSearchResults, type SearchCandidate } from "@/lib/search/rank";

const MAX_QUERY_LENGTH = 120;
function errorResponse(message: string, status: number) { return NextResponse.json({ error: message }, { status }); }
function escapeLike(value: string) { return value.replace(/[\\%_]/g, "\\$&"); }

export async function GET(request: Request) {
  const query = new URL(request.url).searchParams.get("q")?.trim() ?? "";
  if (!query) return NextResponse.json({ results: [] });
  if (query.length < 2 || query.length > MAX_QUERY_LENGTH) return errorResponse("Search must be between 2 and 120 characters.", 400);
  try {
    const supabase = await createClient();
    const { data: userData, error: userError } = await getAuthenticatedUser(supabase);
    if (userError) return errorResponse(isSupabaseUnavailable(userError) ? "Workspace authentication is temporarily unavailable. Retry in a moment." : "Sign in before searching the workspace.", isSupabaseUnavailable(userError) ? 503 : 401);
    if (!userData.user) return errorResponse("Sign in before searching the workspace.", 401);
    const { data: workspace, error: workspaceError } = await supabase.from("workspaces").select("id").order("created_at", { ascending: true }).limit(1).maybeSingle();
    if (workspaceError) throw workspaceError;
    if (!workspace) return errorResponse("Create a product workspace before searching.", 422);
    const term = `%${escapeLike(query)}%`;
    const [{ data: contextItems, error: contextError }, { data: evidenceItems, error: evidenceError }, { data: artifacts, error: artifactError }, { data: extractionItems, error: extractionError }, { data: decisions, error: decisionError }, { data: assumptions, error: assumptionError }] = await Promise.all([
      supabase.from("context_items").select("id, category, title, content").eq("workspace_id", workspace.id).textSearch("search_vector", query, { type: "websearch", config: "simple" }).order("updated_at", { ascending: false }).limit(8),
      supabase.from("evidence_items").select("id, kind, title, content, source_label").eq("workspace_id", workspace.id).textSearch("search_vector", query, { type: "websearch", config: "simple" }).order("updated_at", { ascending: false }).limit(8),
      supabase.from("artifacts").select("id, kind, title, source_workflow").eq("workspace_id", workspace.id).ilike("title", term).order("updated_at", { ascending: false }).limit(8),
      supabase.from("document_extractions").select("document_id, extracted_text, extractor").eq("workspace_id", workspace.id).textSearch("search_vector", query, { type: "websearch", config: "simple" }).order("updated_at", { ascending: false }).limit(8),
      supabase.from("decision_records").select("id, title, decision, rationale, status").eq("workspace_id", workspace.id).textSearch("search_vector", query, { type: "websearch", config: "simple" }).order("updated_at", { ascending: false }).limit(8),
      supabase.from("assumptions").select("id, statement, validation_plan, impact, status").eq("workspace_id", workspace.id).textSearch("search_vector", query, { type: "websearch", config: "simple" }).order("updated_at", { ascending: false }).limit(8),
    ]);
    if (contextError) throw contextError;
    if (evidenceError) throw evidenceError;
    if (artifactError) throw artifactError;
    if (extractionError) throw extractionError;
    if (decisionError) throw decisionError;
    if (assumptionError) throw assumptionError;
    const extractionDocumentIds = (extractionItems ?? []).map((item) => item.document_id);
    const { data: extractionDocuments, error: extractionDocumentsError } = extractionDocumentIds.length
      ? await supabase.from("documents").select("id, original_name").in("id", extractionDocumentIds)
      : { data: [], error: null };
    if (extractionDocumentsError) throw extractionDocumentsError;
    const documentNames = new Map((extractionDocuments ?? []).map((document) => [document.id, document.original_name]));
    const results: SearchCandidate[] = [
      ...(contextItems ?? []).map((item) => ({ id: item.id, type: "Context", title: item.title, detail: `${item.category} · ${item.content.slice(0, 140)}`, href: "#context" })),
      ...(evidenceItems ?? []).map((item) => ({ id: item.id, type: "Evidence", title: item.title, detail: `${item.source_label} · ${item.content.slice(0, 140)}`, href: "#evidence" })),
      ...(artifacts ?? []).map((item) => ({ id: item.id, type: "Artifact", title: item.title, detail: `${item.source_workflow === "define_specify" ? "Product brief" : "Communication message"} · Saved output`, href: "#artifacts" })),
      ...(extractionItems ?? []).map((item) => ({ id: item.document_id, type: "Document", title: documentNames.get(item.document_id) ?? "Extracted document", detail: `${item.extractor} · ${item.extracted_text.slice(0, 140)}`, href: "#documents" })),
      ...(decisions ?? []).map((item) => ({ id: item.id, type: "Decision", title: item.title, detail: `${item.status} · ${item.decision.slice(0, 140)}`, href: "#decisions" })),
      ...(assumptions ?? []).map((item) => ({ id: item.id, type: "Assumption", title: item.statement, detail: `${item.impact} impact · ${item.status} · ${item.validation_plan.slice(0, 100)}`, href: "#decisions" })),
    ];
    return NextResponse.json({ results: rankSearchResults(results, query) });
  } catch { return errorResponse("Workspace search could not be completed.", 502); }
}
