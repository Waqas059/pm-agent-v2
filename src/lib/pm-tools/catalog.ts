export type PmToolName =
  | "retrieve_context"
  | "retrieve_evidence"
  | "retrieve_decisions"
  | "retrieve_assumptions"
  | "retrieve_artifact"
  | "market_research"
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
  { name: "retrieve_decisions", label: "Retrieve decision memory", description: "Read prior decisions, rationale, risks, and linked artifacts from the workspace.", mutatesData: false, requiresHumanApproval: false },
  { name: "retrieve_assumptions", label: "Retrieve open assumptions", description: "Read unresolved assumptions and their validation plans before recommending a direction.", mutatesData: false, requiresHumanApproval: false },
  { name: "retrieve_artifact", label: "Retrieve prior artifacts", description: "Read saved briefs and communications that may constrain or inform the request.", mutatesData: false, requiresHumanApproval: false },
  { name: "market_research", label: "Research external sources", description: "Retrieve current external/web evidence with citations for PM review.", mutatesData: false, requiresHumanApproval: true },
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
  const names: PmToolName[] = ["retrieve_context", "retrieve_evidence", "retrieve_decisions", "retrieve_assumptions"];
  const add = (name: PmToolName, reason: string) => {
    if (!names.includes(name)) names.push(name);
    const definition = catalogByName.get(name);
    if (!definition) throw new Error(`Unknown PM tool: ${name}`);
    return { ...definition, reason };
  };

  const steps = names.map((name) => ({
    ...catalogByName.get(name)!,
    reason: name === "retrieve_context"
      ? "Ground the request in the current product workspace."
      : name === "retrieve_evidence"
        ? "Check source-backed evidence before making a claim."
        : name === "retrieve_decisions"
          ? "Avoid losing the rationale behind prior product choices."
          : "Surface unresolved beliefs before treating a recommendation as settled.",
  }));

  if (/discover|research|problem|signal|customer|evidence|why/.test(normalized)) steps.push(add("discover_synthesize", "Investigate the request and produce reviewable findings."));
  if (/market|competitor|landscape|industry|web research/.test(normalized)) steps.push(add("market_research", "Retrieve current external sources and keep them separate from workspace evidence."));
  if (/define|spec|prd|brief|build|feature|solution/.test(normalized)) steps.push(add("define_specify", "Turn an approved opportunity into a buildable brief."));
  if (/align|communicate|stakeholder|update|message|launch/.test(normalized)) steps.push(add("align_communicate", "Prepare a reviewable message for the intended audience."));
  if (/decision|decide|trade.?off|recommend/.test(normalized)) steps.push(add("record_decision", "Keep the human decision, rationale, and risks durable."));
  if (/save|artifact|document|brief|message/.test(normalized)) steps.push(add("save_artifact", "Persist only after the PM reviews the generated output."));
  if (/artifact|document|brief|message|prior work|history/.test(normalized)) steps.push(add("retrieve_artifact", "Check saved product work before drafting a new output."));

  return {
    summary: "A constrained PM plan using workspace data and approved capabilities.",
    steps,
    requiresApproval: steps.some((step) => step.requiresHumanApproval),
  };
}
