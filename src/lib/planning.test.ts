import { describe, expect, it } from "vitest";
import { calculatePriorityScore, getPlanningLane } from "./planning";

describe("deterministic planning", () => {
  it("calculates a transparent priority score", () => { expect(calculatePriorityScore({ impact: 5, confidence: 4, urgency: 3, effort: 2 })).toBe(30); });
  it("maps ranked items to planning lanes", () => { expect(getPlanningLane(0)).toBe("Now"); expect(getPlanningLane(1)).toBe("Next"); expect(getPlanningLane(3)).toBe("Later"); });
});
