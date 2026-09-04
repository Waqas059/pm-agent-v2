import { describe, expect, it } from "vitest";

import { buildDiscoverInput, createDiscoverOutputParser } from "./discover-contract";

const output = {
  executiveSummary: "Customers repeatedly need a faster way to complete the core task.",
  themes: [{ title: "Speed matters", summary: "People want less waiting.", citationKeys: ["CIT-ABC123"] }],
  painPoints: [{ title: "Slow handoff", summary: "The current handoff creates delay.", citationKeys: ["CIT-ABC123"] }],
  opportunities: [{ title: "Improve the handoff", summary: "Explore a faster handoff flow.", citationKeys: ["CIT-ABC123"] }],
  openQuestions: ["How often does the delay occur?"],
  limitations: ["Only one source was available."],
};

describe("Discover & Synthesize contract", () => {
  it("accepts findings that cite supplied evidence", () => {
    expect(createDiscoverOutputParser(new Set(["CIT-ABC123"]))(output)).toEqual(output);
  });

  it("rejects citations that were not supplied to the workflow", () => {
    expect(() => createDiscoverOutputParser(new Set())(output)).toThrow("unknown citation key");
  });

  it("serializes context and evidence as explicit source blocks", () => {
    const input = buildDiscoverInput({
      question: "What should we learn next?",
      contextItems: [{ category: "product", title: "Product", content: "A workspace for PMs." }],
      evidenceItems: [{
        kind: "quote",
        title: "Interview signal",
        content: "The handoff is slow.",
        source_label: "Interview with Alex",
        citationKey: "CIT-ABC123",
      }],
    });

    expect(input).toContain("<product_context>");
    expect(input).toContain("<citation_backed_evidence>");
    expect(input).toContain("[CIT-ABC123]");
  });
});
