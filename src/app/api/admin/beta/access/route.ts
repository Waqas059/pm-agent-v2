import { NextResponse } from "next/server";

import { isBetaAdmin } from "@/lib/beta/config";
import { createClient, getAuthenticatedUser } from "@/lib/supabase/server";

export async function GET() {
  try {
    const supabase = await createClient();
    const { data, error } = await getAuthenticatedUser(supabase);
    return NextResponse.json({ isAdmin: !error && Boolean(data.user && isBetaAdmin(data.user.email)) });
  } catch { return NextResponse.json({ isAdmin: false }); }
}
