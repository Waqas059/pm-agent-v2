import { NextResponse } from "next/server";

import { recordProductEvent } from "@/lib/analytics";
import { getMyBetaParticipant } from "@/lib/beta/server";
import { createClient, getAuthenticatedUser } from "@/lib/supabase/server";

export async function POST(request: Request) {
  let body: unknown;
  try { body = await request.json(); } catch { return NextResponse.json({ error: "Provide valid feedback." }, { status: 400 }); }
  if (!body || typeof body !== "object" || Array.isArray(body)) return NextResponse.json({ error: "Provide valid feedback." }, { status: 400 });
  const values = body as Record<string, unknown>;
  const rating = Number(values.usefulnessRating);
  const wouldUseAgain = values.wouldUseAgain;
  const text = typeof values.feedbackText === "string" ? values.feedbackText.trim() : "";
  const wantsContinuedAccess = values.wantsContinuedAccess === true;
  if (!Number.isInteger(rating) || rating < 1 || rating > 5 || typeof wouldUseAgain !== "boolean" || text.length > 2000) return NextResponse.json({ error: "Choose a 1–5 rating, yes/no, and keep feedback under 2,000 characters." }, { status: 400 });
  try {
    const supabase = await createClient();
    const { data: userData, error: userError } = await getAuthenticatedUser(supabase);
    if (userError || !userData.user) return NextResponse.json({ error: "Sign in before sending beta feedback." }, { status: 401 });
    const participant = await getMyBetaParticipant(supabase);
    if (!participant) return NextResponse.json({ error: "Feedback will be available once your beta participant record is registered." }, { status: 422 });
    const { data: workspace } = await supabase.from("workspaces").select("id").order("created_at", { ascending: true }).limit(1).maybeSingle();
    const { error } = await supabase.from("beta_feedback").insert({ participant_id: participant.id, usefulness_rating: rating, would_use_again: wouldUseAgain, feedback_text: text, wants_continued_access: wantsContinuedAccess });
    if (error) throw error;
    if (workspace) void recordProductEvent(supabase, { workspaceId: workspace.id, userId: userData.user.id, eventName: "beta_feedback_submitted", surface: "beta_feedback" });
    return NextResponse.json({ saved: true }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Beta feedback could not be saved." }, { status: 502 });
  }
}
