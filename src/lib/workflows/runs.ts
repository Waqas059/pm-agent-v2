import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/lib/supabase/database.types";

export type WorkflowName = Database["public"]["Tables"]["workflow_runs"]["Row"]["workflow_name"];
export type WorkflowRunStatus = Database["public"]["Tables"]["workflow_runs"]["Row"]["status"];
export type WorkflowStepKey = Database["public"]["Tables"]["workflow_run_steps"]["Row"]["step_key"];
export type WorkflowStepStatus = Database["public"]["Tables"]["workflow_run_steps"]["Row"]["status"];

export type WorkflowDatabaseClient = SupabaseClient<Database>;

export const workflowNames: readonly WorkflowName[] = [
  "pm_chain",
  "discover_synthesize",
  "define_specify",
  "align_communicate",
];

export const workflowStepKeys: readonly WorkflowStepKey[] = [
  "discover",
  "define",
  "align",
  "artifact_persist",
];

export function isWorkflowName(value: string): value is WorkflowName {
  return workflowNames.includes(value as WorkflowName);
}

export function isWorkflowStepKey(value: string): value is WorkflowStepKey {
  return workflowStepKeys.includes(value as WorkflowStepKey);
}

export async function createWorkflowRun(
  supabase: WorkflowDatabaseClient,
  input: Database["public"]["Tables"]["workflow_runs"]["Insert"],
) {
  const { data, error } = await supabase.from("workflow_runs").insert(input).select().single();
  if (error) throw error;
  return data;
}

export async function updateWorkflowRun(
  supabase: WorkflowDatabaseClient,
  runId: string,
  patch: Database["public"]["Tables"]["workflow_runs"]["Update"],
) {
  const { data, error } = await supabase.from("workflow_runs").update(patch).eq("id", runId).select().single();
  if (error) throw error;
  return data;
}

export async function createWorkflowStep(
  supabase: WorkflowDatabaseClient,
  input: Database["public"]["Tables"]["workflow_run_steps"]["Insert"],
) {
  const { data, error } = await supabase.from("workflow_run_steps").insert(input).select().single();
  if (error) throw error;
  return data;
}

export async function updateWorkflowStep(
  supabase: WorkflowDatabaseClient,
  stepId: string,
  patch: Database["public"]["Tables"]["workflow_run_steps"]["Update"],
) {
  const { data, error } = await supabase.from("workflow_run_steps").update(patch).eq("id", stepId).select().single();
  if (error) throw error;
  return data;
}
