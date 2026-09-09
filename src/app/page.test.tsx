import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import Home from "./page";

describe("PM Agent product workspace", () => {
  it("renders the workspace overview and context entry points", async () => {
    render(<Home />);

    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(
      "Good morning, there",
    );
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
