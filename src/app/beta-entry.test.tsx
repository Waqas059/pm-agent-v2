import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

const authMock = vi.hoisted(() => ({
  getSession: vi.fn().mockResolvedValue({ data: { session: null } }),
  signInAnonymously: vi.fn().mockResolvedValue({ data: { session: { user: { id: "guest-1", is_anonymous: true } } }, error: null }),
  onAuthStateChange: vi.fn(() => ({ data: { subscription: { unsubscribe: vi.fn() } } })),
}));

vi.mock("@/lib/supabase/client", () => ({ createClient: () => ({ auth: authMock }) }));
const authenticatedFetchMock = vi.hoisted(() => vi.fn());
vi.mock("@/lib/supabase/auth-fetch", () => ({ authenticatedFetch: authenticatedFetchMock }));

import BetaEntry from "./beta-entry";

describe("BetaEntry", () => {
  it("opens the workspace after name and email without a second authentication prompt", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(JSON.stringify({ email: "ahmed@example.com", created: true }), { status: 201 })));
    authenticatedFetchMock.mockResolvedValue(new Response(JSON.stringify({ email: "ahmed@example.com", created: true }), { status: 201 }));

    render(<BetaEntry />);
    fireEvent.click(screen.getByRole("button", { name: "Use Bootstrap PM" }));
    fireEvent.change(screen.getByLabelText("Name"), { target: { value: "Ahmed Al-Qahtani" } });
    fireEvent.change(screen.getByLabelText("Email"), { target: { value: "ahmed@example.com" } });
    fireEvent.click(screen.getByRole("button", { name: "Continue" }));

    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
    expect(authMock.signInAnonymously).toHaveBeenCalledOnce();
    expect(authenticatedFetchMock).toHaveBeenCalledWith("/api/beta/enter", expect.objectContaining({ method: "POST" }));
    expect(screen.queryByText("Workspace Access")).not.toBeInTheDocument();
    expect(screen.queryByText("Password")).not.toBeInTheDocument();
  });
});
