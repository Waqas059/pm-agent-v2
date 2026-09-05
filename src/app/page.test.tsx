import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import Home from "./page";

describe("PM Agent product workspace", () => {
  it("renders the workspace overview and context entry points", async () => {
    render(<Home />);

    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(
      "What are you trying to figure out?",
    );
    expect(screen.queryByRole("heading", { name: "Turn outcomes into measurable bets" })).not.toBeInTheDocument();
    await act(async () => { window.location.hash = "metrics"; window.dispatchEvent(new HashChangeEvent("hashchange")); });
    await waitFor(() => expect(screen.getByRole("heading", { name: "Turn outcomes into measurable bets" })).toBeVisible());
    fireEvent.change(screen.getByLabelText("Metric name"), { target: { value: "Activation" } });
    await act(async () => { window.location.hash = "overview"; window.dispatchEvent(new HashChangeEvent("hashchange")); });
    expect(screen.queryByRole("heading", { name: "Turn outcomes into measurable bets" })).not.toBeInTheDocument();
    await act(async () => { window.location.hash = "metrics"; window.dispatchEvent(new HashChangeEvent("hashchange")); });
    expect(screen.getByLabelText("Metric name")).toHaveValue("Activation");
    await act(async () => { window.location.hash = ""; window.dispatchEvent(new HashChangeEvent("hashchange")); });
  });
});
