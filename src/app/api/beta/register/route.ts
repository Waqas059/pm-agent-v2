import { NextResponse } from "next/server";

import { countryName, detectCountryCode } from "@/lib/beta/country";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  let body: unknown;
  try { body = await request.json(); } catch { return NextResponse.json({ error: "Provide a valid name and email." }, { status: 400 }); }
  if (!body || typeof body !== "object" || Array.isArray(body)) return NextResponse.json({ error: "Provide a valid name and email." }, { status: 400 });
  const values = body as Record<string, unknown>;
  const fullName = typeof values.fullName === "string" ? values.fullName.trim() : "";
  const preferredName = typeof values.preferredName === "string" ? values.preferredName.trim() : "";
  const email = typeof values.email === "string" ? values.email.trim().toLowerCase() : "";
  const locale = typeof values.locale === "string" ? values.locale : null;
  if (!fullName || fullName.length > 160 || !/^\S+@\S+\.\S+$/.test(email) || email.length > 320) return NextResponse.json({ error: "Enter a valid full name and email address." }, { status: 400 });
  try {
    const code = detectCountryCode(request.headers.get("x-vercel-ip-country"), locale || request.headers.get("accept-language"));
    const supabase = await createClient();
    const response = await (supabase as unknown as { rpc: (name: string, args: Record<string, unknown>) => Promise<{ data: Array<{ id: string; status: string; display_name: string }> | null; error: { message?: string } | null }> }).rpc("register_beta_participant", {
      participant_full_name: fullName,
      participant_preferred_name: preferredName,
      participant_email: email,
      detected_code: code,
      detected_name: countryName(code),
    });
    if (response.error || !response.data?.[0]) throw Error(response.error?.message || "Registration failed");
    return NextResponse.json({ registered: true, status: response.data[0].status, displayName: response.data[0].display_name, country: code ? countryName(code) : null }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Beta registration is temporarily unavailable. Please try again." }, { status: 503 });
  }
}
