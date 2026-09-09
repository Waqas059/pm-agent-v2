import { NextResponse } from "next/server";

import { betaConfig, isBetaAdmin } from "@/lib/beta/config";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient, getAuthenticatedUser } from "@/lib/supabase/server";

const activityEvents = new Set(["workflow_started", "workflow_completed", "artifact_created", "decision_created", "assumption_created", "evidence_citation_inspected", "market_research_completed"]);
const workflowNames = ["discover_synthesize", "define_specify", "align_communicate"] as const;

async function getAdminContext() {
  const supabase = await createClient();
  const { data, error } = await getAuthenticatedUser(supabase);
  if (error || !data.user || !isBetaAdmin(data.user.email)) return null;
  return { user: data.user, admin: createAdminClient() };
}

function participantMetrics(participantId: string, userId: string | null, events: Array<{ user_id: string; event_name: string; workflow_name: string | null; created_at: string }>) {
  const relevant = userId ? events.filter((event) => event.user_id === userId) : [];
  const productActivity = relevant.filter((event) => activityEvents.has(event.event_name));
  const lastActive = productActivity.map((event) => event.created_at).sort().at(-1) ?? null;
  const workflows = Object.fromEntries(workflowNames.map((workflow) => [workflow, { started: relevant.filter((event) => event.workflow_name === workflow && event.event_name === "workflow_started").length, completed: relevant.filter((event) => event.workflow_name === workflow && event.event_name === "workflow_completed").length }])) as Record<(typeof workflowNames)[number], { started: number; completed: number }>;
  return {
    lastActive,
    active: Boolean(lastActive && Date.parse(lastActive) >= Date.now() - 7 * 24 * 60 * 60 * 1000),
    workflowProgress: workflows,
    usefulOutput: relevant.some((event) => event.event_name === "workflow_completed" || event.event_name === "artifact_created" || event.event_name === "decision_created"),
    contactClicked: relevant.some((event) => event.event_name === "beta_contact_clicked"),
    participantId,
  };
}

