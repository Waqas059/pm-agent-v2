import { describe, expect, it } from "vitest";

import { firstNameFromValue, resolveDisplayFirstName } from "./name";

describe("beta display names", () => {
  it("uses the approved precedence and first token", () => {
    expect(resolveDisplayFirstName("", "Ahmed Al-Qahtani", "A. User")).toBe("Ahmed");
    expect(resolveDisplayFirstName(null, "", "A. User")).toBe("A.");
    expect(resolveDisplayFirstName("Amina", "Other Person", "Profile")).toBe("Amina");
    expect(resolveDisplayFirstName(undefined, undefined, undefined)).toBeNull();
    expect(firstNameFromValue("  Ahmed   Al-Qahtani ")).toBe("Ahmed");
  });
});
