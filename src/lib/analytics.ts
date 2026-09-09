import type { Json } from "./supabase/database.types";

export type ProductEventName =
  | "workspace_viewed"
  | "workflow_started"
  | "workflow_completed"
  | "workflow_failed"
  | "artifact_created"
  | "artifact_version_created"
  | "artifact_exported"
  | "evidence_citation_inspected"
  | "decision_created"
  | "assumption_created"
  | "document_uploaded"
  | "document_extraction_completed"
  | "document_extraction_failed"
  | "market_research_completed"
  | "market_research_failed"
  | "onboarding_started"
  | "onboarding_completed";

type SupabaseClient = Awaited<ReturnType<typeof import("./supabase/server").createClient>>;

export async function recordProductEvent(
  supabase: SupabaseClient,
  event: {
    workspaceId: string;
    userId: string;
    eventName: ProductEventName;
    surface: string;
    workflowName?: string | null;
    properties?: Json;
  },
) {
  try {
    await supabase.from("product_events").insert({
      workspace_id: event.workspaceId,
      user_id: event.userId,
      event_name: event.eventName,
      surface: event.surface,
      workflow_name: event.workflowName ?? null,
      properties: event.properties ?? {},
    });
  } catch {
    // Analytics must never make a core PM workflow fail.
  }
}
