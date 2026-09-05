export type PmToolName =
  | "retrieve_context"
  | "retrieve_evidence"
  | "discover_synthesize"
  | "define_specify"
  | "align_communicate"
  | "record_decision"
  | "save_artifact";

export type PmToolDefinition = {
  name: PmToolName;
  label: string;
  description: string;
  mutatesData: boolean;
  requiresHumanApproval: boolean;
};

export const pmToolCatalog: readonly PmToolDefinition[] = [
  { name: "retrieve_context", label: "Retrieve product context", description: "Read workspace-scoped product context before reasoning.", mutatesData: false, requiresHumanApproval: false },
  { name: "retrieve_evidence", label: "Retrieve cited evidence", description: "Read only evidence with traceable source citations.", mutatesData: false, requiresHumanApproval: false },
  { name: "discover_synthesize", label: "Discover and synthesize", description: "Draft grounded themes, pain points, and opportunities for review.", mutatesData: false, requiresHumanApproval: true },
  { name: "define_specify", label: "Define and specify", description: "Draft a reviewable product brief from an approved opportunity.", mutatesData: false, requiresHumanApproval: true },
  { name: "align_communicate", label: "Align and communicate", description: "Draft a stakeholder message from approved workspace context.", mutatesData: false, requiresHumanApproval: true },
  { name: "record_decision", label: "Record a decision", description: "Save a human-authored decision with rationale and risks.", mutatesData: true, requiresHumanApproval: true },
  { name: "save_artifact", label: "Save an artifact", description: "Persist a reviewed brief or communication artifact.", mutatesData: true, requiresHumanApproval: true },
];

const catalogByName = new Map(pmToolCatalog.map((tool) => [tool.name, tool]));

export type PmPlanStep = PmToolDefinition & { reason: string };

export function planPmRequest(request: string): { summary: string; steps: PmPlanStep[]; requiresApproval: boolean } {
  const normalized = request.trim().toLowerCase();
  const names: PmToolName[] = ["retrieve_context", "retrieve_evidence"];
  const add = (name: PmToolName, reason: string) => {
    if (!names.includes(name)) names.push(name);
    const definition = catalogByName.get(name);
    if (!definition) throw new Error(`Unknown PM tool: ${name}`);
    return { ...definition, reason };
  };

  const steps = names.map((name) => ({
    ...catalogByName.get(name)!,
    reason: name === "retrieve_context" ? "Ground the request in the current product workspace." : "Check source-backed evidence before making a claim.",
  }));

  if (/discover|research|problem|signal|customer|evidence|why/.test(normalized)) steps.push(add("discover_synthesize", "Investigate the request and produce reviewable findings."));
  if (/define|spec|prd|brief|build|feature|solution/.test(normalized)) steps.push(add("define_specify", "Turn an approved opportunity into a buildable brief."));
  if (/align|communicate|stakeholder|update|message|launch/.test(normalized)) steps.push(add("align_communicate", "Prepare a reviewable message for the intended audience."));
  if (/decision|decide|trade.?off|recommend/.test(normalized)) steps.push(add("record_decision", "Keep the human decision, rationale, and risks durable."));
  if (/save|artifact|document|brief|message/.test(normalized)) steps.push(add("save_artifact", "Persist only after the PM reviews the generated output."));

  return {
    summary: "A constrained PM plan using workspace data and approved capabilities.",
    steps,
    requiresApproval: steps.some((step) => step.requiresHumanApproval),
  };
}
