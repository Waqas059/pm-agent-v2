import "server-only";

import { runLangChainStructuredWorkflow } from "@/lib/langchain/structured-workflow";

import {
  buildDefineInput,
  createDefineOutputParser,
  defineOutputSchema,
  type DefineContextItem,
  type DefineEvidenceItem,
  type DefineOutput,
} from "./define-contract";

export async function runDefineWorkflow({
  opportunity,
  contextItems,
  evidenceItems,
}: {
  opportunity: string;
  contextItems: DefineContextItem[];
  evidenceItems: DefineEvidenceItem[];
}): Promise<{ output: DefineOutput; id: string; model: string; status: string }> {
  const allowedCitationKeys = new Set(evidenceItems.map((item) => item.citationKey));

  return runLangChainStructuredWorkflow({
    name: "define_specify",
    description: "Grounded product definition and specification for a product workspace",
    instructions: [
      "You are the Define & Specify workflow for a product workspace.",
      "Treat the opportunity as a user hypothesis, not as evidence.",
      "Use only the product context and citation-backed evidence supplied in the input.",
      "Do not invent sources, quotes, metrics, customer claims, or citation keys.",
      "Every product brief, user story, success metric, and risk must cite one or more supplied citation keys.",
      "Make assumptions, open questions, and evidence limitations explicit.",
      "Keep acceptance criteria testable and avoid claiming that a requirement is validated when the evidence does not support it.",
      "Do not produce implementation details that are not supported by the supplied context or evidence.",
    ].join(" "),
    input: buildDefineInput({ opportunity, contextItems, evidenceItems }),
    schema: defineOutputSchema,
    parse: createDefineOutputParser(allowedCitationKeys),
    maxOutputTokens: 2800,
  });
}
