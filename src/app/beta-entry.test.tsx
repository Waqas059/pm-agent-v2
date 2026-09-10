import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

const authMock = vi.hoisted(() => ({
  getSession: vi.fn().mockResolvedValue({ data: { session: null } }),
  onAuthStateChange: vi.fn(() => ({ data: { subscription: { unsubscribe: vi.fn() } } })),
}));

vi.mock("@/lib/supabase/client", () => ({ createClient: () => ({ auth: authMock }) }));
vi.mock("@/lib/supabase/auth-fetch", () => ({ authenticatedFetch: vi.fn() }));

import BetaEntry from "./beta-entry";

describe("BetaEntry", () => {
  it("collects name and email before opening authentication with the email prefilled", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ participant: { email: "ahmed@example.com" }, created: true }),
    }));

    render(<BetaEntry />);
    fireEvent.click(screen.getByRole("button", { name: "Use Bootstrap PM" }));
    fireEvent.change(screen.getByLabelText("Name"), { target: { value: "Ahmed Al-Qahtani" } });
    fireEvent.change(screen.getByLabelText("Email"), { target: { value: "ahmed@example.com" } });
    fireEvent.click(screen.getByRole("button", { name: "Continue" }));

    await waitFor(() => expect(screen.getByRole("button", { name: "Continue to workspace" })).toBeVisible());
    expect(screen.getByRole("dialog", { name: "Create your account" })).toBeVisible();
    expect(screen.getByLabelText("Email")).toHaveValue("ahmed@example.com");
    expect(screen.queryByLabelText("Name")).not.toBeInTheDocument();
  });
});
