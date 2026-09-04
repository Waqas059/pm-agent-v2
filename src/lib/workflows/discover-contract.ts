import type { JsonSchema, StructuredOutputParser } from "@/lib/openai/structured-output";

export type DiscoverFinding = {
  title: string;
  summary: string;
  citationKeys: string[];
};

export type DiscoverOutput = {
  executiveSummary: string;
  themes: DiscoverFinding[];
  painPoints: DiscoverFinding[];
  opportunities: DiscoverFinding[];
  openQuestions: string[];
  limitations: string[];
};

export type DiscoveryContextItem = {
  category: string;
  title: string;
  content: string;
};

export type DiscoveryEvidenceItem = {
  kind: string;
  title: string;
  content: string;
  source_label: string;
  citationKey: string;
};

const MAX_DISCOVERY_INPUT_LENGTH = 100_000;

export const discoverOutputSchema: JsonSchema = {
  type: "object",
  properties: {
    executiveSummary: { type: "string" },
    themes: { type: "array", items: findingSchema() },
    painPoints: { type: "array", items: findingSchema() },
    opportunities: { type: "array", items: findingSchema() },
    openQuestions: { type: "array", items: { type: "string" } },
    limitations: { type: "array", items: { type: "string" } },
  },
  required: ["executiveSummary", "themes", "painPoints", "opportunities", "openQuestions", "limitations"],
  additionalProperties: false,
};

export function buildDiscoverInput({
  question,
  contextItems,
  evidenceItems,
}: {
  question: string;
  contextItems: DiscoveryContextItem[];
  evidenceItems: DiscoveryEvidenceItem[];
}): string {
  const context = contextItems.length
    ? contextItems.map((item) => `- [${item.category}] ${item.title}: ${item.content}`).join("\n")
    : "No product context has been recorded.";
  const evidence = evidenceItems.length
    ? evidenceItems
        .map((item) => `[${item.citationKey}] (${item.kind}) ${item.title} — ${item.content} (source: ${item.source_label})`)
        .join("\n")
    : "No citation-backed evidence has been recorded.";

  const input = [
    "<discovery_request>",
    question.trim(),
    "</discovery_request>",
    "",
    "<product_context>",
    context,
    "</product_context>",
    "",
    "<citation_backed_evidence>",
    evidence,
    "</citation_backed_evidence>",
  ].join("\n");

  if (input.length > MAX_DISCOVERY_INPUT_LENGTH) {
    throw new Error("The selected context and evidence are too large for one discovery run. Narrow the source set and try again.");
  }

  return input;
}

function findingSchema(): JsonSchema {
  return {
    type: "object",
    properties: {
      title: { type: "string" },
      summary: { type: "string" },
      citationKeys: { type: "array", items: { type: "string" } },
    },
    required: ["title", "summary", "citationKeys"],
    additionalProperties: false,
  };
}

function asRecord(value: unknown, label: string): Record<string, unknown> {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    throw new Error(`${label} must be an object.`);
  }

  return value as Record<string, unknown>;
}

function requiredString(record: Record<string, unknown>, key: string, label: string, maxLength: number): string {
  const value = record[key];
  if (typeof value !== "string" || !value.trim() || value.length > maxLength) {
    throw new Error(`${label}.${key} must be a non-empty string of ${maxLength} characters or fewer.`);
  }

  return value.trim();
}

function stringList(record: Record<string, unknown>, key: string, label: string, maxItems: number): string[] {
  const value = record[key];
  if (!Array.isArray(value) || value.length > maxItems) {
    throw new Error(`${label}.${key} must be an array with at most ${maxItems} items.`);
  }

  return value.map((item, index) => {
    if (typeof item !== "string" || !item.trim() || item.length > 1000) {
      throw new Error(`${label}.${key}[${index}] must be a non-empty string of 1,000 characters or fewer.`);
    }

    return item.trim();
  });
}

function findingList(
  value: unknown,
  key: keyof Pick<DiscoverOutput, "themes" | "painPoints" | "opportunities">,
  allowedCitationKeys: ReadonlySet<string>,
): DiscoverFinding[] {
  if (!Array.isArray(value) || value.length > 20) {
    throw new Error(`${key} must be an array with at most 20 items.`);
  }

  return value.map((item, index) => {
    const label = `${key}[${index}]`;
    const record = asRecord(item, label);
    const citationKeys = stringList(record, "citationKeys", label, 20);

    for (const citationKey of citationKeys) {
      if (!allowedCitationKeys.has(citationKey)) {
        throw new Error(`${label}.citationKeys contains an unknown citation key.`);
      }
    }

    return {
      title: requiredString(record, "title", label, 200),
      summary: requiredString(record, "summary", label, 2000),
      citationKeys,
    };
  });
}

export function createDiscoverOutputParser(
  allowedCitationKeys: ReadonlySet<string>,
): StructuredOutputParser<DiscoverOutput> {
  return (value) => {
    const record = asRecord(value, "discover output");

    return {
      executiveSummary: requiredString(record, "executiveSummary", "discover output", 4000),
      themes: findingList(record.themes, "themes", allowedCitationKeys),
      painPoints: findingList(record.painPoints, "painPoints", allowedCitationKeys),
      opportunities: findingList(record.opportunities, "opportunities", allowedCitationKeys),
      openQuestions: stringList(record, "openQuestions", "discover output", 20),
      limitations: stringList(record, "limitations", "discover output", 20),
    };
  };
}
