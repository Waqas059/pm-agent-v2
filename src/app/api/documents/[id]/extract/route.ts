import { NextResponse } from "next/server";

import { extractDocument } from "@/lib/documents/extract";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

function errorResponse(message: string, status: number) {
  return NextResponse.json({ error: message }, { status });
}

export async function POST(_request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const supabase = await createClient();
    const { data: userData, error: userError } = await supabase.auth.getUser();
    if (userError || !userData.user) return errorResponse("Sign in before extracting a document.", 401);

    const { id } = await context.params;
    const { data: document, error: documentError } = await supabase
      .from("documents")
      .select("id, workspace_id, storage_path, original_name, mime_type, size_bytes")
      .eq("id", id)
      .maybeSingle();

    if (documentError) throw documentError;
    if (!document) return errorResponse("Document not found.", 404);

    const { data: file, error: downloadError } = await supabase.storage.from("documents").download(document.storage_path);
    if (downloadError || !file) return errorResponse("The document file could not be read.", 502);

    const extraction = await extractDocument(Buffer.from(await file.arrayBuffer()), document.mime_type, document.original_name);
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

    return NextResponse.json({
      extraction: {
        documentId: document.id,
        extractor: extraction.extractor,
        characters: extraction.text.length,
        locatorCount: extraction.locators.length,
        pageCount: extraction.pageCount ?? null,
      },
    });
  } catch (error) {
    if (error instanceof Error) {
      console.error("Document extraction failed", { message: error.message, name: error.name });
      return errorResponse(`Document extraction failed: ${error.message.slice(0, 240)}`, 502);
    }
    if (error instanceof Error && error.message.includes("Legacy .doc files")) {
      return errorResponse(error.message, 422);
    }
    if (error instanceof Error && error.message.includes("no readable text")) {
      return errorResponse(error.message, 422);
    }
    return errorResponse("The document could not be extracted. Check the file format and try again.", 502);
  }
}
