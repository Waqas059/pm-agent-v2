import { NextResponse } from "next/server";

import { betaConfig } from "@/lib/beta/config";
import { countryName, detectCountryCode, greetingForLocale } from "@/lib/beta/country";
import { getBetaUsage, getMyBetaParticipant } from "@/lib/beta/server";
import { resolveDisplayFirstName } from "@/lib/beta/name";
import { isBetaAdmin } from "@/lib/beta/config";
import { createClient, getAuthenticatedUser } from "@/lib/supabase/server";

export async function GET(request: Request) {
  try {
    const supabase = await createClient();
    const { data, error } = await getAuthenticatedUser(supabase);
    if (error || !data.user) return NextResponse.json({ error: "Sign in before reading beta status." }, { status: 401 });
    const locale = new URL(request.url).searchParams.get("locale");
    const acceptLanguage = request.headers.get("accept-language");
    const participant = await getMyBetaParticipant(supabase);
    const countryLocale = locale?.includes("-") ? locale : acceptLanguage || locale;
    const code = detectCountryCode(request.headers.get("x-vercel-ip-country"), countryLocale);
    const usage = await getBetaUsage(supabase);
    if (code) {
      await (supabase as unknown as { rpc: (name: string, args: Record<string, unknown>) => Promise<unknown> }).rpc("record_my_beta_country", { detected_code: code, detected_name: countryName(code) });
    }
    const metadata = data.user.user_metadata && typeof data.user.user_metadata === "object" ? data.user.user_metadata as Record<string, unknown> : {};
    const profileFullName = typeof metadata.full_name === "string" ? metadata.full_name : null;
    const profileFirstName = typeof metadata.first_name === "string" ? metadata.first_name : null;
    const displayName = resolveDisplayFirstName(participant?.preferred_name, participant?.full_name, profileFullName || profileFirstName);
    return NextResponse.json({
      accessMode: betaConfig.accessMode,
      participant: participant ? { ...participant, country_code: code || participant.country_code, country_name: countryName(code || participant.country_code) } : null,
      greeting: greetingForLocale(locale || acceptLanguage, code || participant?.country_code || null),
      displayName,
      userEmail: data.user.email,
      isAnonymous: data.user.is_anonymous === true,
      isAdmin: isBetaAdmin(data.user.email),
      usage: usage ? { used: usage.used, allowance: usage.allowance, remaining: usage.remaining, registered: usage.registered } : { used: 0, allowance: null, remaining: null, registered: false },
      betaUsage: usage ? { used: usage.used, allowance: usage.allowance, remaining: usage.remaining, registered: usage.registered } : null,
      contact: betaConfig.contact,
    });
  } catch {
    return NextResponse.json({ error: "Beta status could not be loaded." }, { status: 502 });
  }
}
