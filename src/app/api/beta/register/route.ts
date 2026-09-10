import { NextResponse } from "next/server";

import { createAdminClient } from "@/lib/supabase/admin";

const emailPattern = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;
const participantSelect = "id,full_name,preferred_name,email,status,request_allowance";

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

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
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

  try {
    const admin = createAdminClient();
    const { data, error } = await admin.from("beta_participants").insert({
      full_name: name,
      email,
      request_allowance: 10,
      status: "registered",
    }).select(participantSelect).single();

    if (!error && data) return NextResponse.json({ participant: safeParticipant(data as unknown as Record<string, unknown>) }, { status: 201 });

    if (error?.code === "23505") {
      const existing = await admin.from("beta_participants").select(participantSelect).eq("email", email).maybeSingle();
      if (existing.data) return NextResponse.json({ participant: safeParticipant(existing.data as unknown as Record<string, unknown>) }, { status: 200 });
    }

    return NextResponse.json({ error: "We could not start your Bootstrap PM access." }, { status: 502 });
  } catch (error) {
    if (error instanceof Error && error.message.includes("service role")) {
      return NextResponse.json({ error: "Bootstrap PM registration is temporarily unavailable." }, { status: 503 });
    }
    return NextResponse.json({ error: "We could not start your Bootstrap PM access." }, { status: 502 });
  }
}
