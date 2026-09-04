import { render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import Home from "./page";

describe("PM Agent product workspace", () => {
  it("renders the workspace overview and context entry points", async () => {
    render(<Home />);

    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(
      "Make your product easier to understand.",
    );
    await waitFor(() => expect(screen.getByRole("heading", { name: "Connect Supabase to manage context" })).toBeInTheDocument());
    expect(screen.getByRole("heading", { name: "Workflows built on your context" })).toBeInTheDocument();
  });
});
