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

export const SERVER_WORKFLOW_RUN_LIMIT = 10;

export class WorkflowUsageLimitError extends Error {
  constructor() {
    super(`The beta workspace limit of ${SERVER_WORKFLOW_RUN_LIMIT} active or successful AI runs has been reached.`);
    this.name = "WorkflowUsageLimitError";
  }
}

export function hasReachedWorkflowRunLimit(runCount: number | null | undefined) {
  return typeof runCount === "number" && runCount >= SERVER_WORKFLOW_RUN_LIMIT;
}

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

export async function startWorkflowRun(
  supabase: WorkflowDatabaseClient,
  input: {
    workspaceId: string;
    workflowName: WorkflowName;
    stepKey: WorkflowStepKey;
    runInput: Database["public"]["Tables"]["workflow_runs"]["Insert"]["input"];
    userId: string;
  },
) {
  const { count, error: countError } = await supabase
    .from("workflow_runs")
    .select("id", { count: "exact", head: true })
    .eq("workspace_id", input.workspaceId)
    .in("status", ["running", "completed"]);
  if (countError) throw countError;
  if (hasReachedWorkflowRunLimit(count)) throw new WorkflowUsageLimitError();

  const run = await createWorkflowRun(supabase, {
    workspace_id: input.workspaceId,
    workflow_name: input.workflowName,
    status: "running",
    input: input.runInput,
    created_by: input.userId,
  });
  const step = await createWorkflowStep(supabase, {
    workflow_run_id: run.id,
    workspace_id: input.workspaceId,
    step_key: input.stepKey,
    step_order: 1,
    status: "running",
    input: input.runInput,
    created_by: input.userId,
  });
  return { run, step };
}
