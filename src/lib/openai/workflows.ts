import "server-only";

import { getOpenAIClient } from "./client";
import { getOpenAIConfig } from "./env";
import {
  type JsonSchema,
  parseStructuredOutput,
  type StructuredOutputParser,
  validateStructuredWorkflowRequest,
} from "./structured-output";

export type RunStructuredWorkflowRequest<T> = {
  name: string;
  description?: string;
  instructions?: string;
  input: string;
  schema: JsonSchema;
  parse: StructuredOutputParser<T>;
  model?: string;
  maxOutputTokens?: number;
};

export type StructuredWorkflowResult<T> = {
  id: string;
  model: string;
  status: string;
  output: T;
};

export async function runStructuredWorkflow<T>(
  request: RunStructuredWorkflowRequest<T>,
): Promise<StructuredWorkflowResult<T>> {
  validateStructuredWorkflowRequest(request);

  const name = request.name.trim();
  const input = request.input.trim();
  const instructions = request.instructions?.trim() || undefined;
  const description = request.description?.trim() || undefined;
  const { model: configuredModel } = getOpenAIConfig();
  const model = request.model?.trim() || configuredModel;

  const response = await getOpenAIClient().responses.create({
    model,
    input,
    instructions,
    max_output_tokens: request.maxOutputTokens,
    store: false,
    text: {
      format: {
        type: "json_schema",
        name,
        description,
        strict: true,
        schema: request.schema,
      },
    },
  });

  if (response.status !== "completed") {
    throw new Error(`OpenAI structured workflow did not complete (status: ${response.status ?? "unknown"}).`);
  }

  return {
    id: response.id,
    model: response.model,
    status: response.status,
    output: parseStructuredOutput(response.output_text, request.parse),
  };
}
