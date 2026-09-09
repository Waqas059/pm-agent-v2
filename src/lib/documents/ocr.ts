import "server-only";

import { getOpenAIClient } from "@/lib/openai/client";
import { getOpenAIConfig } from "@/lib/openai/env";
import { parseStructuredOutput, StructuredOutputError } from "@/lib/openai/structured-output";
import { normalizeTokenUsage, type TokenUsage } from "@/lib/openai/usage";

import type { DocumentExtraction, DocumentLocator } from "./extract";

const MAX_OCR_PAGES = 200;
const OCR_SCHEMA = {
  type: "object",
  additionalProperties: false,
  properties: {
    pages: {
      type: "array",
      maxItems: MAX_OCR_PAGES,
      items: {
        type: "object",
        additionalProperties: false,
        properties: {
          pageNumber: { type: "integer", minimum: 1 },
          text: { type: "string", maxLength: 100_000 },
        },
        required: ["pageNumber", "text"],
      },
    },
  },
  required: ["pages"],
} as const;

type OcrPage = { pageNumber: number; text: string };

export type OcrResult = {
  extraction: DocumentExtraction;
  model: string;
  usage: TokenUsage | null;
};

export function parseOcrOutput(value: unknown): OcrPage[] {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    throw new StructuredOutputError("OCR returned an invalid page collection.");
  }
  const pages = (value as Record<string, unknown>).pages;
  if (!Array.isArray(pages) || pages.length === 0 || pages.length > MAX_OCR_PAGES) {
    throw new StructuredOutputError("OCR returned no readable pages.");
  }

  return pages.map((page, index) => {
    if (typeof page !== "object" || page === null || Array.isArray(page)) {
      throw new StructuredOutputError(`OCR page ${index + 1} is invalid.`);
    }
    const record = page as Record<string, unknown>;
    if (!Number.isInteger(record.pageNumber) || (record.pageNumber as number) < 1) {
      throw new StructuredOutputError(`OCR page ${index + 1} has an invalid page number.`);
    }
    if (typeof record.text !== "string" || !record.text.trim()) {
      throw new StructuredOutputError(`OCR page ${index + 1} has no readable text.`);
    }
    return { pageNumber: record.pageNumber as number, text: record.text.trim() };
  });
}

export function buildPageExtraction(pages: OcrPage[]): DocumentExtraction {
  let text = "";
  const locators: DocumentLocator[] = [];

  pages.forEach((page, pageIndex) => {
    if (pageIndex > 0) text += "\n\n";
    const pageStart = text.length;
    text += page.text;
    const lines = page.text.split("\n");
    let offset = pageStart;
    lines.forEach((line, lineIndex) => {
      const endOffset = offset + line.length;
      locators.push({
        type: "line",
        index: locators.length,
        startOffset: offset,
        endOffset,
        label: `Page ${page.pageNumber} · Line ${lineIndex + 1}`,
        page: page.pageNumber,
      });
      offset = endOffset + 1;
    });
  });

  const normalized = text.replace(/\u0000/g, "").replace(/\r\n/g, "\n").trim();
  if (!normalized) throw new Error("OCR did not find readable text in this document.");
  return { text: normalized, locators, extractor: "openai_vision_ocr", pageCount: pages.length };
}

export async function ocrDocument(buffer: Buffer, mimeType: string, originalName: string): Promise<OcrResult> {
  if (buffer.byteLength === 0) throw new Error("The document is empty.");
  const { model } = getOpenAIConfig();
  const response = await getOpenAIClient().responses.create({
    model,
    input: [{
      role: "user",
      content: [
        {
          type: "input_file",
          filename: originalName,
          file_data: `data:${mimeType};base64,${buffer.toString("base64")}`,
          detail: "high",
        },
        {
          type: "input_text",
          text: "Transcribe every readable word from this document exactly. Preserve page boundaries and reading order. Do not summarize, interpret, infer, or invent missing text. Return one page entry per source page, including only text visibly present.",
        },
      ],
    }],
    max_output_tokens: 20_000,
    store: false,
    text: { format: { type: "json_schema", name: "document_ocr", strict: true, schema: OCR_SCHEMA } },
  });

  if (response.status !== "completed") throw new Error(`OCR did not complete (status: ${response.status ?? "unknown"}).`);
  const pages = parseStructuredOutput(response.output_text, parseOcrOutput);
  return { extraction: buildPageExtraction(pages), model: response.model, usage: normalizeTokenUsage(response.usage) };
}
