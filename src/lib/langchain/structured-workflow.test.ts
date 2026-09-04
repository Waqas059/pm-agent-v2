import { describe, expect, it, vi } from "vitest";

import type { RunStructuredWorkflowRequest } from "@/lib/openai/workflows";

vi.mock("server-only", () => ({}));

import { createStructuredWorkflowChain } from "./structured-workflow";

const request: RunStructuredWorkflowRequest<{ title: string }> = {
  name: "test_workflow",
  input: "Use this input.",
  schema: {
    type: "object",
    properties: { title: { type: "string" } },
    required: ["title"],
    additionalProperties: false,
  },
  parse: (value: unknown) => value as { title: string },
};

describe("LangChain structured workflow orchestration", () => {
  it("validates then invokes the injected workflow executor", async () => {
    const executor = vi.fn(async (receivedRequest: RunStructuredWorkflowRequest<{ title: string }>) => ({
      id: receivedRequest.name,
      model: "test-model",
      status: "completed",
      output: { title: "Chained result" },
    }));

    const result = await createStructuredWorkflowChain(executor).invoke(request);

    expect(executor).toHaveBeenCalledOnce();
    expect(executor).toHaveBeenCalledWith(request);
    expect(result).toEqual({
      id: "test_workflow",
      model: "test-model",
      status: "completed",
      output: { title: "Chained result" },
    });
  });

  it("rejects invalid requests before the executor runs", async () => {
    const executor = vi.fn(async () => ({
      id: "run_test",
      model: "test-model",
      status: "completed",
      output: { title: "unused" },
    }));

    await expect(createStructuredWorkflowChain(executor).invoke({ ...request, input: " " })).rejects.toThrow(
      "non-empty input",
    );
    expect(executor).not.toHaveBeenCalled();
  });
});
