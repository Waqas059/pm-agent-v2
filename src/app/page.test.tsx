import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import Home from "./page";

describe("PM Agent product workspace", () => {
  it("renders the workspace overview and context entry points", async () => {
    render(<Home />);

    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(
      "Make your product easier to understand.",
    );
    expect(screen.getByRole("heading", { name: "Workflows built on your context" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Reach your first useful PM outcome" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Turn outcomes into measurable bets" })).toBeInTheDocument();
    expect(screen.getByText("The production application is deployed on Vercel and available for authenticated UAT.")).toBeInTheDocument();
    expect(screen.queryByText("Pending")).not.toBeInTheDocument();
  });
});
