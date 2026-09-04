import { describe, expect, it } from "vitest";

import { evaluationCategories, evaluationCases, validateEvaluationCorpus } from "./fixtures";
import { summarizeEvaluations } from "./harness";

describe("AI evaluation harness", () => {
  it("ships a representative fixture for every required evaluation category", () => {
    validateEvaluationCorpus();
    expect(evaluationCases).toHaveLength(evaluationCategories.length);
  });

  it("derives quality, grounding, acceptance, latency, and cost metrics from observations", () => {
    const summary = summarizeEvaluations([
      {
        caseId: evaluationCases[0].id,
        status: "completed",
        schemaValid: true,
        groundingValid: true,
        unsupportedClaims: 0,
        totalClaims: 2,
        completenessScore: 0.8,
        humanDecision: "accepted",
        latencyMs: 500,
        inputTokens: 100,
        outputTokens: 40,
        estimatedCostUsd: 0.01,
      },
      {
        caseId: evaluationCases[1].id,
        status: "failed",
        schemaValid: false,
        groundingValid: false,
        unsupportedClaims: 1,
        totalClaims: 2,
        completenessScore: 0.2,
        humanDecision: "rejected",
        latencyMs: 700,
        inputTokens: 120,
        outputTokens: 20,
        estimatedCostUsd: 0.02,
      },
    ]);

    expect(summary).toMatchObject({
      totalCases: 2,
      completedCases: 1,
      failedCases: 1,
      schemaValidityRate: 0.5,
      groundingAccuracyRate: 0.5,
      unsupportedClaimRate: 0.25,
      averageCompletenessScore: 0.5,
      humanAcceptanceRate: 0.5,
      averageLatencyMs: 600,
      totalInputTokens: 220,
      totalOutputTokens: 60,
      estimatedCostUsd: 0.03,
    });
  });

  it("does not invent percentages when no observations exist", () => {
    expect(summarizeEvaluations([])).toMatchObject({
      totalCases: 0,
      schemaValidityRate: null,
      groundingAccuracyRate: null,
      unsupportedClaimRate: null,
      averageCompletenessScore: null,
      humanAcceptanceRate: null,
      averageLatencyMs: null,
      estimatedCostUsd: null,
    });
  });
});
