import type { JsonSchema, StructuredOutputParser } from "@/lib/openai/structured-output";

export type DefineProductBrief = {
  problemStatement: string;
  targetUser: string;
  proposedSolution: string;
  desiredOutcome: string;
  citationKeys: string[];
};

export type DefineUserStory = {
  title: string;
  story: string;
  acceptanceCriteria: string[];
  citationKeys: string[];
};

export type DefineMetric = {
  name: string;
  definition: string;
  direction: "increase" | "decrease" | "maintain";
  citationKeys: string[];
};

export type DefineRisk = {
  title: string;
  description: string;
  mitigation: string;
  citationKeys: string[];
};

export type DefineOutput = {
  executiveSummary: string;
  productBrief: DefineProductBrief;
  inScope: string[];
  outOfScope: string[];
  userStories: DefineUserStory[];
  successMetrics: DefineMetric[];
  risks: DefineRisk[];
  openQuestions: string[];
  limitations: string[];
};

export type DefineContextItem = {
  category: string;
  title: string;
  content: string;
};

export type DefineEvidenceItem = {
  kind: string;
  title: string;
  content: string;
  source_label: string;
  citationKey: string;
};

const MAX_DEFINE_INPUT_LENGTH = 100_000;

export const defineOutputSchema: JsonSchema = {
  type: "object",
  properties: {
    executiveSummary: { type: "string" },
    productBrief: {
      type: "object",
      properties: {
        problemStatement: { type: "string" },
        targetUser: { type: "string" },
        proposedSolution: { type: "string" },
        desiredOutcome: { type: "string" },
        citationKeys: { type: "array", items: { type: "string" } },
      },
      required: ["problemStatement", "targetUser", "proposedSolution", "desiredOutcome", "citationKeys"],
      additionalProperties: false,
    },
    inScope: { type: "array", items: { type: "string" } },
    outOfScope: { type: "array", items: { type: "string" } },
    userStories: { type: "array", items: userStorySchema() },
    successMetrics: { type: "array", items: metricSchema() },
    risks: { type: "array", items: riskSchema() },
    openQuestions: { type: "array", items: { type: "string" } },
    limitations: { type: "array", items: { type: "string" } },
  },
  required: [
    "executiveSummary",
    "productBrief",
    "inScope",
    "outOfScope",
    "userStories",
    "successMetrics",
    "risks",
    "openQuestions",
    "limitations",
  ],
  additionalProperties: false,
};

export function buildDefineInput({
  opportunity,
  contextItems,
  evidenceItems,
}: {
  opportunity: string;
  contextItems: DefineContextItem[];
  evidenceItems: DefineEvidenceItem[];
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
    "<opportunity_to_define>",
    opportunity.trim(),
    "</opportunity_to_define>",
    "",
    "<product_context>",
    context,
    "</product_context>",
    "",
    "<citation_backed_evidence>",
    evidence,
    "</citation_backed_evidence>",
  ].join("\n");

  if (input.length > MAX_DEFINE_INPUT_LENGTH) {
    throw new Error("The selected context and evidence are too large for one definition run. Narrow the source set and try again.");
  }

  return input;
}

function userStorySchema(): JsonSchema {
  return {
    type: "object",
    properties: {
      title: { type: "string" },
      story: { type: "string" },
      acceptanceCriteria: { type: "array", items: { type: "string" } },
      citationKeys: { type: "array", items: { type: "string" } },
    },
    required: ["title", "story", "acceptanceCriteria", "citationKeys"],
    additionalProperties: false,
  };
}

function metricSchema(): JsonSchema {
  return {
    type: "object",
    properties: {
      name: { type: "string" },
      definition: { type: "string" },
      direction: { type: "string", enum: ["increase", "decrease", "maintain"] },
      citationKeys: { type: "array", items: { type: "string" } },
    },
    required: ["name", "definition", "direction", "citationKeys"],
    additionalProperties: false,
  };
}

