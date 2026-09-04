import "server-only";

import { runStructuredWorkflow } from "@/lib/openai/workflows";
import { alignOutputSchema, buildAlignInput, createAlignOutputParser, type AlignContextItem, type AlignEvidenceItem, type AlignOutput, type CommunicationFormat } from "./align-contract";

export async function runAlignWorkflow({ format, request, contextItems, evidenceItems }: { format: CommunicationFormat; request: string; contextItems: AlignContextItem[]; evidenceItems: AlignEvidenceItem[] }): Promise<{ output: AlignOutput; id: string; model: string; status: string }> {
  const allowedCitationKeys = new Set(evidenceItems.map((item) => item.citationKey));
  return runStructuredWorkflow({
    name: "align_communicate",
    description: "Grounded stakeholder communication for a product workspace",
    instructions: [
      "You are the Align & Communicate workflow for a product workspace.",
      "Create the requested communication format for the stated audience and request.",
      "Use only the product context and citation-backed evidence supplied in the input.",
      "Do not invent sources, quotes, metrics, customer claims, decisions, or citation keys.",
      "Every key point and caveat must cite one or more supplied citation keys.",
      "Keep the message useful and concise, and distinguish evidence from interpretation, recommendation, and uncertainty.",
      "If evidence is insufficient, say so in limitations and open questions rather than filling gaps with confident claims.",
      "Do not claim that a plan is approved or a result is validated unless the supplied context supports it.",
    ].join(" "),
    input: buildAlignInput({ format, request, contextItems, evidenceItems }),
    schema: alignOutputSchema,
    parse: createAlignOutputParser(allowedCitationKeys),
    maxOutputTokens: 2200,
  });
}
