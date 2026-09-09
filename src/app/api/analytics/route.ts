import { NextResponse } from "next/server";

import { type ProductEventName, recordProductEvent } from "@/lib/analytics";
import { summarizeOutcomeBaseline } from "@/lib/analytics/outcomes";
import { createClient, getAuthenticatedUser } from "@/lib/supabase/server";

const clientEventNames = new Set<ProductEventName>(["workspace_viewed", "onboarding_started", "onboarding_completed", "evidence_citation_inspected", "decision_created", "assumption_created"]);

function errorResponse(message: string, status: number) {
  return NextResponse.json({ error: message }, { status });
}

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: userData, error: userError } = await getAuthenticatedUser(supabase);
    if (userError || !userData.user) return errorResponse("Sign in before reading product analytics.", 401);

    const { data: workspace, error: workspaceError } = await supabase
      .from("workspaces")
      .select("id")
      .order("created_at", { ascending: true })
      .limit(1)
      .maybeSingle();
    if (workspaceError) throw workspaceError;
    if (!workspace) return errorResponse("Create a product workspace before reading product analytics.", 422);

    const { data: events, error } = await supabase
      .from("product_events")
      .select("event_name, surface, workflow_name, created_at")
      .eq("workspace_id", workspace.id)
      .order("created_at", { ascending: false })
      .limit(500);
    if (error) throw error;

    const counts = (events ?? []).reduce<Record<string, number>>((summary, event) => {
      summary[event.event_name] = (summary[event.event_name] ?? 0) + 1;
      return summary;
    }, {});
    const starts = counts.workflow_started ?? 0;
    const completed = counts.workflow_completed ?? 0;

    return NextResponse.json({
      counts,
      workflowConversion: {
        started: starts,
        completed,
        failed: counts.workflow_failed ?? 0,
        completionRate: starts > 0 ? Math.round((completed / starts) * 100) : null,
      },
      outcomeBaseline: summarizeOutcomeBaseline(events ?? []),
      recentEvents: (events ?? []).slice(0, 20),
    });
  } catch {
    return errorResponse("Product analytics could not be loaded.", 502);
  }
}

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return errorResponse("Provide a valid analytics event.", 400);
  }

  if (typeof body !== "object" || body === null || Array.isArray(body)) return errorResponse("Provide a valid analytics event.", 400);
  const values = body as Record<string, unknown>;
  const eventName = values.eventName;
  const surface = values.surface;
  if (typeof eventName !== "string" || !clientEventNames.has(eventName as ProductEventName)) return errorResponse("Choose a supported client analytics event.", 400);
  if (typeof surface !== "string" || !surface.trim() || surface.trim().length > 80) return errorResponse("Provide a valid analytics surface.", 400);

  try {
    const supabase = await createClient();
    const { data: userData, error: userError } = await getAuthenticatedUser(supabase);
    if (userError || !userData.user) return errorResponse("Sign in before recording product analytics.", 401);
    const { data: workspace, error: workspaceError } = await supabase.from("workspaces").select("id").order("created_at", { ascending: true }).limit(1).maybeSingle();
    if (workspaceError) throw workspaceError;
    if (!workspace) return errorResponse("Create a product workspace before recording product analytics.", 422);
    await recordProductEvent(supabase, { workspaceId: workspace.id, userId: userData.user.id, eventName: eventName as ProductEventName, surface: surface.trim() });
    return NextResponse.json({ recorded: true }, { status: 202 });
  } catch {
    return errorResponse("Product analytics could not be recorded.", 502);
  }
}
