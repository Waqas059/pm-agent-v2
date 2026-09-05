import { NextResponse } from "next/server";

import { planPmRequest } from "@/lib/pm-tools/catalog";
import { createClient } from "@/lib/supabase/server";

const MAX_REQUEST_LENGTH = 2_000;

export async function POST(request: Request) {
  let body: unknown;
  try { body = await request.json(); } catch { return NextResponse.json({ error: "Provide a valid PM request." }, { status: 400 }); }
  const value = body && typeof body === "object" && !Array.isArray(body) ? (body as Record<string, unknown>).request : undefined;
  if (typeof value !== "string" || !value.trim() || value.trim().length > MAX_REQUEST_LENGTH) return NextResponse.json({ error: "Enter a PM request of 2,000 characters or fewer." }, { status: 400 });

  try {
    const supabase = await createClient();
    const { data: userData, error: userError } = await supabase.auth.getUser();
    if (userError || !userData.user) return NextResponse.json({ error: "Sign in before using the PM entry point." }, { status: 401 });
    const { data: workspace, error } = await supabase.from("workspaces").select("id").order("created_at", { ascending: true }).limit(1).maybeSingle();
    if (error) throw error;
    if (!workspace) return NextResponse.json({ error: "Create a product workspace before planning a PM request." }, { status: 422 });
    return NextResponse.json({ plan: planPmRequest(value) });
  } catch { return NextResponse.json({ error: "The PM request could not be planned." }, { status: 502 }); }
}
