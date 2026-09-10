import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

const user = { id: "user-1", email: "pm@example.com", user_metadata: {} };
const query = { select: () => query, eq: () => query, order: () => query, limit: () => query, maybeSingle: async () => ({ data: { id: "workspace-1", name: "Workspace" }, error: null }) };
const auth = { getSession: vi.fn().mockResolvedValue({ data: { session: { user } } }), getUser: vi.fn().mockResolvedValue({ data: { user }, error: null }), onAuthStateChange: vi.fn(() => ({ data: { subscription: { unsubscribe: vi.fn() } } })) };
vi.mock("@/lib/supabase/client", () => ({ createClient: () => ({ auth, from: () => query }) }));
vi.mock("@/lib/supabase/auth-fetch", () => ({ authenticatedFetch: vi.fn(async (input: RequestInfo | URL) => {
  const url = String(input);
  if (url.includes("/api/beta/me")) return new Response(JSON.stringify({ participant: { id: "participant-1" }, displayName: "PM", greeting: "Welcome", userEmail: user.email, isAdmin: false }), { status: 200 });
  return new Response(JSON.stringify({}), { status: 200 });
}) }));

import Home from "./page";

describe("PM Agent product workspace", () => {
  it("renders the workspace overview and context entry points", async () => {
    render(<Home />);

    await waitFor(() => expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent("Welcome"), { timeout: 15_000 });
    expect(screen.queryByRole("heading", { name: "Experiments" })).not.toBeInTheDocument();
    await act(async () => { window.location.hash = "metrics"; window.dispatchEvent(new HashChangeEvent("hashchange")); });
    await waitFor(() => expect(screen.getByRole("heading", { name: "Experiments" })).toBeVisible());
    fireEvent.click(screen.getByRole("button", { name: "New experiment" }));
    fireEvent.change(screen.getByLabelText("Metric name"), { target: { value: "Activation" } });
    await act(async () => { window.location.hash = "overview"; window.dispatchEvent(new HashChangeEvent("hashchange")); });
    expect(screen.queryByRole("heading", { name: "Experiments" })).not.toBeInTheDocument();
    await act(async () => { window.location.hash = "metrics"; window.dispatchEvent(new HashChangeEvent("hashchange")); });
    expect(screen.getByLabelText("Metric name")).toHaveValue("Activation");
    await act(async () => { window.location.hash = ""; window.dispatchEvent(new HashChangeEvent("hashchange")); });
  }, 15_000);
});
