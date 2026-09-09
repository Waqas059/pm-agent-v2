import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

const authMock = vi.hoisted(() => ({
  getSession: vi.fn().mockResolvedValue({ data: { session: null } }),
  onAuthStateChange: vi.fn(() => ({ data: { subscription: { unsubscribe: vi.fn() } } })),
}));

vi.mock("@/lib/supabase/client", () => ({
  createClient: () => ({ auth: authMock }),
}));

import AuthPanel from "./auth-panel";

describe("AuthPanel", () => {
  it("keeps keyboard focus inside the sign-in dialog and returns it on Escape", async () => {
    render(<AuthPanel />);

    const trigger = await screen.findByRole("button", { name: "Sign in" });
    fireEvent.click(trigger);

    const dialog = await screen.findByRole("dialog", { name: "Sign in to continue" });
    expect(dialog).toBeVisible();
    await waitFor(() => expect(screen.getByLabelText("Email")).toHaveFocus());

    fireEvent.keyDown(document, { key: "Escape" });
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    await waitFor(() => expect(trigger).toHaveFocus());
  });
});
