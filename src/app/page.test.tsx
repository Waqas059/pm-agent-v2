import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import Home from "./page";

describe("PM Agent foundation shell", () => {
  it("renders the product promise and initial workflow path", () => {
    render(<Home />);

    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(
      "Make better product decisions from the context you already have.",
    );
    expect(screen.getByText("Discover & synthesize")).toBeInTheDocument();
    expect(screen.getByText("PM Agent should know your product—not just answer a prompt.")).toBeInTheDocument();
  });
});
