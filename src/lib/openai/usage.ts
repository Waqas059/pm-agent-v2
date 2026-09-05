export type TokenUsage = {
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
};

function isNonNegativeInteger(value: unknown): value is number {
  return typeof value === "number" && Number.isInteger(value) && value >= 0;
}

export function normalizeTokenUsage(value: {
  input_tokens?: unknown;
  output_tokens?: unknown;
  total_tokens?: unknown;
} | null | undefined): TokenUsage | null {
  if (!value) return null;
  const inputTokens = value.input_tokens;
  const outputTokens = value.output_tokens;
  const totalTokens = value.total_tokens;
  if (![inputTokens, outputTokens, totalTokens].every(isNonNegativeInteger)) {
    return null;
  }
  return {
    inputTokens: inputTokens as number,
    outputTokens: outputTokens as number,
    totalTokens: totalTokens as number,
  };
}