export async function GET() {
  try {
    const context = await getAdminContext();
    if (!context) return NextResponse.json({ error: "Not authorized." }, { status: 403 });
    const [{ data: participants, error: participantError }, { data: feedback, error: feedbackError }, { data: requests, error: requestError }, { data: reservations, error: reservationError }, { data: events, error: eventError }] = await Promise.all([
      context.admin.from("beta_participants").select("id,full_name,preferred_name,email,status,request_allowance,country_code,country_name,auth_user_id,created_at,updated_at").order("created_at", { ascending: false }),
      context.admin.from("beta_feedback").select("id,participant_id,usefulness_rating,would_use_again,feedback_text,wants_continued_access,status,created_at").order("created_at", { ascending: false }).limit(200),
      context.admin.from("beta_continuation_requests").select("id,participant_id,requested_at,status,allowance_at_request,used_at_request,reviewed_at,admin_note").order("requested_at", { ascending: false }).limit(200),
      context.admin.from("beta_request_reservations").select("participant_id,status,operation,created_at").order("created_at", { ascending: false }).limit(5000),
      context.admin.from("product_events").select("user_id,event_name,workflow_name,created_at").order("created_at", { ascending: false }).limit(10000),
    ]);
    if (participantError || feedbackError || requestError || reservationError || eventError) throw Error("load");
    const usageByParticipant = new Map<string, number>();
    const limitReachedAt = new Map<string, string>();
    for (const reservation of reservations ?? []) {
      if (reservation.status === "released") continue;
      usageByParticipant.set(reservation.participant_id, (usageByParticipant.get(reservation.participant_id) ?? 0) + 1);
      if (!limitReachedAt.has(reservation.participant_id)) limitReachedAt.set(reservation.participant_id, reservation.created_at);
    }
    const metrics = new Map((participants ?? []).map((participant) => [participant.id, participantMetrics(participant.id, participant.auth_user_id, events ?? [])]));
    const feedbackByParticipant = new Set((feedback ?? []).map((item) => item.participant_id));
    const continuationByParticipant = new Set((requests ?? []).map((item) => item.participant_id));
    const countryBreakdown = (participants ?? []).reduce<Record<string, number>>((summary, participant) => { const key = participant.country_name || "Unknown"; summary[key] = (summary[key] ?? 0) + 1; return summary; }, {});
    const enrichedParticipants = (participants ?? []).map((participant) => {
      const used = usageByParticipant.get(participant.id) ?? 0;
      const detail = metrics.get(participant.id) ?? participantMetrics(participant.id, participant.auth_user_id, []);
      return { ...participant, used, remaining: Math.max(participant.request_allowance - used, 0), limitReachedAt: used >= participant.request_allowance && used > 0 ? limitReachedAt.get(participant.id) ?? null : null, feedbackSubmitted: feedbackByParticipant.has(participant.id), continuationRequested: continuationByParticipant.has(participant.id), ...detail };
    });
    const needsAttention = enrichedParticipants.filter((participant) => participant.used >= participant.request_allowance && participant.used > 0).map((participant) => ({ type: "limit", participantId: participant.id, label: `${participant.preferred_name || participant.full_name} reached ${participant.used} / ${participant.request_allowance}`, detail: "Review or grant more access." }));
    for (const request of requests ?? []) if (request.status === "new") needsAttention.push({ type: "continuation", participantId: request.participant_id, label: "Continuation request", detail: "Review the participant's request for more access." });
    for (const item of feedback ?? []) if (item.status === "new") needsAttention.push({ type: "feedback", participantId: item.participant_id, label: "New beta feedback", detail: "Review the participant's latest product signal." });
    return NextResponse.json({ accessMode: betaConfig.accessMode, participants: enrichedParticipants, feedback: feedback ?? [], continuationRequests: requests ?? [], needsAttention: needsAttention.slice(0, 12), overview: { participants: participants?.length ?? 0, active: enrichedParticipants.filter((item) => item.active).length, aiRequestsUsed: enrichedParticipants.reduce((sum, item) => sum + item.used, 0), feedback: feedback?.filter((item) => item.status === "new").length ?? 0, continuation: requests?.filter((item) => item.status === "new").length ?? 0, countryBreakdown } });
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
      const { error } = await context.admin.from("beta_participants").insert({ full_name: fullName, preferred_name: typeof values.preferredName === "string" ? values.preferredName.trim() || null : null, email, request_allowance: Number.isInteger(values.allowance) && Number(values.allowance) >= 0 ? Number(values.allowance) : betaConfig.defaultAllowance, status: "active" });
      if (error) return NextResponse.json({ error: error.code === "23505" ? "A participant with this normalized email already exists." : "The participant could not be added." }, { status: error.code === "23505" ? 409 : 502 });
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
      const { error: requestError } = await context.admin.from("beta_continuation_requests").select("id").eq("id", id).single();
      if (requestError) throw requestError;
      if (status === "approved") {
        const customAllowance = Number.isInteger(values.customAllowance) && Number(values.customAllowance) >= 0 ? Number(values.customAllowance) : null;
        const grantAmount = Number.isInteger(values.grantAmount) && Number(values.grantAmount) > 0 ? Number(values.grantAmount) : 5;
        const { error } = await context.admin.rpc("admin_grant_beta_continuation", { request_id: id, custom_allowance: customAllowance, grant_amount: grantAmount });
        if (error) throw error;
        if (typeof values.note === "string" && values.note.trim()) {
          const { error: noteError } = await context.admin.from("beta_continuation_requests").update({ admin_note: values.note.trim() }).eq("id", id);
          if (noteError) throw noteError;
        }
      } else {
        const { error } = await context.admin.from("beta_continuation_requests").update({ status, reviewed_at: new Date().toISOString(), admin_note: typeof values.note === "string" ? values.note.trim() || null : null }).eq("id", id);
        if (error) throw error;
      }
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
