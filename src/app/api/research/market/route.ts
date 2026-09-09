import { NextResponse } from "next/server";

import { runMarketResearch } from "@/lib/research/market";
import { recordProductEvent } from "@/lib/analytics";
import { createClient, getAuthenticatedUser } from "@/lib/supabase/server";

export const runtime = "nodejs";

function errorResponse(message: string, status: number) { return NextResponse.json({ error: message }, { status }); }

export async function POST(request: Request) {
  const startedAt = Date.now();
  let analyticsContext: { supabase: Awaited<ReturnType<typeof createClient>>; workspaceId: string; userId: string } | null = null;
  let body: unknown;
  try { body = await request.json(); } catch { return errorResponse("Provide a valid JSON request.", 400); }
  if (typeof body !== "object" || body === null || Array.isArray(body)) return errorResponse("A market research question is required.", 400);
  const question = (body as Record<string, unknown>).question;
  if (typeof question !== "string" || !question.trim() || question.trim().length > 2_000) return errorResponse("Enter a market research question of 2,000 characters or fewer.", 400);

  try {
    const supabase = await createClient();
    const { data: userData, error: userError } = await getAuthenticatedUser(supabase);
    if (userError || !userData.user) return errorResponse("Sign in before running market research.", 401);
    const { data: workspace, error: workspaceError } = await supabase.from("workspaces").select("id").order("created_at", { ascending: true }).limit(1).maybeSingle();
    if (workspaceError) throw workspaceError;
    if (!workspace) return errorResponse("Create a product workspace before running market research.", 422);
    analyticsContext = { supabase, workspaceId: workspace.id, userId: userData.user.id };
    const result = await runMarketResearch(question);
    void recordProductEvent(supabase, { workspaceId: workspace.id, userId: userData.user.id, eventName: "market_research_completed", surface: "market_research", properties: { sourceCount: result.output.sources.length, findingCount: result.output.findings.length, latencyMs: Date.now() - startedAt } });
    return NextResponse.json({ result, evidenceType: "external_web_evidence", persisted: false });
  } catch (error) {
    if (analyticsContext) void recordProductEvent(analyticsContext.supabase, { workspaceId: analyticsContext.workspaceId, userId: analyticsContext.userId, eventName: "market_research_failed", surface: "market_research", properties: { latencyMs: Date.now() - startedAt } });
    const message = error instanceof Error ? error.message : "Market research could not be completed.";
    if (message.startsWith("OpenAI is not configured")) return errorResponse("Configure the server-side OpenAI settings before running market research.", 503);
    if (message.includes("no verified external sources") || message.includes("unverified URL")) return errorResponse("The external research result could not be verified against retrieved source citations. Try a narrower question.", 502);
    return errorResponse("Market research could not be completed. Try a narrower question or retry.", 502);
  }
}
