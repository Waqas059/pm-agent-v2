import { describe, expect, it } from "vitest";

import { getSupabaseConfig } from "./env";

describe("Supabase environment configuration", () => {
  it("returns the configured project URL and publishable key", () => {
    expect(
      getSupabaseConfig({
        NEXT_PUBLIC_SUPABASE_URL: "https://example.supabase.co",
        NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: "sb_publishable_test",
      }),
    ).toEqual({
      url: "https://example.supabase.co",
      publishableKey: "sb_publishable_test",
    });
  });

  it("fails clearly when required values are missing", () => {
    expect(() => getSupabaseConfig({})).toThrow(
      "Supabase is not configured. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY.",
    );
  });

  it("rejects an invalid project URL", () => {
    expect(() =>
      getSupabaseConfig({
        NEXT_PUBLIC_SUPABASE_URL: "not-a-url",
        NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: "sb_publishable_test",
      }),
    ).toThrow("NEXT_PUBLIC_SUPABASE_URL must be a valid URL.");
  });
});
