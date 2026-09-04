import { describe, expect, it } from "vitest";

import { getOpenAIConfig } from "./env";

describe("OpenAI environment configuration", () => {
  it("returns the configured server values", () => {
    expect(
      getOpenAIConfig({
        OPENAI_API_KEY: "sk-test-key-with-enough-length",
        OPENAI_MODEL: "gpt-5.6",
      }),
    ).toEqual({
      apiKey: "sk-test-key-with-enough-length",
      model: "gpt-5.6",
    });
  });

  it("fails clearly when required values are missing", () => {
    expect(() => getOpenAIConfig({})).toThrow(
      "OpenAI is not configured. Set OPENAI_API_KEY and OPENAI_MODEL on the server.",
    );
  });

  it("rejects an implausibly short API key", () => {
    expect(() =>
      getOpenAIConfig({ OPENAI_API_KEY: "sk-short", OPENAI_MODEL: "gpt-5.6" }),
    ).toThrow("OPENAI_API_KEY must be a valid server-side API key.");
  });
});
