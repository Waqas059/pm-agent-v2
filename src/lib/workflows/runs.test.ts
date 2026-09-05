import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

import { SERVER_WORKFLOW_RUN_LIMIT, hasReachedWorkflowRunLimit } from "./runs";

describe("server workflow usage guardrail", () => {
  it("allows a workspace below the limit", () => {
    expect(hasReachedWorkflowRunLimit(SERVER_WORKFLOW_RUN_LIMIT - 1)).toBe(false);
  });

  it("blocks the limit and treats missing counts as unavailable", () => {
    expect(hasReachedWorkflowRunLimit(SERVER_WORKFLOW_RUN_LIMIT)).toBe(true);
    expect(hasReachedWorkflowRunLimit(null)).toBe(false);
  });
});
