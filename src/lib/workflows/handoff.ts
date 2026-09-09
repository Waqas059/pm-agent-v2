export type HandoffSourceWorkflow = "discover_synthesize" | "define_specify";
export type HandoffTargetWorkflow = "define_specify" | "align_communicate";

export function isSupportedHandoff(source: HandoffSourceWorkflow, target: HandoffTargetWorkflow) {
  if (source === "discover_synthesize") return target === "define_specify" || target === "align_communicate";
  return target === "align_communicate";
}

