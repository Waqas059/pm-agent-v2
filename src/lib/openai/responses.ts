import "server-only";

import { getOpenAIClient } from "./client";
import { getOpenAIConfig } from "./env";
import { normalizeTokenUsage, type TokenUsage } from "./usage";

export type CreateTextResponseRequest = {
  input: string;
  instructions?: string;
  model?: string;
  maxOutputTokens?: number;
};

export type TextResponseResult = {
  id: string;
  model: string;
  status: string;
  text: string;
  usage?: TokenUsage | null;
};

export async function createTextResponse(
  request: CreateTextResponseRequest,
): Promise<TextResponseResult> {
  const input = request.input.trim();
  if (!input) {
    throw new Error("A non-empty input is required to create an OpenAI response.");
  }

  if (input.length > 100_000) {
    throw new Error("OpenAI response input must be 100,000 characters or fewer.");
  }

  if (request.maxOutputTokens !== undefined && (!Number.isInteger(request.maxOutputTokens) || request.maxOutputTokens < 1)) {
    throw new Error("maxOutputTokens must be a positive whole number.");
  }

  const { model: configuredModel } = getOpenAIConfig();
  const model = request.model?.trim() || configuredModel;
  const response = await getOpenAIClient().responses.create({
    model,
    input,
    instructions: request.instructions?.trim() || undefined,
    max_output_tokens: request.maxOutputTokens,
    store: false,
  });

  return {
    id: response.id,
    model: response.model,
    status: response.status ?? "unknown",
    text: response.output_text ?? "",
    usage: normalizeTokenUsage(response.usage),
  };
}
