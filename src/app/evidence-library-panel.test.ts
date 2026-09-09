import { describe, expect, it } from "vitest";

import { filterEvidenceItems } from "./evidence-library-panel";

describe("evidence filters", () => {
  const items = [
    { kind: "quote", title: "Quote" },
    { kind: "observation", title: "Observation" },
    { kind: "metric", title: "Metric" },
  ] as Parameters<typeof filterEvidenceItems>[0];

  it("filters evidence by kind without changing the source collection", () => {
    expect(filterEvidenceItems(items, "quote").map((item) => item.title)).toEqual(["Quote"]);
    expect(filterEvidenceItems(items, "all")).toHaveLength(3);
    expect(items).toHaveLength(3);
  });
});
