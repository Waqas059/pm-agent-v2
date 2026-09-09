import { NextResponse } from "next/server";

import { fetchGitHubRepositoryPreview } from "@/lib/integrations/github";
import { assertIntegrationConsent, GITHUB_PUBLIC_PREVIEW_CONSENT } from "@/lib/integrations";
import { createClient, getAuthenticatedUser } from "@/lib/supabase/server";

function errorResponse(message: string, status: number) {
  return NextResponse.json({ error: message }, { status });
}

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return errorResponse("Provide a valid GitHub repository URL.", 400);
  }

  if (!body || typeof body !== "object" || Array.isArray(body) || typeof (body as Record<string, unknown>).repositoryUrl !== "string") {
    return errorResponse("Provide a valid GitHub repository URL.", 400);
  }

  try {
    assertIntegrationConsent(GITHUB_PUBLIC_PREVIEW_CONSENT);
    const supabase = await createClient();
    const { data: userData, error: userError } = await getAuthenticatedUser(supabase);
    if (userError || !userData.user) return errorResponse("Sign in before reviewing GitHub context.", 401);

    const { data: workspace, error: workspaceError } = await supabase
      .from("workspaces")
      .select("id")
      .order("created_at", { ascending: true })
      .limit(1)
      .maybeSingle();
    if (workspaceError) throw workspaceError;
    if (!workspace) return errorResponse("Create a product workspace before reviewing GitHub context.", 422);

    const result = await fetchGitHubRepositoryPreview((body as { repositoryUrl: string }).repositoryUrl);
    return NextResponse.json({ result, persisted: false, access: "public_read_only" });
  } catch (error) {
    const message = error instanceof Error ? error.message : "GitHub context could not be loaded.";
    if (message.includes("valid") || message.includes("Only public") || message.includes("Use a repository") || message.includes("invalid owner")) return errorResponse(message, 422);
    if (message.includes("not found") || message.includes("not public")) return errorResponse(message, 404);
    return errorResponse("GitHub context could not be loaded. Try again or verify that the repository is public.", 502);
  }
}
