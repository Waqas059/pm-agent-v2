import "server-only";

import { createHmac, timingSafeEqual } from "node:crypto";

export const betaClaimCookieName = "bp_beta_claim";
const claimLifetimeSeconds = 5 * 60;

function getClaimSecret() {
  const configured = process.env.BETA_CLAIM_SECRET?.trim();
  if (configured) return configured;
  if (process.env.NODE_ENV === "production") throw new Error("BETA_CLAIM_SECRET is required in production.");
  return "local-beta-claim-secret";
}

type BetaClaim = { participantId: string; email: string; expiresAt: number };

function encode(value: string) {
  return Buffer.from(value, "utf8").toString("base64url");
}

function sign(value: string) {
  return createHmac("sha256", getClaimSecret()).update(value).digest("base64url");
}

export function createBetaClaimToken(participantId: string, email: string) {
  const claim: BetaClaim = { participantId, email, expiresAt: Math.floor(Date.now() / 1_000) + claimLifetimeSeconds };
  const payload = encode(JSON.stringify(claim));
  return `${payload}.${sign(payload)}`;
}

export function readBetaClaimToken(token: string | null | undefined) {
  if (!token) return null;
  const [payload, signature] = token.split(".");
  if (!payload || !signature) return null;
  const expected = sign(payload);
  const providedBuffer = Buffer.from(signature, "base64url");
  const expectedBuffer = Buffer.from(expected, "base64url");
  if (providedBuffer.length !== expectedBuffer.length || !timingSafeEqual(providedBuffer, expectedBuffer)) return null;
  try {
    const claim = JSON.parse(Buffer.from(payload, "base64url").toString("utf8")) as Partial<BetaClaim>;
    if (typeof claim.participantId !== "string" || typeof claim.email !== "string" || typeof claim.expiresAt !== "number") return null;
    if (claim.expiresAt <= Math.floor(Date.now() / 1_000)) return null;
    return claim as BetaClaim;
  } catch {
    return null;
  }
}

export const betaClaimCookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  maxAge: claimLifetimeSeconds,
  path: "/api/beta",
};
