import type { JsonSchema, StructuredOutputParser } from "@/lib/openai/structured-output";

export const communicationFormats = ["executive_update", "engineering_brief", "sales_note", "launch_message", "stakeholder_summary"] as const;
export type CommunicationFormat = (typeof communicationFormats)[number];
export const communicationFormatLabels: Record<CommunicationFormat, string> = {
  executive_update: "Executive update",
  engineering_brief: "Engineering brief",
  sales_note: "Sales note",
  launch_message: "Launch message",
  stakeholder_summary: "Stakeholder summary",
};

export type AlignFinding = { title: string; detail: string; citationKeys: string[] };
export type AlignOutput = {
  title: string;
  format: CommunicationFormat;
  audience: string;
  message: string;
  keyPoints: AlignFinding[];
  decisionsOrAsks: string[];
  caveats: AlignFinding[];
  openQuestions: string[];
  limitations: string[];
};
export type AlignContextItem = { category: string; title: string; content: string };
export type AlignEvidenceItem = { kind: string; title: string; content: string; source_label: string; citationKey: string };

const MAX_ALIGN_INPUT_LENGTH = 100_000;

export const alignOutputSchema: JsonSchema = {
  type: "object",
  properties: {
    title: { type: "string" },
    format: { type: "string", enum: [...communicationFormats] },
    audience: { type: "string" },
    message: { type: "string" },
    keyPoints: { type: "array", items: findingSchema() },
    decisionsOrAsks: { type: "array", items: { type: "string" } },
    caveats: { type: "array", items: findingSchema() },
    openQuestions: { type: "array", items: { type: "string" } },
    limitations: { type: "array", items: { type: "string" } },
  },
  required: ["title", "format", "audience", "message", "keyPoints", "decisionsOrAsks", "caveats", "openQuestions", "limitations"],
  additionalProperties: false,
};

export function buildAlignInput({ format, request, contextItems, evidenceItems }: { format: CommunicationFormat; request: string; contextItems: AlignContextItem[]; evidenceItems: AlignEvidenceItem[] }): string {
  const context = contextItems.length ? contextItems.map((item) => `- [${item.category}] ${item.title}: ${item.content}`).join("\n") : "No product context has been recorded.";
  const evidence = evidenceItems.length ? evidenceItems.map((item) => `[${item.citationKey}] (${item.kind}) ${item.title} — ${item.content} (source: ${item.source_label})`).join("\n") : "No citation-backed evidence has been recorded.";
  const input = ["<communication_format>", communicationFormatLabels[format], "</communication_format>", "", "<communication_request>", request.trim(), "</communication_request>", "", "<product_context>", context, "</product_context>", "", "<citation_backed_evidence>", evidence, "</citation_backed_evidence>"].join("\n");
  if (input.length > MAX_ALIGN_INPUT_LENGTH) throw new Error("The selected context and evidence are too large for one communication run. Narrow the source set and try again.");
  return input;
}

function findingSchema(): JsonSchema {
  return { type: "object", properties: { title: { type: "string" }, detail: { type: "string" }, citationKeys: { type: "array", items: { type: "string" } } }, required: ["title", "detail", "citationKeys"], additionalProperties: false };
}
function asRecord(value: unknown, label: string): Record<string, unknown> {
  if (typeof value !== "object" || value === null || Array.isArray(value)) throw new Error(`${label} must be an object.`);
  return value as Record<string, unknown>;
}
function requiredString(record: Record<string, unknown>, key: string, label: string, maxLength: number): string {
  const value = record[key];
  if (typeof value !== "string" || !value.trim() || value.length > maxLength) throw new Error(`${label}.${key} must be a non-empty string of ${maxLength} characters or fewer.`);
  return value.trim();
}
function stringList(record: Record<string, unknown>, key: string, label: string, maxItems: number): string[] {
  const value = record[key];
  if (!Array.isArray(value) || value.length > maxItems) throw new Error(`${label}.${key} must be an array with at most ${maxItems} items.`);
  return value.map((item, index) => {
    if (typeof item !== "string" || !item.trim() || item.length > 1000) throw new Error(`${label}.${key}[${index}] must be a non-empty string of 1,000 characters or fewer.`);
    return item.trim();
  });
}
function citationList(record: Record<string, unknown>, label: string, allowedCitationKeys: ReadonlySet<string>): string[] {
  const citationKeys = stringList(record, "citationKeys", label, 20);
  if (citationKeys.length === 0) throw new Error(`${label}.citationKeys must contain at least one supplied citation key.`);
  for (const citationKey of citationKeys) if (!allowedCitationKeys.has(citationKey)) throw new Error(`${label}.citationKeys contains an unknown citation key.`);
  return citationKeys;
}
function findings(value: unknown, key: "keyPoints" | "caveats", allowedCitationKeys: ReadonlySet<string>): AlignFinding[] {
  if (!Array.isArray(value) || value.length > 20) throw new Error(`${key} must be an array with at most 20 items.`);
  return value.map((item, index) => {
    const label = `${key}[${index}]`;
    const record = asRecord(item, label);
    return { title: requiredString(record, "title", label, 200), detail: requiredString(record, "detail", label, 2000), citationKeys: citationList(record, label, allowedCitationKeys) };
  });
}
export function createAlignOutputParser(allowedCitationKeys: ReadonlySet<string>): StructuredOutputParser<AlignOutput> {
  return (value) => {
    const record = asRecord(value, "align output");
    const format = record.format;
    if (!communicationFormats.includes(format as CommunicationFormat)) throw new Error("align output.format is not supported.");
    return {
      title: requiredString(record, "title", "align output", 300),
      format: format as CommunicationFormat,
      audience: requiredString(record, "audience", "align output", 500),
      message: requiredString(record, "message", "align output", 6000),
      keyPoints: findings(record.keyPoints, "keyPoints", allowedCitationKeys),
      decisionsOrAsks: stringList(record, "decisionsOrAsks", "align output", 20),
      caveats: findings(record.caveats, "caveats", allowedCitationKeys),
      openQuestions: stringList(record, "openQuestions", "align output", 20),
      limitations: stringList(record, "limitations", "align output", 20),
    };
  };
}
