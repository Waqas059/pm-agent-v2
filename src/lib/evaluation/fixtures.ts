export const evaluationCategories = [
  "evidence_synthesis",
  "citation_accuracy",
  "opportunity_identification",
  "prd_quality",
  "acceptance_criteria",
  "prioritization_explanation",
  "decision_rationale",
  "assumption_identification",
  "stakeholder_communication",
  "insufficient_evidence",
] as const;

export type EvaluationCategory = (typeof evaluationCategories)[number];

export type EvaluationCase = {
  id: string;
  category: EvaluationCategory;
  title: string;
  prompt: string;
  evidence: {
    citationKey: string;
    sourceLabel: string;
    content: string;
  }[];
  expectedChecks: string[];
};

const fixtureSource = "Synthetic evaluation fixture";

export const evaluationCases: readonly EvaluationCase[] = [
  {
    id: "eval-evidence-synthesis-01",
    category: "evidence_synthesis",
    title: "Synthesize two source-backed onboarding observations",
    prompt: "What themes and pain points are visible in the supplied onboarding evidence?",
    evidence: [
      { citationKey: "FIX-ONBOARD-01", sourceLabel: fixtureSource, content: "Two participants could not tell which setup step came next." },
      { citationKey: "FIX-ONBOARD-02", sourceLabel: fixtureSource, content: "One participant completed setup only after asking support for help." },
    ],
    expectedChecks: ["structured_summary", "citation_backed_findings", "limitations"],
  },
  {
    id: "eval-citation-accuracy-01",
    category: "citation_accuracy",
    title: "Reject a citation not supplied to the workflow",
    prompt: "Return findings using only the supplied evidence citations.",
    evidence: [{ citationKey: "FIX-CITATION-01", sourceLabel: fixtureSource, content: "The export action was difficult to find." }],
    expectedChecks: ["unknown_citation_rejected", "no_fabricated_source"],
  },
  {
    id: "eval-opportunity-01",
    category: "opportunity_identification",
    title: "Separate a product opportunity from an observation",
    prompt: "Identify a testable opportunity and distinguish it from the observation that motivated it.",
    evidence: [{ citationKey: "FIX-OPPORTUNITY-01", sourceLabel: fixtureSource, content: "People looked for export controls in the overflow menu." }],
    expectedChecks: ["observation_separated_from_recommendation", "citation_backed_opportunity"],
  },
  {
    id: "eval-prd-quality-01",
    category: "prd_quality",
    title: "Draft a reviewable product brief",
    prompt: "Draft a concise product brief from the approved opportunity and supplied evidence.",
    evidence: [{ citationKey: "FIX-PRD-01", sourceLabel: fixtureSource, content: "Users need a predictable way to find and export a reviewed artifact." }],
    expectedChecks: ["problem_and_user", "scope_boundary", "evidence_lineage", "risks"],
  },
  {
    id: "eval-acceptance-criteria-01",
    category: "acceptance_criteria",
    title: "Write observable acceptance criteria",
    prompt: "Turn the approved behavior into testable acceptance criteria without inventing performance targets.",
    evidence: [{ citationKey: "FIX-AC-01", sourceLabel: fixtureSource, content: "A reviewed artifact must be exportable by a workspace member." }],
    expectedChecks: ["observable_criteria", "no_invented_metric", "role_and_permission_awareness"],
  },
  {
    id: "eval-prioritization-01",
    category: "prioritization_explanation",
    title: "Explain a deterministic prioritization result",
    prompt: "Explain the supplied prioritization result and keep the calculation separate from interpretation.",
    evidence: [{ citationKey: "FIX-PRIORITY-01", sourceLabel: fixtureSource, content: "The deterministic score ranked export discoverability above a cosmetic refresh." }],
    expectedChecks: ["uses_supplied_score", "calculation_not_invented", "tradeoff_explained"],
  },
  {
    id: "eval-decision-rationale-01",
    category: "decision_rationale",
    title: "Record alternatives and rationale",
    prompt: "Prepare a decision record that keeps the selected direction, alternatives, evidence, assumptions, and risks distinct.",
    evidence: [{ citationKey: "FIX-DECISION-01", sourceLabel: fixtureSource, content: "The team selected a visible export action for the next iteration." }],
    expectedChecks: ["selected_decision", "alternatives", "rationale", "risks_and_assumptions"],
  },
  {
    id: "eval-assumption-01",
    category: "assumption_identification",
    title: "Identify assumptions that need validation",
    prompt: "List high-impact assumptions implied by the supplied evidence and propose validation questions.",
    evidence: [{ citationKey: "FIX-ASSUMPTION-01", sourceLabel: fixtureSource, content: "The team suspects export discoverability affects reuse, but reuse was not measured." }],
    expectedChecks: ["assumption_labeled", "missing_measurement_acknowledged", "validation_question"],
  },
  {
    id: "eval-communication-01",
    category: "stakeholder_communication",
    title: "Create a grounded executive update",
    prompt: "Write a short executive update that distinguishes evidence, interpretation, and the decision ask.",
    evidence: [{ citationKey: "FIX-COMMS-01", sourceLabel: fixtureSource, content: "The current review found one repeated navigation issue in the supplied sample." }],
    expectedChecks: ["audience_fit", "citation_backed_claims", "explicit_ask", "limitations"],
  },
  {
    id: "eval-insufficient-evidence-01",
    category: "insufficient_evidence",
    title: "Fail honestly when evidence is insufficient",
    prompt: "Assess whether the supplied material supports a broad product conclusion.",
    evidence: [{ citationKey: "FIX-SPARSE-01", sourceLabel: fixtureSource, content: "One internal note mentions setup friction without a user sample or measurement." }],
    expectedChecks: ["limitations_visible", "no_confidence_fabrication", "next_useful_input_requested"],
  },
];

export function validateEvaluationCorpus(cases: readonly EvaluationCase[] = evaluationCases): void {
  if (cases.length < evaluationCategories.length) {
    throw new Error(`Evaluation corpus must contain at least ${evaluationCategories.length} cases.`);
  }

  const ids = new Set<string>();
  const categories = new Set<EvaluationCategory>();
  for (const evaluationCase of cases) {
    if (ids.has(evaluationCase.id)) throw new Error(`Duplicate evaluation case id: ${evaluationCase.id}`);
    if (!evaluationCase.prompt.trim() || evaluationCase.evidence.length === 0) {
      throw new Error(`Evaluation case ${evaluationCase.id} must have a prompt and evidence.`);
    }
    ids.add(evaluationCase.id);
    categories.add(evaluationCase.category);
  }

  for (const category of evaluationCategories) {
    if (!categories.has(category)) throw new Error(`Evaluation corpus is missing category: ${category}`);
  }
}
