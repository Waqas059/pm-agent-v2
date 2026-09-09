import { NextResponse } from "next/server";

import { recordProductEvent } from "@/lib/analytics";
import { extractDocument } from "@/lib/documents/extract";
import { ocrDocument } from "@/lib/documents/ocr";
import { createClient, getAuthenticatedUser } from "@/lib/supabase/server";

export const runtime = "nodejs";

function errorResponse(message: string, status: number) {
  return NextResponse.json({ error: message }, { status });
}

export async function POST(_request: Request, context: { params: Promise<{ id: string }> }) {
  let supabase: Awaited<ReturnType<typeof createClient>> | null = null;
  let documentId: string | null = null;
  let workspaceId: string | null = null;
  let userId: string | null = null;
  try {
    supabase = await createClient();
    const { data: userData, error: userError } = await getAuthenticatedUser(supabase);
    if (userError || !userData.user) return errorResponse("Sign in before extracting a document.", 401);
    userId = userData.user.id;

    const { id } = await context.params;
    const { data: document, error: documentError } = await supabase
      .from("documents")
      .select("id, workspace_id, storage_path, original_name, mime_type, size_bytes")
      .eq("id", id)
      .maybeSingle();

    if (documentError) throw documentError;
    if (!document) return errorResponse("Document not found.", 404);
    documentId = document.id;
    workspaceId = document.workspace_id;

    const { data: file, error: downloadError } = await supabase.storage.from("documents").download(document.storage_path);
    if (downloadError || !file) return errorResponse("The document file could not be read.", 502);

    const buffer = Buffer.from(await file.arrayBuffer());
    const isImage = /^image\/(png|jpeg|webp)$/.test(document.mime_type) || /\.(png|jpe?g|webp)$/i.test(document.original_name);
    let extraction;
    let ocrUsed = false;
    if (isImage) {
      extraction = (await ocrDocument(buffer, document.mime_type, document.original_name)).extraction;
      ocrUsed = true;
    } else {
      try {
        extraction = await extractDocument(buffer, document.mime_type, document.original_name);
      } catch (error) {
        const isPdf = document.mime_type === "application/pdf" || document.original_name.toLowerCase().endsWith(".pdf");
        if (!isPdf || !(error instanceof Error) || !error.message.includes("no readable text")) throw error;
        extraction = (await ocrDocument(buffer, document.mime_type, document.original_name)).extraction;
        ocrUsed = true;
      }
    }
    const extractionFields = {
      document_id: document.id,
      workspace_id: document.workspace_id,
      extracted_text: extraction.text,
      locators: extraction.locators,
      extractor: extraction.extractor,
      page_count: extraction.pageCount ?? null,
    };

    const { data: existing, error: existingError } = await supabase
      .from("document_extractions")
      .select("id")
      .eq("document_id", document.id)
      .maybeSingle();
    if (existingError) throw existingError;

    const { error: saveError } = existing
      ? await supabase.from("document_extractions").update({ extracted_text: extractionFields.extracted_text, locators: extractionFields.locators, extractor: extractionFields.extractor, page_count: extractionFields.page_count }).eq("id", existing.id)
      : await supabase.from("document_extractions").insert({ ...extractionFields, created_by: userData.user.id });
    if (saveError) throw saveError;
    await supabase.from("documents").update({ status: "ready" }).eq("id", document.id);
    void recordProductEvent(supabase, { workspaceId: document.workspace_id, userId: userData.user.id, eventName: "document_extraction_completed", surface: "documents", properties: { extractor: extraction.extractor, ocr: ocrUsed, page_count: extraction.pageCount ?? null } });

    return NextResponse.json({
      extraction: {
        documentId: document.id,
        extractor: extraction.extractor,
        characters: extraction.text.length,
        locatorCount: extraction.locators.length,
        pageCount: extraction.pageCount ?? null,
        ocr: ocrUsed,
      },
    });
  } catch (error) {
    if (supabase && documentId) {
      try { await supabase.from("documents").update({ status: "failed" }).eq("id", documentId); } catch { /* preserve the original extraction failure */ }
      if (workspaceId && userId) void recordProductEvent(supabase, { workspaceId, userId, eventName: "document_extraction_failed", surface: "documents", properties: { ocr: false } });
    }
    if (error instanceof Error && error.message.includes("Legacy .doc files")) {
      return errorResponse(error.message, 422);
    }
    if (error instanceof Error && error.message.includes("no readable text")) {
      return errorResponse(error.message, 422);
    }
    if (error instanceof Error && error.message.startsWith("OpenAI is not configured")) {
      return errorResponse("This scanned document requires OCR. Configure the server-side OpenAI settings before extracting it.", 503);
    }
    if (error instanceof Error) {
      console.error("Document extraction failed", { name: error.name });
    }
    return errorResponse("The document could not be extracted. Check the file format and try again.", 502);
  }
}
