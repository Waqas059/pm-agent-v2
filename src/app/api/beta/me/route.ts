import { NextResponse } from "next/server";

import { betaConfig } from "@/lib/beta/config";
import { countryName, detectCountryCode, greetingForCountry } from "@/lib/beta/country";
import { getBetaUsage, getMyBetaParticipant } from "@/lib/beta/server";
import { createClient, getAuthenticatedUser } from "@/lib/supabase/server";

export async function GET(request: Request) {
  try {
    const supabase = await createClient();
    const { data, error } = await getAuthenticatedUser(supabase);
    if (error || !data.user) return NextResponse.json({ error: "Sign in before reading beta status." }, { status: 401 });
    const locale = new URL(request.url).searchParams.get("locale");
    const participant = await getMyBetaParticipant(supabase);
    const code = detectCountryCode(request.headers.get("x-vercel-ip-country"), locale || request.headers.get("accept-language"));
    const usage = await getBetaUsage(supabase);
    if (code) {
      await (supabase as unknown as { rpc: (name: string, args: Record<string, unknown>) => Promise<unknown> }).rpc("record_my_beta_country", { detected_code: code, detected_name: countryName(code) });
    }
    const displayName = participant?.preferred_name || participant?.full_name || data.user.user_metadata?.full_name || data.user.email?.split("@")[0] || "there";
    return NextResponse.json({
      accessMode: betaConfig.accessMode,
      participant: participant ? { ...participant, country_code: code || participant.country_code, country_name: countryName(code || participant.country_code) } : null,
      greeting: greetingForCountry(code || participant?.country_code || null),
      displayName,
      usage: usage ? { used: usage.used, allowance: usage.allowance, remaining: usage.remaining, registered: usage.registered } : { used: 0, allowance: null, remaining: null, registered: false },
      contact: betaConfig.contact,
    });
  } catch {
    return NextResponse.json({ error: "Beta status could not be loaded." }, { status: 502 });
  }
}
