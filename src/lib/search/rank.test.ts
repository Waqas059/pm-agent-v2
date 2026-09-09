import { describe, expect, it } from "vitest";

import { rankSearchResults, type SearchCandidate } from "./rank";

const candidate = (id: string, title: string, detail: string): SearchCandidate => ({
  id,
  type: "Evidence",
  title,
  detail,
  href: "#evidence",
});

describe("workspace search ranking", () => {
  it("ranks title matches above detail-only matches", () => {
    const ranked = rankSearchResults([
      candidate("detail", "Onboarding notes", "The setup flow creates friction."),
      candidate("title", "Setup flow", "A short product note."),
    ], "setup flow");

    expect(ranked.map((item) => item.id)).toEqual(["title", "detail"]);
  });

  it("keeps equal-score results in their original order", () => {
    const ranked = rankSearchResults([
      candidate("first", "Alpha", "Shared detail"),
      candidate("second", "Beta", "Shared detail"),
    ], "shared");

    expect(ranked.map((item) => item.id)).toEqual(["first", "second"]);
  });

  it("uses source type and token-prefix signals without hiding detail-only evidence", () => {
    const ranked = rankSearchResults([
      { ...candidate("artifact", "Setup brief", "A short note."), type: "Artifact" },
      { ...candidate("evidence", "Setup observation", "A source-backed note."), type: "Evidence" },
      { ...candidate("context", "Product context", "The setup experience matters."), type: "Context" },
    ], "setup");

    expect(ranked.map((item) => item.id)).toEqual(["evidence", "artifact", "context"]);
  });
});
