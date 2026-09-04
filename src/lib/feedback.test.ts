import { describe, expect, it } from "vitest";
import { getFeedbackLabel, normalizeFeedbackRating } from "./feedback";

describe("beta feedback", () => {
  it("keeps ratings inside the supported range", () => {
    expect(normalizeFeedbackRating(0)).toBe(1);
    expect(normalizeFeedbackRating(3.6)).toBe(4);
    expect(normalizeFeedbackRating(8)).toBe(5);
  });

  it("provides a clear label for a rating", () => {
    expect(getFeedbackLabel(5)).toBe("Excellent");
    expect(getFeedbackLabel(1)).toBe("Needs work");
  });
});
