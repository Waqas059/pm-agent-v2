import { beforeEach, describe, expect, it, vi } from "vitest";

const serverMock = vi.hoisted(() => ({
  createClient: vi.fn(),
  getAuthenticatedUser: vi.fn(),
}));
const adminMock = vi.hoisted(() => ({ createAdminClient: vi.fn() }));

vi.mock("next/headers", () => ({ cookies: vi.fn(async () => ({ get: vi.fn(() => ({ value: "claim-token" })) })) }));
vi.mock("@/lib/beta/claim", () => ({ betaClaimCookieName: "bp_beta_claim", readBetaClaimToken: vi.fn(() => ({ participantId: "participant-1", email: "ahmed@example.com", expiresAt: Date.now() + 60_000 })) }));
vi.mock("@/lib/supabase/server", () => serverMock);
vi.mock("@/lib/supabase/admin", () => adminMock);

import { POST } from "./route";

function queryChain(result: unknown) {
  const value: Record<string, ReturnType<typeof vi.fn>> = {};
  value.select = vi.fn(() => value);
  value.eq = vi.fn(() => value);
  value.is = vi.fn(() => value);
  value.order = vi.fn(() => value);
  value.limit = vi.fn(() => value);
  value.maybeSingle = vi.fn().mockResolvedValue(result);
  value.single = vi.fn().mockResolvedValue(result);
  return value;
}

describe("beta entry handoff", () => {
  beforeEach(() => {
    serverMock.getAuthenticatedUser.mockReset();
    adminMock.createAdminClient.mockReset();
  });

  it("does not accept a password-authenticated session as a guest entry", async () => {
    serverMock.getAuthenticatedUser.mockResolvedValueOnce({ data: { user: { id: "user-1", is_anonymous: false } }, error: null });
    const admin = { from: vi.fn() };
    adminMock.createAdminClient.mockReturnValueOnce(admin);

    const response = await POST(new Request("http://localhost/api/beta/enter", { method: "POST" }));

    expect(response.status).toBe(403);
    expect(admin.from).not.toHaveBeenCalled();
  });

  it("consumes the signed claim, links the guest identity, and creates its first workspace", async () => {
    serverMock.getAuthenticatedUser.mockResolvedValueOnce({ data: { user: { id: "guest-1", is_anonymous: true } }, error: null });
    const participantRead = queryChain({ data: { id: "participant-1", email: "ahmed@example.com", status: "registered", auth_user_id: null }, error: null });
    const participantLink = { update: vi.fn(() => queryChain({ data: { id: "participant-1" }, error: null })) };
    const workspaceRead = queryChain({ data: null, error: null });
    const workspaceInsert = { insert: vi.fn(() => queryChain({ data: { id: "workspace-1" }, error: null })) };
    const participantActivation = { update: vi.fn(() => ({ eq: vi.fn(() => ({ eq: vi.fn().mockResolvedValue({ error: null }) })) })) };
    const admin = { from: vi.fn()
      .mockReturnValueOnce(participantRead)
      .mockReturnValueOnce(participantLink)
      .mockReturnValueOnce(workspaceRead)
      .mockReturnValueOnce(workspaceInsert)
      .mockReturnValueOnce(participantActivation) };
    adminMock.createAdminClient.mockReturnValueOnce(admin);

    const response = await POST(new Request("http://localhost/api/beta/enter", { method: "POST" }));

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ email: "ahmed@example.com", created: false });
    expect(participantLink.update).toHaveBeenCalledWith({ auth_user_id: "guest-1" });
    expect(workspaceInsert.insert).toHaveBeenCalledWith(expect.objectContaining({ owner_id: "guest-1", name: "Product workspace" }));
    expect(participantActivation.update).toHaveBeenCalledWith({ status: "active" });
  });
});
