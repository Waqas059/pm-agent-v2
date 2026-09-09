import { beforeEach, describe, expect, it, vi } from "vitest";

const authMocks = vi.hoisted(() => ({
  getSession: vi.fn(),
  refreshSession: vi.fn(),
  signOut: vi.fn(),
}));

vi.mock("./client", () => ({
  createClient: () => ({ auth: authMocks }),
}));

import { authenticatedFetch } from "./auth-fetch";

describe("authenticatedFetch", () => {
  beforeEach(() => {
    authMocks.getSession.mockReset();
    authMocks.refreshSession.mockReset();
    authMocks.signOut.mockReset();
    vi.restoreAllMocks();
  });

  it("attaches the active browser session as a bearer token", async () => {
    authMocks.getSession.mockResolvedValue({ data: { session: { access_token: "session-token" } } });
    const fetchMock = vi.fn().mockResolvedValue(new Response("ok", { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);

    const response = await authenticatedFetch("/api/protected");

    expect(response.status).toBe(200);
    const requestInit = fetchMock.mock.calls[0]?.[1] as RequestInit;
    expect(new Headers(requestInit.headers).get("Authorization")).toBe("Bearer session-token");
    expect(authMocks.refreshSession).not.toHaveBeenCalled();
  });

  it("refreshes once and reports an invalid session after a second 401", async () => {
    authMocks.getSession.mockResolvedValue({ data: { session: { access_token: "expired-token" } } });
    authMocks.refreshSession.mockResolvedValue({ data: { session: { access_token: "refreshed-token" } } });
    authMocks.signOut.mockResolvedValue({ error: null });
    const fetchMock = vi.fn().mockImplementation(() => Promise.resolve(new Response("unauthorized", { status: 401 })));
    vi.stubGlobal("fetch", fetchMock);
    const invalidSession = vi.fn();
    window.addEventListener("pm-auth-invalid", invalidSession);

    const response = await authenticatedFetch("/api/protected");

    expect(response.status).toBe(401);
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(authMocks.refreshSession).toHaveBeenCalledTimes(1);
    expect(authMocks.signOut).toHaveBeenCalledWith({ scope: "local" });
    expect(invalidSession).toHaveBeenCalledTimes(1);
    window.removeEventListener("pm-auth-invalid", invalidSession);
  });
});
