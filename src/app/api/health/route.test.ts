import { describe, expect, it } from "vitest";

import { GET } from "./route";

describe("health endpoint", () => {
  it("returns a minimal non-sensitive status payload with a release marker", async () => {
    const response = GET();
    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({
      status: "ok",
      service: "pm-agent",
      release: expect.any(String),
      checks: { app: "ok" },
    });
  });
});
