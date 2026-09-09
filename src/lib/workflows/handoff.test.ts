import { describe, expect, it } from "vitest";

import { isSupportedHandoff } from "./handoff";

describe("workflow handoff compatibility", () => {
  it("keeps Discover handoffs available for Define and Align", () => {
    expect(isSupportedHandoff("discover_synthesize", "define_specify")).toBe(true);
    expect(isSupportedHandoff("discover_synthesize", "align_communicate")).toBe(true);
  });

  it("allows a completed Define artifact to move into Align", () => {
    expect(isSupportedHandoff("define_specify", "align_communicate")).toBe(true);
  });

  it("does not allow Define to bypass into another Define run", () => {
    expect(isSupportedHandoff("define_specify", "define_specify")).toBe(false);
  });
});

