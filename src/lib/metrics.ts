export type MetricDirection = "increase" | "decrease";

export type MetricInput = {
  baseline: number;
  target: number;
};

export function calculateMetricDelta({ baseline, target }: MetricInput): number {
  return target - baseline;
}

export function calculateRelativeChangePercent({ baseline, target }: MetricInput): number | null {
  if (baseline === 0) return null;
  return ((target - baseline) / Math.abs(baseline)) * 100;
}

export function isTargetMet(value: number, target: number, direction: MetricDirection): boolean {
  return direction === "increase" ? value >= target : value <= target;
}
