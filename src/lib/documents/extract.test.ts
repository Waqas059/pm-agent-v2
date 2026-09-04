import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

import { buildLineLocators, extractDocument } from "./extract";

describe("document extraction", () => {
  it("creates stable line locators with exact offsets", () => {
    const text = "first\r\nsecond\nthird";
    expect(buildLineLocators(text)).toEqual([
      { type: "line", index: 0, startOffset: 0, endOffset: 5, label: "Line 1" },
      { type: "line", index: 1, startOffset: 7, endOffset: 13, label: "Line 2" },
      { type: "line", index: 2, startOffset: 14, endOffset: 19, label: "Line 3" },
    ]);
  });

  it("extracts UTF-8 text and records the source format", async () => {
    const extraction = await extractDocument(Buffer.from("  Goal\n\nOutcome  ", "utf8"), "text/plain", "brief.txt");
    expect(extraction.extractor).toBe("plain_text");
    expect(extraction.text).toBe("Goal\n\nOutcome");
    expect(extraction.locators).toHaveLength(3);
  });

  it("rejects legacy Word documents with an actionable message", async () => {
    await expect(extractDocument(Buffer.from("not a binary doc"), "application/msword", "brief.doc")).rejects.toThrow("Save the file as .docx or PDF");
  });
});
