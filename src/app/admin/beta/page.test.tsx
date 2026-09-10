import { cleanup, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const authMock = vi.hoisted(() => ({
  getSession: vi.fn(),
  onAuthStateChange: vi.fn(() => ({ data: { subscription: { unsubscribe: vi.fn() } } })),
  signInWithPassword: vi.fn(),
  signOut: vi.fn(),
}));
const fetchMock = vi.hoisted(() => vi.fn());

vi.mock("@/lib/supabase/client", () => ({ createClient: () => ({ auth: authMock }) }));
vi.mock("@/lib/supabase/auth-fetch", () => ({ authenticatedFetch: fetchMock }));

import BetaAdminPage from "./page";

describe("BetaAdminPage authentication", () => {
  beforeEach(() => {
    authMock.getSession.mockResolvedValue({ data: { session: null } });
    fetchMock.mockReset();
  });
  afterEach(() => cleanup());

  it("shows a dedicated signed-out admin sign-in screen", async () => {
    render(<BetaAdminPage />);
    expect(await screen.findByRole("heading", { name: "Bootstrap PM Admin" })).toBeVisible();
    expect(screen.getByText("Sign in to continue")).toBeVisible();
    expect(screen.getByLabelText("Email")).toBeVisible();
    expect(screen.getByLabelText("Password")).toBeVisible();
    expect(screen.getByRole("button", { name: "Sign in" })).toBeVisible();
    expect(screen.queryByText("Start using Bootstrap PM")).not.toBeInTheDocument();
  });

  it("shows access denied after server authorization rejects an authenticated user", async () => {
    authMock.getSession.mockResolvedValue({ data: { session: { user: { email: "person@example.com" } } } });
    fetchMock.mockResolvedValue(new Response(JSON.stringify({ isAdmin: false }), { status: 200 }));
    render(<BetaAdminPage />);
    await waitFor(() => expect(screen.getByRole("heading", { name: "Access denied" })).toBeVisible());
    expect(screen.getByText("Your signed-in account is not authorized for beta operations.")).toBeVisible();
  });
});
