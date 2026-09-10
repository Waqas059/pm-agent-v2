import { NextResponse } from "next/server";
import { createHmac, randomBytes } from "node:crypto";

import { betaClaimCookieName, betaClaimCookieOptions, createBetaClaimToken } from "@/lib/beta/claim";
import { createAdminClient } from "@/lib/supabase/admin";

const emailPattern = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;
const participantSelect = "id,email,auth_user_id,status";
const maxBodyBytes = 8_192;
const rateLimitWindowMs = 10 * 60 * 1_000;
const rateLimitMax = 5;
const rateLimitSecret = process.env.BETA_RATE_LIMIT_SECRET?.trim() || randomBytes(32).toString("hex");
const attempts = new Map<string, { count: number; resetAt: number }>();

function sourceKey(request: Request) {
  const forwarded = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  const source = forwarded || request.headers.get("x-real-ip")?.trim() || request.headers.get("x-vercel-forwarded-for")?.trim() || "unknown";
  return createHmac("sha256", rateLimitSecret).update(source).digest("hex");
}

function isRateLimited(request: Request) {
  const now = Date.now();
  const key = sourceKey(request);
  const current = attempts.get(key);
  if (!current || current.resetAt <= now) {
    attempts.set(key, { count: 1, resetAt: now + rateLimitWindowMs });
    return false;
  }
  current.count += 1;
  return current.count > rateLimitMax;
}

export function resetBetaRegistrationRateLimitForTests() {
  attempts.clear();
}

export async function POST(request: Request) {
  const declaredLength = Number(request.headers.get("content-length") || "0");
  if (declaredLength > maxBodyBytes) return NextResponse.json({ error: "That registration request is too large." }, { status: 413 });

  let body: unknown;
  try {
    const raw = await request.text();
    if (new TextEncoder().encode(raw).byteLength > maxBodyBytes) return NextResponse.json({ error: "That registration request is too large." }, { status: 413 });
    body = JSON.parse(raw);
  } catch {
    return NextResponse.json({ error: "Provide your name and email to continue." }, { status: 400 });
  }

  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return NextResponse.json({ error: "Provide your name and email to continue." }, { status: 400 });
  }

  const values = body as Record<string, unknown>;
  const name = typeof values.name === "string" ? values.name.trim() : "";
  const email = typeof values.email === "string" ? values.email.trim().toLowerCase() : "";
  if (name.length < 1 || name.length > 160 || !emailPattern.test(email) || email.length > 320) {
    return NextResponse.json({ error: "Enter a valid name and email address." }, { status: 400 });
  }
  if (isRateLimited(request)) return NextResponse.json({ error: "Too many registration attempts. Please try again in a few minutes." }, { status: 429 });

  try {
    const admin = createAdminClient();
    const { data, error } = await admin.from("beta_participants").insert({
      full_name: name,
      email,
      request_allowance: 10,
      status: "registered",
    }).select(participantSelect).single();

    if (!error && data) {
      const participant = data as { id: string; email: string };
      const response = NextResponse.json({ email: participant.email, created: true }, { status: 201 });
      response.cookies.set(betaClaimCookieName, createBetaClaimToken(participant.id, participant.email), betaClaimCookieOptions);
      return response;
    }

    if (error?.code === "23505") {
      const existing = await admin.from("beta_participants").select(participantSelect).eq("email", email).maybeSingle();
      if (existing.data) {
        const participant = existing.data as { id: string; email: string; auth_user_id: string | null; status: string };
        if (participant.auth_user_id) return NextResponse.json({ error: "This beta profile is already connected to another workspace." }, { status: 409 });
        if (["paused", "declined"].includes(participant.status)) return NextResponse.json({ error: "This beta profile is not currently available." }, { status: 403 });
        const response = NextResponse.json({ email: participant.email, created: false }, { status: 200 });
        response.cookies.set(betaClaimCookieName, createBetaClaimToken(participant.id, participant.email), betaClaimCookieOptions);
        return response;
      }
    }

    return NextResponse.json({ error: "We could not start your Bootstrap PM access." }, { status: 502 });
  } catch (error) {
    if (error instanceof Error && error.message.includes("service role")) {
      return NextResponse.json({ error: "Bootstrap PM registration is temporarily unavailable." }, { status: 503 });
    }
    return NextResponse.json({ error: "We could not start your Bootstrap PM access." }, { status: 502 });
  }
}
