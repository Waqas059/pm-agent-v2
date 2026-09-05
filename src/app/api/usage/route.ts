import { NextResponse } from "next/server";

import { SERVER_WORKFLOW_RUN_LIMIT } from "@/lib/workflows/runs";
import { createClient } from "@/lib/supabase/server";

function errorResponse(message: string, status: number) {
  return NextResponse.json({ error: message }, { status });
}

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: userData, error: userError } = await supabase.auth.getUser();
    if (userError || !userData.user) return errorResponse("Sign in before reading workspace usage.", 401);

    const { data: workspace, error: workspaceError } = await supabase
      .from("workspaces")
      .select("id")
      .order("created_at", { ascending: true })
      .limit(1)
      .maybeSingle();
    if (workspaceError) throw workspaceError;
    if (!workspace) return errorResponse("Create a product workspace before reading usage.", 422);

    const { count, error: countError } = await supabase
      .from("workflow_runs")
      .select("id", { count: "exact", head: true })
      .eq("workspace_id", workspace.id)
      .in("status", ["running", "completed"]);
    if (countError) throw countError;

    return NextResponse.json({ used: count ?? 0, limit: SERVER_WORKFLOW_RUN_LIMIT });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Workspace usage could not be read.";
    if (message.startsWith("Supabase is not configured")) return errorResponse("Connect Supabase before reading workspace usage.", 503);
    return errorResponse("Workspace usage could not be read.", 502);
  }
}
