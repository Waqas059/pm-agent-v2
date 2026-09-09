import { describe, expect, it } from "vitest";

import { detectCountryCode, greetingForCountry } from "./country";

describe("beta country greeting", () => {
  it("prefers the trusted deployment header over browser locale", () => {
    expect(detectCountryCode("PK", "en-US")).toBe("PK");
  });

  it("falls back to a browser locale region", () => {
    expect(detectCountryCode(null, "en-GB")).toBe("GB");
  });

  it("uses neutral copy when country cannot be detected", () => {
    expect(greetingForCountry(null)).toBe("Welcome");
  });

  it("never infers a greeting from an email-shaped value", () => {
    expect(detectCountryCode("", "someone@example.com")).toBeNull();
  });
});
