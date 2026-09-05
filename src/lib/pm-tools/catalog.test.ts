import { describe, expect, it } from "vitest";

import { planPmRequest } from "./catalog";

describe("constrained PM tool planner", () => {
  it("always starts with workspace context and cited evidence", () => {
    const plan = planPmRequest("Help me understand why activation is declining and prepare a decision brief.");
    expect(plan.steps.slice(0, 2).map((step) => step.name)).toEqual(["retrieve_context", "retrieve_evidence"]);
    expect(plan.steps.map((step) => step.name)).toContain("discover_synthesize");
    expect(plan.steps.map((step) => step.name)).toContain("define_specify");
    expect(plan.steps.map((step) => step.name)).toContain("record_decision");
    expect(plan.requiresApproval).toBe(true);
  });

  it("does not expose tools outside the approved catalog", () => {
    const plan = planPmRequest("Send an external message and call a random integration.");
    expect(plan.steps.every((step) => ["retrieve_context", "retrieve_evidence", "align_communicate", "save_artifact"].includes(step.name))).toBe(true);
    expect(plan.steps.map((step) => step.name)).not.toContain("call_external_integration");
  });
});
