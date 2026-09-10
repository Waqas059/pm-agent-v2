import { describe, expect, it } from "vitest";

import { detectCountryCode, detectLanguage, greetingForCountry, greetingForLocale } from "./country";

describe("beta country greeting", () => {
  it("prefers the trusted deployment header over browser locale", () => {
    expect(detectCountryCode("PK", "en-US")).toBe("PK");
  });

  it("falls back to a browser locale region", () => {
    expect(detectCountryCode(null, "en-GB")).toBe("GB");
  });

  it("prefers browser language, then country, then English", () => {
    expect(greetingForLocale("ar-SA", "SA")).toBe("Marhaba");
    expect(greetingForLocale("fr-FR", "PK")).toBe("Bonjour");
    expect(greetingForLocale("es-ES", "DE")).toBe("Hola");
    expect(greetingForLocale("de-DE", "TR")).toBe("Hallo");
    expect(greetingForLocale("tr-TR", "DE")).toBe("Merhaba");
    expect(greetingForLocale("ur-PK", "DE")).toBe("Assalam-o-Alaikum");
    expect(greetingForLocale("ja-JP", "SA")).toBe("Marhaba");
    expect(greetingForLocale("ja-JP", null)).toBe("Welcome");
    expect(detectLanguage("fr-FR,fr;q=0.9")).toBe("fr");
  });

  it("uses neutral copy when country cannot be detected", () => {
    expect(greetingForCountry(null)).toBe("Welcome");
  });

  it("never infers a greeting from an email-shaped value", () => {
    expect(detectCountryCode("", "someone@example.com")).toBeNull();
  });
});
