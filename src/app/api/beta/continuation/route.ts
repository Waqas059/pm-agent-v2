import { NextResponse } from "next/server";

import { recordProductEvent } from "@/lib/analytics";
import { getBetaUsage, getMyBetaParticipant } from "@/lib/beta/server";
import { createClient, getAuthenticatedUser } from "@/lib/supabase/server";

export async function POST() {
  try {
    const supabase = await createClient();
    const { data: userData, error: userError } = await getAuthenticatedUser(supabase);
    if (userError || !userData.user) return NextResponse.json({ error: "Sign in before requesting more beta access." }, { status: 401 });
    const participant = await getMyBetaParticipant(supabase);
    const usage = await getBetaUsage(supabase);
    if (!participant || !usage?.registered) return NextResponse.json({ error: "A beta participant record is required." }, { status: 422 });
    const { data, error } = await supabase.from("beta_continuation_requests").insert({ participant_id: participant.id, allowance_at_request: usage.allowance ?? 0, used_at_request: usage.used }).select("id,status").single();
    if (error) throw error;
    const { data: workspace } = await supabase.from("workspaces").select("id").order("created_at", { ascending: true }).limit(1).maybeSingle();
    if (workspace) void recordProductEvent(supabase, { workspaceId: workspace.id, userId: userData.user.id, eventName: "beta_access_requested", surface: "beta_limit" });
    return NextResponse.json({ request: data }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "The continuation request could not be saved." }, { status: 502 });
  }
}
