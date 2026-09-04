import { describe, expect, it } from "vitest";

import {
  parseStructuredOutput,
  StructuredOutputError,
  validateStructuredWorkflowRequest,
} from "./structured-output";

const schema = {
  type: "object",
  properties: { title: { type: "string" } },
  required: ["title"],
  additionalProperties: false,
};

describe("structured workflow contracts", () => {
  it("parses valid JSON through the runtime validator", () => {
    const result = parseStructuredOutput('{"title":"A useful result"}', (value) => {
      if (
        typeof value !== "object" ||
        value === null ||
        !("title" in value) ||
        typeof value.title !== "string"
      ) {
        throw new Error("title is required");
      }

      return { title: value.title };
    });

    expect(result).toEqual({ title: "A useful result" });
  });

  it("rejects invalid JSON and parser failures explicitly", () => {
    expect(() => parseStructuredOutput("not-json", () => null)).toThrow(StructuredOutputError);
    expect(() => parseStructuredOutput("{}", () => {
      throw new Error("missing required field");
    })).toThrow("failed runtime validation");
  });

  it("validates the workflow request boundary", () => {
    expect(() => validateStructuredWorkflowRequest({ name: "", input: "input", schema })).toThrow(
      "Structured output names",
    );
    expect(() => validateStructuredWorkflowRequest({ name: "valid_name", input: " ", schema })).toThrow(
      "non-empty input",
    );
    expect(() =>
      validateStructuredWorkflowRequest({ name: "valid_name", input: "input", schema, maxOutputTokens: 0 }),
    ).toThrow("positive whole number");
  });
});
