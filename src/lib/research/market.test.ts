import { describe, expect, it } from "vitest";
import { vi } from "vitest";

vi.mock("server-only", () => ({}));

import { parseMarketOutput } from "./market";

describe("market research contract", () => {
  it("rejects claims that cite URLs not returned by web retrieval", () => {
    expect(() => parseMarketOutput({ summary: "Summary", findings: [{ title: "Claim", claim: "Claim", sourceUrls: ["https://unverified.example"] }], sources: [{ url: "https://unverified.example", title: "Unverified", excerpt: "Excerpt" }], limitations: [] }, [{ url: "https://verified.example", title: "Verified" }])).toThrow("was not returned by web retrieval");
  });

  it("adds retrieval dates only to verified external sources", () => {
    const result = parseMarketOutput({ summary: "Summary", findings: [{ title: "Claim", claim: "Claim", sourceUrls: ["https://verified.example"] }], sources: [{ url: "https://verified.example", title: "Verified", excerpt: "Excerpt" }], limitations: ["Small sample"] }, [{ url: "https://verified.example", title: "Verified" }]);
    expect(result.sources[0]).toMatchObject({ url: "https://verified.example", title: "Verified", excerpt: "Excerpt" });
    expect(result.sources[0].retrievedAt).toEqual(expect.any(String));
  });
});
