import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import Home from "./page";

describe("PM Agent product workspace", () => {
  it("renders the workspace overview and context entry points", () => {
    render(<Home />);

    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(
      "Make your product easier to understand.",
    );
    expect(screen.getByRole("heading", { name: "Build your product context" })).toBeInTheDocument();
    expect(screen.getByText("Product overview")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Workflows built on your context" })).toBeInTheDocument();
  });
});
