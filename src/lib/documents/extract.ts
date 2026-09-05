import "server-only";

import mammoth from "mammoth";

const MAX_EXTRACTED_CHARACTERS = 500_000;

export type DocumentLocator = {
  type: "line";
  index: number;
  startOffset: number;
  endOffset: number;
  label: string;
};

export type DocumentExtraction = {
  text: string;
  locators: DocumentLocator[];
  extractor: "plain_text" | "json" | "csv" | "docx_mammoth" | "pdf_parse";
  pageCount?: number;
};

export function buildLineLocators(text: string): DocumentLocator[] {
  const locators: DocumentLocator[] = [];
  let lineStart = 0;
  let index = 0;

  for (let offset = 0; offset <= text.length; offset += 1) {
    const isEnd = offset === text.length;
    const isLineBreak = !isEnd && text[offset] === "\n";
    if (!isEnd && !isLineBreak) continue;

    const lineEnd = offset > lineStart && text[offset - 1] === "\r" ? offset - 1 : offset;
    locators.push({
      type: "line",
      index,
      startOffset: lineStart,
      endOffset: lineEnd,
      label: `Line ${index + 1}`,
    });
    index += 1;
    lineStart = offset + 1;
  }

  return locators;
}

function normalizeText(text: string) {
  const normalized = text.replace(/\u0000/g, "").replace(/\r\n/g, "\n").trim();
  if (!normalized) throw new Error("The document contains no readable text.");
  if (normalized.length > MAX_EXTRACTED_CHARACTERS) {
    throw new Error("The extracted document text exceeds the 500,000 character limit.");
  }
  return normalized;
}

function isLegacyWordContainer(buffer: Buffer) {
  const legacyHeader = Buffer.from([0xd0, 0xcf, 0x11, 0xe0, 0xa1, 0xb1, 0x1a, 0xe1]);
  return buffer.byteLength >= legacyHeader.length && legacyHeader.every((byte, index) => buffer[index] === byte);
}

function result(text: string, extractor: DocumentExtraction["extractor"], pageCount?: number): DocumentExtraction {
  const normalized = normalizeText(text);
  return { text: normalized, locators: buildLineLocators(normalized), extractor, pageCount };
}

export async function extractDocument(buffer: Buffer, mimeType: string, originalName: string): Promise<DocumentExtraction> {
  if (buffer.byteLength === 0) throw new Error("The document is empty.");

  const lowerName = originalName.toLowerCase();
  if (mimeType === "application/msword" || lowerName.endsWith(".doc") || isLegacyWordContainer(buffer)) {
    throw new Error("Legacy .doc files are not supported yet. Save the file as .docx or PDF and upload it again.");
  }

  if (mimeType === "application/pdf" || lowerName.endsWith(".pdf")) {
    // Bootstrap the official Node worker. It also provides DOMMatrix and the
    // other canvas globals that pdfjs expects in serverless runtimes.
    await import("pdf-parse/worker");
    const { PDFParse } = await import("pdf-parse");
    const parser = new PDFParse({ data: buffer });
    try {
      const parsed = await parser.getText();
      return result(parsed.text, "pdf_parse", parsed.total);
    } finally {
      await parser.destroy();
    }
  }

  if (mimeType === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" || lowerName.endsWith(".docx")) {
    const parsed = await mammoth.extractRawText({ buffer });
    return result(parsed.value, "docx_mammoth");
  }

  const text = buffer.toString("utf8");
  if (mimeType === "application/json" || lowerName.endsWith(".json")) return result(text, "json");
  if (mimeType === "text/csv" || lowerName.endsWith(".csv")) return result(text, "csv");
  return result(text, "plain_text");
}
