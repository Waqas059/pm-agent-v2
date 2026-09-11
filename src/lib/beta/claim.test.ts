import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

import { createBetaClaimToken, readBetaClaimToken } from "./claim";

describe("beta claim tokens", () => {
  beforeEach(() => {
    vi.useRealTimers();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("rejects a tampered participant or email payload", () => {
    const token = createBetaClaimToken("participant-1", "ahmed@example.com");
    const [payload, signature] = token.split(".");
    const tamperedPayload = Buffer.from(JSON.stringify({ participantId: "participant-2", email: "sara@example.com", expiresAt: Math.floor(Date.now() / 1_000) + 300 }), "utf8").toString("base64url");

    expect(readBetaClaimToken(`${tamperedPayload}.${signature}`)).toBeNull();
    expect(readBetaClaimToken(token)).toMatchObject({ participantId: "participant-1", email: "ahmed@example.com" });
    expect(payload).toBeTruthy();
  });

  it("rejects an expired claim", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-09-11T00:00:00.000Z"));
    const token = createBetaClaimToken("participant-1", "ahmed@example.com");
    vi.advanceTimersByTime(5 * 60 * 1_000 + 1_000);

    expect(readBetaClaimToken(token)).toBeNull();
  });

  it("does not use a hardcoded signing secret in production", () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("BETA_CLAIM_SECRET", "");

    expect(() => createBetaClaimToken("participant-1", "ahmed@example.com")).toThrow("BETA_CLAIM_SECRET is required in production");
  });
});
