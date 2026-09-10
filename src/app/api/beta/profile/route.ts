import { NextResponse } from "next/server";

import { createAdminClient } from "@/lib/supabase/admin";
import { createClient, getAuthenticatedUser } from "@/lib/supabase/server";

const participantSelect = "id,full_name,preferred_name,email,status,request_allowance,auth_user_id";

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
    const raw = await request.text();
    if (new TextEncoder().encode(raw).byteLength > 8_192) return NextResponse.json({ error: "That profile request is too large." }, { status: 413 });
    body = JSON.parse(raw);
  } catch {
    return NextResponse.json({ error: "Enter your name to continue." }, { status: 400 });
  }

  const name = body && typeof body === "object" && !Array.isArray(body) && typeof (body as Record<string, unknown>).name === "string"
    ? (body as Record<string, string>).name.trim()
    : "";
  if (!name || name.length > 160) return NextResponse.json({ error: "Enter a valid name to continue." }, { status: 400 });

  try {
    const supabase = await createClient();
    const { data, error } = await getAuthenticatedUser(supabase);
    const user = data.user;
    if (error || !user?.email) return NextResponse.json({ error: "Sign in before completing your beta profile." }, { status: 401 });

    const email = user.email.trim().toLowerCase();
    const admin = createAdminClient();
    const existing = await admin.from("beta_participants").select(participantSelect).eq("email", email).maybeSingle();
    if (existing.error) return NextResponse.json({ error: "Beta profile is temporarily unavailable." }, { status: 503 });

    const existingRecord = existing.data as unknown as Record<string, unknown> | null;
    if (existingRecord) {
      const existingAuthId = existingRecord.auth_user_id;
      if (typeof existingAuthId === "string" && existingAuthId && existingAuthId !== user.id) {
        return NextResponse.json({ error: "This email is already connected to another beta profile." }, { status: 409 });
      }
      if (typeof existingRecord.id !== "string") return NextResponse.json({ error: "Beta profile could not be completed." }, { status: 502 });
      const updated = await admin.from("beta_participants").update({ full_name: name, auth_user_id: user.id, status: "active" }).eq("id", existingRecord.id).select(participantSelect).single();
      if (updated.error || !updated.data) return NextResponse.json({ error: "Beta profile could not be completed." }, { status: 502 });
      return NextResponse.json({ participant: safeParticipant(updated.data as unknown as Record<string, unknown>) });
    }

    const created = await admin.from("beta_participants").insert({ full_name: name, email, auth_user_id: user.id, request_allowance: 10, status: "active" }).select(participantSelect).single();
    if (created.error || !created.data) return NextResponse.json({ error: "Beta profile could not be completed." }, { status: 502 });
    return NextResponse.json({ participant: safeParticipant(created.data as unknown as Record<string, unknown>) }, { status: 201 });
  } catch (error) {
    if (error instanceof Error && error.message.includes("service role")) return NextResponse.json({ error: "Beta profile is temporarily unavailable." }, { status: 503 });
    return NextResponse.json({ error: "Beta profile could not be completed." }, { status: 502 });
  }
}