function riskSchema(): JsonSchema {
  return {
    type: "object",
    properties: {
      title: { type: "string" },
      description: { type: "string" },
      mitigation: { type: "string" },
      citationKeys: { type: "array", items: { type: "string" } },
    },
    required: ["title", "description", "mitigation", "citationKeys"],
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

function citationList(record: Record<string, unknown>, label: string, allowedCitationKeys: ReadonlySet<string>): string[] {
  const citationKeys = stringList(record, "citationKeys", label, 20);
  if (citationKeys.length === 0) {
    throw new Error(`${label}.citationKeys must contain at least one supplied citation key.`);
  }

  for (const citationKey of citationKeys) {
    if (!allowedCitationKeys.has(citationKey)) {
      throw new Error(`${label}.citationKeys contains an unknown citation key.`);
    }
  }

  return citationKeys;
}

function productBrief(value: unknown, allowedCitationKeys: ReadonlySet<string>): DefineProductBrief {
  const record = asRecord(value, "productBrief");
  return {
    problemStatement: requiredString(record, "problemStatement", "productBrief", 2000),
    targetUser: requiredString(record, "targetUser", "productBrief", 1000),
    proposedSolution: requiredString(record, "proposedSolution", "productBrief", 2000),
    desiredOutcome: requiredString(record, "desiredOutcome", "productBrief", 2000),
    citationKeys: citationList(record, "productBrief", allowedCitationKeys),
  };
}

function userStories(value: unknown, allowedCitationKeys: ReadonlySet<string>): DefineUserStory[] {
  if (!Array.isArray(value) || value.length > 12) throw new Error("userStories must be an array with at most 12 items.");
  return value.map((item, index) => {
    const label = `userStories[${index}]`;
    const record = asRecord(item, label);
    return {
      title: requiredString(record, "title", label, 200),
      story: requiredString(record, "story", label, 2000),
      acceptanceCriteria: stringList(record, "acceptanceCriteria", label, 12),
      citationKeys: citationList(record, label, allowedCitationKeys),
    };
  });
}

function metrics(value: unknown, allowedCitationKeys: ReadonlySet<string>): DefineMetric[] {
  if (!Array.isArray(value) || value.length > 12) throw new Error("successMetrics must be an array with at most 12 items.");
  return value.map((item, index) => {
    const label = `successMetrics[${index}]`;
    const record = asRecord(item, label);
    const direction = record.direction;
    if (direction !== "increase" && direction !== "decrease" && direction !== "maintain") {
      throw new Error(`${label}.direction must be increase, decrease, or maintain.`);
    }
    return {
      name: requiredString(record, "name", label, 200),
      definition: requiredString(record, "definition", label, 1000),
      direction,
      citationKeys: citationList(record, label, allowedCitationKeys),
    };
  });
}

function risks(value: unknown, allowedCitationKeys: ReadonlySet<string>): DefineRisk[] {
  if (!Array.isArray(value) || value.length > 12) throw new Error("risks must be an array with at most 12 items.");
  return value.map((item, index) => {
    const label = `risks[${index}]`;
    const record = asRecord(item, label);
    return {
      title: requiredString(record, "title", label, 200),
      description: requiredString(record, "description", label, 1500),
      mitigation: requiredString(record, "mitigation", label, 1500),
      citationKeys: citationList(record, label, allowedCitationKeys),
    };
  });
}

export function createDefineOutputParser(allowedCitationKeys: ReadonlySet<string>): StructuredOutputParser<DefineOutput> {
  return (value) => {
    const record = asRecord(value, "define output");
    return {
      executiveSummary: requiredString(record, "executiveSummary", "define output", 4000),
      productBrief: productBrief(record.productBrief, allowedCitationKeys),
      inScope: stringList(record, "inScope", "define output", 20),
      outOfScope: stringList(record, "outOfScope", "define output", 20),
      userStories: userStories(record.userStories, allowedCitationKeys),
      successMetrics: metrics(record.successMetrics, allowedCitationKeys),
      risks: risks(record.risks, allowedCitationKeys),
      openQuestions: stringList(record, "openQuestions", "define output", 20),
      limitations: stringList(record, "limitations", "define output", 20),
    };
  };
}
