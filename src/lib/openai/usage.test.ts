import { describe, expect, it } from "vitest";

import { normalizeTokenUsage } from "./usage";

describe("provider token usage", () => {
  it("normalizes complete non-negative usage values", () => {
    expect(normalizeTokenUsage({ input_tokens: 12, output_tokens: 8, total_tokens: 20 })).toEqual({
      inputTokens: 12,
      outputTokens: 8,
      totalTokens: 20,
    });
  });

  it("does not fabricate incomplete or invalid usage", () => {
    expect(normalizeTokenUsage({ input_tokens: 12, output_tokens: 8 })).toBeNull();
    expect(normalizeTokenUsage({ input_tokens: -1, output_tokens: 8, total_tokens: 7 })).toBeNull();
  });
});
