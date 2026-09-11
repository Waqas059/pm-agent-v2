import { cleanup, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const fetchMock = vi.hoisted(() => vi.fn());
vi.mock("@/lib/supabase/auth-fetch", () => ({ authenticatedFetch: fetchMock }));
const signOutMock = vi.hoisted(() => vi.fn().mockResolvedValue({ error: null }));
vi.mock("@/lib/supabase/client", () => ({ createClient: () => ({ auth: { signOut: signOutMock } }) }));

import BetaProfileGate from "./beta-profile-gate";

describe("BetaProfileGate", () => {
  beforeEach(() => fetchMock.mockReset());
  afterEach(() => cleanup());

  it("requires a profile for a signed-in user without a beta participant", async () => {
    fetchMock.mockResolvedValueOnce(new Response(JSON.stringify({ participant: null, isAdmin: false, userEmail: "person@example.com" }), { status: 200 }));
    render(<BetaProfileGate><p>Workspace content</p></BetaProfileGate>);
    expect(await screen.findByRole("heading", { name: "Complete your Bootstrap PM beta profile" })).toBeVisible();
    expect(screen.getByLabelText("Email")).toHaveValue("person@example.com");
    expect(screen.queryByText("Workspace content")).not.toBeInTheDocument();
  });

  it("allows the configured super admin through without a participant profile", async () => {
    fetchMock.mockResolvedValueOnce(new Response(JSON.stringify({ participant: null, isAdmin: true, userEmail: "admin@example.com" }), { status: 200 }));
    render(<BetaProfileGate><p>Workspace content</p></BetaProfileGate>);
    await waitFor(() => expect(screen.getByText("Workspace content")).toBeVisible());
    expect(screen.queryByRole("heading", { name: "Complete your Bootstrap PM beta profile" })).not.toBeInTheDocument();
  });

  it("returns an incomplete anonymous session to the public entry flow", async () => {
    fetchMock.mockResolvedValueOnce(new Response(JSON.stringify({ participant: null, isAdmin: false, isAnonymous: true }), { status: 200 }));
    render(<BetaProfileGate><p>Workspace content</p></BetaProfileGate>);

    expect(await screen.findByRole("heading", { name: "Return to beta entry" })).toBeVisible();
    expect(signOutMock).toHaveBeenCalledWith({ scope: "local" });
    expect(screen.queryByText("Complete your Bootstrap PM beta profile")).not.toBeInTheDocument();
    expect(screen.queryByText("Workspace content")).not.toBeInTheDocument();
  });
});
