export type EvaluationObservation = {
  caseId: string;
  status: "completed" | "failed";
  schemaValid: boolean;
  groundingValid: boolean;
  unsupportedClaims: number;
  totalClaims: number;
  completenessScore?: number;
  humanDecision?: "accepted" | "rejected";
  latencyMs?: number;
  inputTokens?: number;
  outputTokens?: number;
  estimatedCostUsd?: number;
};

export type EvaluationSummary = {
  totalCases: number;
  completedCases: number;
  failedCases: number;
  schemaValidityRate: number | null;
  groundingAccuracyRate: number | null;
  unsupportedClaimRate: number | null;
  averageCompletenessScore: number | null;
  humanAcceptanceRate: number | null;
  averageLatencyMs: number | null;
  totalInputTokens: number | null;
  totalOutputTokens: number | null;
  estimatedCostUsd: number | null;
};

function average(values: number[]): number | null {
  return values.length ? values.reduce((total, value) => total + value, 0) / values.length : null;
}

function rate(numerator: number, denominator: number): number | null {
  return denominator ? numerator / denominator : null;
}

export function summarizeEvaluations(observations: readonly EvaluationObservation[]): EvaluationSummary {
  const completed = observations.filter((observation) => observation.status === "completed");
  const decisions = observations.filter((observation) => observation.humanDecision);
  const totalClaims = observations.reduce((total, observation) => total + observation.totalClaims, 0);
  const unsupportedClaims = observations.reduce((total, observation) => total + observation.unsupportedClaims, 0);
  const completenessScores = observations.flatMap((observation) => observation.completenessScore === undefined ? [] : [observation.completenessScore]);
  const latencies = observations.flatMap((observation) => observation.latencyMs === undefined ? [] : [observation.latencyMs]);
  const inputTokens = observations.flatMap((observation) => observation.inputTokens === undefined ? [] : [observation.inputTokens]);
  const outputTokens = observations.flatMap((observation) => observation.outputTokens === undefined ? [] : [observation.outputTokens]);
  const costs = observations.flatMap((observation) => observation.estimatedCostUsd === undefined ? [] : [observation.estimatedCostUsd]);

  return {
    totalCases: observations.length,
    completedCases: completed.length,
    failedCases: observations.length - completed.length,
    schemaValidityRate: rate(observations.filter((observation) => observation.schemaValid).length, observations.length),
    groundingAccuracyRate: rate(observations.filter((observation) => observation.groundingValid).length, observations.length),
    unsupportedClaimRate: rate(unsupportedClaims, totalClaims),
    averageCompletenessScore: average(completenessScores),
    humanAcceptanceRate: rate(decisions.filter((observation) => observation.humanDecision === "accepted").length, decisions.length),
    averageLatencyMs: average(latencies),
    totalInputTokens: inputTokens.length ? inputTokens.reduce((total, value) => total + value, 0) : null,
    totalOutputTokens: outputTokens.length ? outputTokens.reduce((total, value) => total + value, 0) : null,
    estimatedCostUsd: costs.length ? costs.reduce((total, value) => total + value, 0) : null,
  };
}
