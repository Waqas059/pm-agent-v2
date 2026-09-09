export type OutcomeEvent = {
  event_name: string;
  created_at: string;
};

export type OutcomeRate = {
  numerator: number;
  denominator: number;
  percentage: number | null;
};

export type OutcomeBaseline = {
  status: "descriptive" | "insufficient_data";
  observationCount: number;
  firstObservedAt: string | null;
  lastObservedAt: string | null;
  activation: OutcomeRate;
  workflowCompletion: OutcomeRate;
  artifactAfterWorkflow: OutcomeRate;
};

function rate(numerator: number, denominator: number): OutcomeRate {
  return { numerator, denominator, percentage: denominator > 0 ? Math.round((numerator / denominator) * 100) : null };
}

export function summarizeOutcomeBaseline(events: readonly OutcomeEvent[]): OutcomeBaseline {
  const counts = events.reduce<Record<string, number>>((result, event) => {
    result[event.event_name] = (result[event.event_name] ?? 0) + 1;
    return result;
  }, {});
  const timestamps = events.map((event) => event.created_at).filter((value) => !Number.isNaN(Date.parse(value))).sort();

  return {
    status: events.length > 0 ? "descriptive" : "insufficient_data",
    observationCount: events.length,
    firstObservedAt: timestamps[0] ?? null,
    lastObservedAt: timestamps[timestamps.length - 1] ?? null,
    activation: rate(counts.onboarding_completed ?? 0, counts.onboarding_started ?? 0),
    workflowCompletion: rate(counts.workflow_completed ?? 0, counts.workflow_started ?? 0),
    artifactAfterWorkflow: rate(counts.artifact_created ?? 0, counts.workflow_completed ?? 0),
  };
}
