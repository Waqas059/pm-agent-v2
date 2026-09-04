import { NextRequest, NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get("code");
  const redirectUrl = new URL("/", request.url);

  if (!code) {
    redirectUrl.searchParams.set("auth_error", "confirmation");
    return NextResponse.redirect(redirectUrl);
  }

  try {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) return NextResponse.redirect(redirectUrl);
  } catch {
    // Fall through to the user-facing error state without exposing provider details.
  }

  redirectUrl.searchParams.set("auth_error", "confirmation");
  return NextResponse.redirect(redirectUrl);
}
