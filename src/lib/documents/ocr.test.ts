import { describe, expect, it } from "vitest";

import { vi } from "vitest";
vi.mock("server-only", () => ({}));

import { buildPageExtraction, parseOcrOutput } from "./ocr";

describe("document OCR", () => {
  it("rejects unstructured or empty OCR output", () => {
    expect(() => parseOcrOutput(null)).toThrow("invalid page collection");
    expect(() => parseOcrOutput({ pages: [] })).toThrow("no readable pages");
    expect(() => parseOcrOutput({ pages: [{ pageNumber: 1, text: "" }] })).toThrow("has no readable text");
  });

  it("preserves page-aware line locators and offsets", () => {
    const extraction = buildPageExtraction([
      { pageNumber: 1, text: "First page" },
      { pageNumber: 2, text: "Second page\nTwo lines" },
    ]);

    expect(extraction.extractor).toBe("openai_vision_ocr");
    expect(extraction.pageCount).toBe(2);
    expect(extraction.text).toBe("First page\n\nSecond page\nTwo lines");
    expect(extraction.locators[0]).toMatchObject({ label: "Page 1 · Line 1", page: 1, startOffset: 0, endOffset: 10 });
    expect(extraction.locators[1]).toMatchObject({ label: "Page 2 · Line 1", page: 2, startOffset: 12, endOffset: 23 });
    expect(extraction.locators[2]).toMatchObject({ label: "Page 2 · Line 2", page: 2, startOffset: 24, endOffset: 33 });
  });
});
