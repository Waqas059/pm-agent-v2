export type JsonSchema = Record<string, unknown>;

export type StructuredOutputParser<T> = (value: unknown) => T;

export class StructuredOutputError extends Error {
  constructor(message: string, options?: { cause?: unknown }) {
    super(message, options);
    this.name = "StructuredOutputError";
  }
}

export function validateStructuredWorkflowRequest(request: {
  name: string;
  input: string;
  schema: JsonSchema;
  maxOutputTokens?: number;
}): void {
  const name = request.name.trim();
  if (!name || !/^[A-Za-z0-9_-]{1,64}$/.test(name)) {
    throw new StructuredOutputError(
      "Structured output names must be 1-64 characters using only letters, numbers, underscores, or dashes.",
    );
  }

  if (!request.input.trim()) {
    throw new StructuredOutputError("A non-empty input is required to run a structured workflow.");
  }

  if (request.input.length > 100_000) {
    throw new StructuredOutputError("Structured workflow input must be 100,000 characters or fewer.");
  }

  if (request.schema === null || Array.isArray(request.schema) || typeof request.schema !== "object") {
    throw new StructuredOutputError("A JSON Schema object is required for structured workflow output.");
  }

  if (
    request.maxOutputTokens !== undefined &&
    (!Number.isInteger(request.maxOutputTokens) || request.maxOutputTokens < 1)
  ) {
    throw new StructuredOutputError("maxOutputTokens must be a positive whole number.");
  }
}

export function parseStructuredOutput<T>(text: string, parse: StructuredOutputParser<T>): T {
  const normalizedText = text.trim();
  if (!normalizedText) {
    throw new StructuredOutputError("The structured workflow returned no output.");
  }

  let value: unknown;
  try {
    value = JSON.parse(normalizedText) as unknown;
  } catch (error) {
    throw new StructuredOutputError("The structured workflow returned invalid JSON.", { cause: error });
  }

  try {
    return parse(value);
  } catch (error) {
    throw new StructuredOutputError("The structured workflow output failed runtime validation.", { cause: error });
  }
}
