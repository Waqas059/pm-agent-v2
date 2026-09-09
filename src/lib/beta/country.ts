const countryNames: Record<string, string> = {
  AE: "United Arab Emirates", BH: "Bahrain", DE: "Germany", ES: "Spain", FR: "France", IT: "Italy",
  KW: "Kuwait", OM: "Oman", PK: "Pakistan", QA: "Qatar", TR: "Türkiye", SA: "Saudi Arabia",
};

const greetingByCountry: Record<string, string> = {
  AE: "Marhaba", BH: "Marhaba", KW: "Marhaba", OM: "Marhaba", QA: "Marhaba", SA: "Marhaba",
  PK: "Assalam-o-Alaikum", FR: "Bonjour", ES: "Hola", IT: "Ciao", DE: "Hallo", TR: "Merhaba",
};

export function normalizeCountryCode(value: string | null | undefined) {
  const normalized = value?.trim().toUpperCase() ?? "";
  return /^[A-Z]{2}$/.test(normalized) ? normalized : null;
}

export function countryName(code: string | null) {
  return code ? countryNames[code] ?? code : null;
}

export function detectCountryCode(trustedHeader: string | null | undefined, browserLocale: string | null | undefined) {
  const trusted = normalizeCountryCode(trustedHeader);
  if (trusted) return trusted;
  const locale = browserLocale?.trim().replace("_", "-") ?? "";
  const region = locale.split("-")[1]?.toUpperCase();
  return normalizeCountryCode(region);
}

export function greetingForCountry(code: string | null) {
  return (code && greetingByCountry[code]) || "Welcome";
}
