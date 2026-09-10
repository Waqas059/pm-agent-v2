import { describe, expect, it, vi } from "vitest";

const workflowMock = vi.hoisted(() => ({ runDiscoverWorkflow: vi.fn() }));
const betaMock = vi.hoisted(() => {
  class BetaUsageUnavailableError extends Error {}
  return { BetaUsageLimitError: class extends Error {}, BetaUsageUnavailableError, finalizeBetaRequest: vi.fn(), getBetaUsage: vi.fn(), reserveBetaRequest: vi.fn() };
});
const supabaseMock = vi.hoisted(() => {
  const makeQuery = (table: string) => {
    const result = table === "workspaces"
      ? { data: { id: "workspace-1" }, error: null }
      : table === "evidence_items"
        ? { data: [{ id: "evidence-1", kind: "quote", title: "Interview", content: "Evidence", source_label: "Interview" }], error: null }
        : table === "evidence_citations"
          ? { data: [{ evidence_item_id: "evidence-1", citation_key: "E1" }], error: null }
          : { data: [], error: null };
    const query = {
      select: () => query,
      eq: () => query,
      order: () => query,
      limit: () => query,
      maybeSingle: async () => result,
      then: (resolve: (value: typeof result) => unknown) => Promise.resolve(result).then(resolve),
    };
    return query;
  };
  const supabase = { from: (table: string) => makeQuery(table) };
  return { createClient: vi.fn(async () => supabase), getAuthenticatedUser: vi.fn(async () => ({ data: { user: { id: "user-1" } }, error: null })), supabase };
});

vi.mock("@/lib/workflows/discover", () => workflowMock);
vi.mock("@/lib/beta/server", () => betaMock);
vi.mock("@/lib/supabase/server", () => supabaseMock);
vi.mock("@/lib/analytics", () => ({ recordProductEvent: vi.fn() }));
vi.mock("@/lib/workflows/runs", () => ({ startWorkflowRun: vi.fn(), updateWorkflowRun: vi.fn(), updateWorkflowStep: vi.fn(), WorkflowUsageLimitError: class extends Error {} }));

import { POST } from "./route";

describe("discover quota boundary", () => {
  it("does not start or call the provider when beta usage cannot be verified", async () => {
    betaMock.reserveBetaRequest.mockRejectedValueOnce(new betaMock.BetaUsageUnavailableError());
    const response = await POST(new Request("http://localhost/api/workflows/discover", { method: "POST", body: JSON.stringify({ question: "What should we improve?" }) }));
    expect(response.status).toBe(503);
    expect(workflowMock.runDiscoverWorkflow).not.toHaveBeenCalled();
  });
});
