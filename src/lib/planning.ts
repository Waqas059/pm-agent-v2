export type PrioritizationInput = { impact: number; confidence: number; urgency: number; effort: number };
export type PlanningLane = "Now" | "Next" | "Later";

export function calculatePriorityScore(item: PrioritizationInput): number {
  return (item.impact * item.confidence * item.urgency) / item.effort;
}

export function getPlanningLane(rank: number): PlanningLane {
  return rank === 0 ? "Now" : rank < 3 ? "Next" : "Later";
}
