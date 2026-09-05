import "server-only";

import { runLangChainStructuredWorkflow } from "@/lib/langchain/structured-workflow";
import type { TokenUsage } from "@/lib/openai/usage";

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
}): Promise<{ output: DiscoverOutput; id: string; model: string; status: string; usage?: TokenUsage | null }> {
  const allowedCitationKeys = new Set(evidenceItems.map((item) => item.citationKey));

  return runLangChainStructuredWorkflow({
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
