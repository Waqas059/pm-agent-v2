import { NextResponse } from "next/server";

import { betaConfig, isBetaAdmin } from "@/lib/beta/config";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient, getAuthenticatedUser } from "@/lib/supabase/server";

async function getAdminContext() {
  const supabase = await createClient();
  const { data, error } = await getAuthenticatedUser(supabase);
  if (error || !data.user || !isBetaAdmin(data.user.email)) return null;
  return { user: data.user, admin: createAdminClient() };
}

export async function GET() {
  try {
    const context = await getAdminContext();
    if (!context) return NextResponse.json({ error: "Not authorized." }, { status: 403 });
    const [{ data: participants, error: participantError }, { data: feedback, error: feedbackError }, { data: requests, error: requestError }, { data: reservations, error: reservationError }] = await Promise.all([
      context.admin.from("beta_participants").select("id,full_name,preferred_name,email,status,request_allowance,country_code,country_name,created_at,updated_at").order("created_at", { ascending: false }),
      context.admin.from("beta_feedback").select("id,participant_id,usefulness_rating,would_use_again,feedback_text,wants_continued_access,status,created_at").order("created_at", { ascending: false }).limit(200),
      context.admin.from("beta_continuation_requests").select("id,participant_id,requested_at,status,allowance_at_request,used_at_request,reviewed_at,admin_note").order("requested_at", { ascending: false }).limit(200),
      context.admin.from("beta_request_reservations").select("participant_id,status,operation,created_at").order("created_at", { ascending: false }).limit(5000),
    ]);
    if (participantError || feedbackError || requestError || reservationError) throw Error("load");
    const usageByParticipant = new Map<string, number>();
    for (const reservation of reservations ?? []) if (reservation.status !== "released") usageByParticipant.set(reservation.participant_id, (usageByParticipant.get(reservation.participant_id) ?? 0) + 1);
    const countryBreakdown = (participants ?? []).reduce<Record<string, number>>((summary, participant) => { const key = participant.country_name || "Unknown"; summary[key] = (summary[key] ?? 0) + 1; return summary; }, {});
    return NextResponse.json({ accessMode: betaConfig.accessMode, participants: (participants ?? []).map((participant) => ({ ...participant, used: usageByParticipant.get(participant.id) ?? 0 })), feedback: feedback ?? [], continuationRequests: requests ?? [], overview: { participants: participants?.length ?? 0, active: participants?.filter((item) => item.status === "active").length ?? 0, feedback: feedback?.filter((item) => item.status === "new").length ?? 0, continuation: requests?.filter((item) => item.status === "new").length ?? 0, countryBreakdown } });
  } catch (error) {
    if (error instanceof Error && error.message.includes("service role")) return NextResponse.json({ error: "Configure the server-only Supabase service role before opening the beta admin portal." }, { status: 503 });
    return NextResponse.json({ error: "Beta admin data could not be loaded." }, { status: 502 });
  }
}

export async function POST(request: Request) {
  let body: unknown;
  try { body = await request.json(); } catch { return NextResponse.json({ error: "Provide a valid admin action." }, { status: 400 }); }
  if (!body || typeof body !== "object" || Array.isArray(body)) return NextResponse.json({ error: "Provide a valid admin action." }, { status: 400 });
  const values = body as Record<string, unknown>;
  const action = values.action;
  try {
    const context = await getAdminContext();
    if (!context) return NextResponse.json({ error: "Not authorized." }, { status: 403 });
    if (action === "create_participant") {
      const fullName = typeof values.fullName === "string" ? values.fullName.trim() : "";
      const email = typeof values.email === "string" ? values.email.trim().toLowerCase() : "";
      if (!fullName || !email.includes("@")) return NextResponse.json({ error: "Full name and email are required." }, { status: 400 });
      const { error } = await context.admin.from("beta_participants").insert({ full_name: fullName, preferred_name: typeof values.preferredName === "string" ? values.preferredName.trim() || null : null, email, request_allowance: Number.isInteger(values.allowance) ? Number(values.allowance) : betaConfig.defaultAllowance, status: "active" });
      if (error) throw error;
    } else if (action === "update_participant") {
      const id = typeof values.id === "string" ? values.id : "";
      const patch: { full_name?: string; preferred_name?: string | null; status?: "invited" | "active" | "paused" | "declined"; request_allowance?: number } = {};
      if (typeof values.fullName === "string" && values.fullName.trim()) patch.full_name = values.fullName.trim();
      if (typeof values.preferredName === "string") patch.preferred_name = values.preferredName.trim() || null;
      if (["invited", "active", "paused", "declined"].includes(String(values.status))) patch.status = values.status as typeof patch.status;
      if (Number.isInteger(values.allowance) && Number(values.allowance) >= 0) patch.request_allowance = Number(values.allowance);
      const { error } = await context.admin.from("beta_participants").update(patch).eq("id", id);
      if (error) throw error;
    } else if (action === "grant_allowance") {
      const id = typeof values.id === "string" ? values.id : "";
      const amount = Number.isInteger(values.amount) && Number(values.amount) > 0 ? Number(values.amount) : 5;
      const { data: participant, error: readError } = await context.admin.from("beta_participants").select("request_allowance").eq("id", id).single();
      if (readError) throw readError;
      const { error } = await context.admin.from("beta_participants").update({ request_allowance: participant.request_allowance + amount }).eq("id", id);
      if (error) throw error;
    } else if (action === "review_continuation") {
      const id = typeof values.id === "string" ? values.id : "";
      const status = values.status === "approved" || values.status === "declined" ? values.status : "new";
      const { error } = await context.admin.from("beta_continuation_requests").update({ status, reviewed_at: new Date().toISOString(), admin_note: typeof values.note === "string" ? values.note.trim() || null : null }).eq("id", id);
      if (error) throw error;
    } else if (action === "review_feedback") {
      const id = typeof values.id === "string" ? values.id : "";
      const status = values.status === "follow_up" || values.status === "reviewed" ? values.status : "new";
      const { error } = await context.admin.from("beta_feedback").update({ status }).eq("id", id);
      if (error) throw error;
    } else {
      return NextResponse.json({ error: "Unsupported admin action." }, { status: 400 });
    }
    return NextResponse.json({ saved: true }, { status: 201 });
  } catch (error) {
    if (error instanceof Error && error.message.includes("service role")) return NextResponse.json({ error: "Configure the server-only Supabase service role before managing beta participants." }, { status: 503 });
    return NextResponse.json({ error: "The beta admin action could not be saved." }, { status: 502 });
  }
}
