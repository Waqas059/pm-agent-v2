import "server-only";

import { runStructuredWorkflow } from "@/lib/openai/workflows";

import {
  buildDiscoverInput,
  createDiscoverOutputParser,
  discoverOutputSchema,
  type DiscoveryContextItem,
  type DiscoveryEvidenceItem,
  type DiscoverOutput,
} from "./discover-contract";

export async function runDiscoverWorkflow({
  question,
  contextItems,
  evidenceItems,
}: {
  question: string;
  contextItems: DiscoveryContextItem[];
  evidenceItems: DiscoveryEvidenceItem[];
}): Promise<{ output: DiscoverOutput; id: string; model: string; status: string }> {
  const allowedCitationKeys = new Set(evidenceItems.map((item) => item.citationKey));

  return runStructuredWorkflow({
    name: "discover_synthesis",
    description: "Grounded discovery synthesis for a product workspace",
    instructions: [
      "You are the Discover & Synthesize workflow for a product workspace.",
      "Use only the product context and citation-backed evidence supplied in the input.",
      "Do not invent sources, quotes, metrics, customer claims, or citation keys.",
      "Every theme, pain point, and opportunity must cite one or more supplied citation keys.",
      "If evidence is sparse, conflicting, or insufficient, say so in limitations or open questions.",
      "Separate observed evidence from interpretation and recommendations.",
    ].join(" "),
    input: buildDiscoverInput({ question, contextItems, evidenceItems }),
    schema: discoverOutputSchema,
    parse: createDiscoverOutputParser(allowedCitationKeys),
    maxOutputTokens: 2200,
  });
}
