import { NextResponse } from "next/server";
import { createHmac, randomBytes } from "node:crypto";

import { createAdminClient } from "@/lib/supabase/admin";

const emailPattern = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;
const participantSelect = "id,full_name,preferred_name,email,status,request_allowance";
const maxBodyBytes = 8_192;
const rateLimitWindowMs = 10 * 60 * 1_000;
const rateLimitMax = 5;
const rateLimitSecret = process.env.BETA_RATE_LIMIT_SECRET?.trim() || randomBytes(32).toString("hex");
const attempts = new Map<string, { count: number; resetAt: number }>();

function safeParticipant(participant: Record<string, unknown>) {
  return {
    id: participant.id,
    full_name: participant.full_name,
    preferred_name: participant.preferred_name,
    email: participant.email,
    status: participant.status,
    request_allowance: participant.request_allowance,
  };
}

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

    if (!error && data) return NextResponse.json({ participant: safeParticipant(data as unknown as Record<string, unknown>), created: true }, { status: 201 });

    if (error?.code === "23505") {
      const existing = await admin.from("beta_participants").select(participantSelect).eq("email", email).maybeSingle();
      if (existing.data) return NextResponse.json({ participant: safeParticipant(existing.data as unknown as Record<string, unknown>), created: false }, { status: 200 });
    }

    return NextResponse.json({ error: "We could not start your Bootstrap PM access." }, { status: 502 });
  } catch (error) {
    if (error instanceof Error && error.message.includes("service role")) {
      return NextResponse.json({ error: "Bootstrap PM registration is temporarily unavailable." }, { status: 503 });
    }
    return NextResponse.json({ error: "We could not start your Bootstrap PM access." }, { status: 502 });
  }
}
