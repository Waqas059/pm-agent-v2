import { NextResponse } from "next/server";

import { recordProductEvent, type ProductEventName } from "@/lib/analytics";
import { createClient, getAuthenticatedUser } from "@/lib/supabase/server";

const allowed = new Set<ProductEventName>(["beta_contact_clicked"]);

export async function POST(request: Request) {
  let body: unknown;
  try { body = await request.json(); } catch { return NextResponse.json({ error: "Provide a valid event." }, { status: 400 }); }
  const eventName = body && typeof body === "object" && !Array.isArray(body) ? (body as Record<string, unknown>).eventName : null;
  if (typeof eventName !== "string" || !allowed.has(eventName as ProductEventName)) return NextResponse.json({ error: "Unsupported beta event." }, { status: 400 });
  try {
    const supabase = await createClient();
    const { data, error } = await getAuthenticatedUser(supabase);
    if (error || !data.user) return NextResponse.json({ error: "Sign in before recording a beta event." }, { status: 401 });
    const { data: workspace } = await supabase.from("workspaces").select("id").order("created_at", { ascending: true }).limit(1).maybeSingle();
    if (workspace) await recordProductEvent(supabase, { workspaceId: workspace.id, userId: data.user.id, eventName: eventName as ProductEventName, surface: "beta_contact" });
    return NextResponse.json({ recorded: true }, { status: 202 });
  } catch { return NextResponse.json({ error: "Beta event could not be recorded." }, { status: 502 }); }
}
