import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

const MAX_QUERY_LENGTH = 120;
function errorResponse(message: string, status: number) { return NextResponse.json({ error: message }, { status }); }
function escapeLike(value: string) { return value.replace(/[\\%_]/g, "\\$&"); }

export async function GET(request: Request) {
  const query = new URL(request.url).searchParams.get("q")?.trim() ?? "";
  if (!query) return NextResponse.json({ results: [] });
  if (query.length < 2 || query.length > MAX_QUERY_LENGTH) return errorResponse("Search must be between 2 and 120 characters.", 400);
  try {
    const supabase = await createClient();
    const { data: userData, error: userError } = await supabase.auth.getUser();
    if (userError || !userData.user) return errorResponse("Sign in before searching the workspace.", 401);
    const { data: workspace, error: workspaceError } = await supabase.from("workspaces").select("id").order("created_at", { ascending: true }).limit(1).maybeSingle();
    if (workspaceError) throw workspaceError;
    if (!workspace) return errorResponse("Create a product workspace before searching.", 422);
    const term = `%${escapeLike(query)}%`;
    const [{ data: contextItems, error: contextError }, { data: evidenceItems, error: evidenceError }, { data: artifacts, error: artifactError }, { data: extractionItems, error: extractionError }] = await Promise.all([
      supabase.from("context_items").select("id, category, title, content").eq("workspace_id", workspace.id).or(`title.ilike.${term},content.ilike.${term}`).order("updated_at", { ascending: false }).limit(8),
      supabase.from("evidence_items").select("id, kind, title, content, source_label").eq("workspace_id", workspace.id).or(`title.ilike.${term},content.ilike.${term},source_label.ilike.${term}`).order("updated_at", { ascending: false }).limit(8),
      supabase.from("artifacts").select("id, kind, title, source_workflow").eq("workspace_id", workspace.id).ilike("title", term).order("updated_at", { ascending: false }).limit(8),
      supabase.from("document_extractions").select("document_id, extracted_text, extractor").eq("workspace_id", workspace.id).ilike("extracted_text", term).order("updated_at", { ascending: false }).limit(8),
    ]);
    if (contextError) throw contextError;
    if (evidenceError) throw evidenceError;
    if (artifactError) throw artifactError;
    if (extractionError) throw extractionError;
    const extractionDocumentIds = (extractionItems ?? []).map((item) => item.document_id);
    const { data: extractionDocuments, error: extractionDocumentsError } = extractionDocumentIds.length
      ? await supabase.from("documents").select("id, original_name").in("id", extractionDocumentIds)
      : { data: [], error: null };
    if (extractionDocumentsError) throw extractionDocumentsError;
    const documentNames = new Map((extractionDocuments ?? []).map((document) => [document.id, document.original_name]));
    return NextResponse.json({ results: [
      ...(contextItems ?? []).map((item) => ({ id: item.id, type: "Context", title: item.title, detail: `${item.category} · ${item.content.slice(0, 140)}`, href: "#context" })),
      ...(evidenceItems ?? []).map((item) => ({ id: item.id, type: "Evidence", title: item.title, detail: `${item.source_label} · ${item.content.slice(0, 140)}`, href: "#evidence" })),
      ...(artifacts ?? []).map((item) => ({ id: item.id, type: "Artifact", title: item.title, detail: `${item.source_workflow === "define_specify" ? "Product brief" : "Communication message"} · Saved output`, href: "#artifacts" })),
      ...(extractionItems ?? []).map((item) => ({ id: item.document_id, type: "Document", title: documentNames.get(item.document_id) ?? "Extracted document", detail: `${item.extractor} · ${item.extracted_text.slice(0, 140)}`, href: "#documents" })),
    ] });
  } catch { return errorResponse("Workspace search could not be completed.", 502); }
}
