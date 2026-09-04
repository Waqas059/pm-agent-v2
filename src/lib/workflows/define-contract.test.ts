import { describe, expect, it } from "vitest";

import { buildDefineInput, createDefineOutputParser } from "./define-contract";

const output = {
  executiveSummary: "Define a shorter setup flow for product workspace users.",
  productBrief: {
    problemStatement: "Users experience setup as too long.",
    targetUser: "Product workspace users",
    proposedSolution: "Reduce unnecessary setup steps.",
    desiredOutcome: "Users complete setup more quickly.",
    citationKeys: ["CIT-ABC123"],
  },
  inScope: ["Review the setup steps"],
  outOfScope: ["Redesign unrelated workspace areas"],
  userStories: [{
    title: "Complete setup quickly",
    story: "As a user, I want fewer setup steps so I can start working sooner.",
    acceptanceCriteria: ["The setup flow presents only required steps."],
    citationKeys: ["CIT-ABC123"],
  }],
  successMetrics: [{
    name: "Setup completion time",
    definition: "Elapsed time from setup start to completion.",
    direction: "decrease" as const,
    citationKeys: ["CIT-ABC123"],
  }],
  risks: [{
    title: "Removing useful guidance",
    description: "Fewer steps could remove information users need.",
    mitigation: "Validate the shorter flow with users before rollout.",
    citationKeys: ["CIT-ABC123"],
  }],
  openQuestions: ["Which steps are unnecessary?"],
  limitations: ["The evidence does not identify exact setup steps."],
};

describe("Define & Specify contract", () => {
  it("accepts a brief whose evidence-derived sections cite supplied evidence", () => {
    expect(createDefineOutputParser(new Set(["CIT-ABC123"]))(output)).toEqual(output);
  });

  it("rejects unknown citation keys", () => {
    expect(() => createDefineOutputParser(new Set())(output)).toThrow("unknown citation key");
  });

  it("rejects evidence-derived sections without citations", () => {
    expect(() => createDefineOutputParser(new Set(["CIT-ABC123"]))({
      ...output,
      productBrief: { ...output.productBrief, citationKeys: [] },
    })).toThrow("at least one supplied citation key");
  });

  it("serializes the opportunity, context, and evidence as separate blocks", () => {
    const input = buildDefineInput({
      opportunity: "Shorten the setup flow.",
      contextItems: [{ category: "product", title: "Product", content: "A workspace for PMs." }],
      evidenceItems: [{
        kind: "quote",
        title: "Interview signal",
        content: "Setup feels too long.",
        source_label: "Interview with Alex",
        citationKey: "CIT-ABC123",
      }],
    });

    expect(input).toContain("<opportunity_to_define>");
    expect(input).toContain("<product_context>");
    expect(input).toContain("<citation_backed_evidence>");
    expect(input).toContain("[CIT-ABC123]");
  });
});
