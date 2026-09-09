import { describe, expect, it } from "vitest";

import { summarizeOutcomeBaseline } from "./outcomes";

describe("product outcome baseline", () => {
  it("reports insufficient data without inventing rates", () => {
    expect(summarizeOutcomeBaseline([])).toMatchObject({ status: "insufficient_data", observationCount: 0, activation: { percentage: null }, workflowCompletion: { percentage: null } });
  });

  it("calculates descriptive rates from supplied event counts", () => {
    const result = summarizeOutcomeBaseline([
      { event_name: "onboarding_started", created_at: "2026-09-01T00:00:00Z" },
      { event_name: "onboarding_started", created_at: "2026-09-02T00:00:00Z" },
      { event_name: "onboarding_completed", created_at: "2026-09-03T00:00:00Z" },
      { event_name: "workflow_started", created_at: "2026-09-04T00:00:00Z" },
      { event_name: "workflow_completed", created_at: "2026-09-05T00:00:00Z" },
      { event_name: "artifact_created", created_at: "2026-09-06T00:00:00Z" },
    ]);
    expect(result).toMatchObject({ status: "descriptive", activation: { numerator: 1, denominator: 2, percentage: 50 }, workflowCompletion: { percentage: 100 }, artifactAfterWorkflow: { percentage: 100 }, firstObservedAt: "2026-09-01T00:00:00Z", lastObservedAt: "2026-09-06T00:00:00Z" });
  });
});
