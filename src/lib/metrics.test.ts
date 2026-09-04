import { describe, expect, it } from "vitest";
import { calculateMetricDelta, calculateRelativeChangePercent, isTargetMet } from "./metrics";

describe("metric calculations", () => {
  it("calculates the target delta and relative change", () => {
    expect(calculateMetricDelta({ baseline: 20, target: 30 })).toBe(10);
    expect(calculateRelativeChangePercent({ baseline: 20, target: 30 })).toBe(50);
  });

  it("handles a zero baseline without inventing a percentage", () => {
    expect(calculateRelativeChangePercent({ baseline: 0, target: 10 })).toBeNull();
  });

  it("checks goals according to their direction", () => {
    expect(isTargetMet(32, 30, "increase")).toBe(true);
    expect(isTargetMet(28, 30, "increase")).toBe(false);
    expect(isTargetMet(4, 5, "decrease")).toBe(true);
  });
});
