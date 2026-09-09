import { describe, expect, it } from "vitest";

import { assertIntegrationConsent, GITHUB_PUBLIC_PREVIEW_CONSENT } from "./integrations";

describe("external integration consent", () => {
  it("allows the bounded public GitHub preview scope", () => {
    expect(() => assertIntegrationConsent(GITHUB_PUBLIC_PREVIEW_CONSENT)).not.toThrow();
  });

  it("rejects unconfirmed or write-capable actions", () => {
    expect(() => assertIntegrationConsent({ ...GITHUB_PUBLIC_PREVIEW_CONSENT, confirmed: false })).toThrow("explicit confirmation");
    expect(() => assertIntegrationConsent({ ...GITHUB_PUBLIC_PREVIEW_CONSENT, action: "write" })).toThrow("write actions");
  });
});
