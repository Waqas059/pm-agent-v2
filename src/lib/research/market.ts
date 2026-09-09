import "server-only";

import { getOpenAIClient } from "@/lib/openai/client";
import { getOpenAIConfig } from "@/lib/openai/env";
import { parseStructuredOutput, StructuredOutputError } from "@/lib/openai/structured-output";
import { normalizeTokenUsage, type TokenUsage } from "@/lib/openai/usage";

const MARKET_SCHEMA = {
  type: "object",
  additionalProperties: false,
  properties: {
    summary: { type: "string", maxLength: 4_000 },
    findings: {
      type: "array",
      maxItems: 20,
      items: {
        type: "object",
        additionalProperties: false,
        properties: {
          title: { type: "string", maxLength: 200 },
          claim: { type: "string", maxLength: 2_000 },
          sourceUrls: { type: "array", minItems: 1, maxItems: 10, items: { type: "string", format: "uri" } },
        },
        required: ["title", "claim", "sourceUrls"],
      },
    },
    sources: {
      type: "array",
      maxItems: 30,
      items: {
        type: "object",
        additionalProperties: false,
        properties: {
          url: { type: "string", format: "uri" },
          title: { type: "string", maxLength: 300 },
          excerpt: { type: "string", maxLength: 2_000 },
        },
        required: ["url", "title", "excerpt"],
      },
    },
    limitations: { type: "array", maxItems: 12, items: { type: "string", maxLength: 1_000 } },
  },
  required: ["summary", "findings", "sources", "limitations"],
} as const;

export type MarketResearchFinding = { title: string; claim: string; sourceUrls: string[] };
export type MarketResearchSource = { url: string; title: string; excerpt: string; retrievedAt: string };
export type MarketResearchOutput = {
  summary: string;
  findings: MarketResearchFinding[];
  sources: MarketResearchSource[];
  limitations: string[];
};

export type MarketResearchResult = {
  id: string;
  model: string;
  output: MarketResearchOutput;
  usage: TokenUsage | null;
};

type UrlCitation = { url: string; title: string };

function urlCitations(response: unknown): UrlCitation[] {
  if (!response || typeof response !== "object") return [];
  const output = (response as { output?: unknown }).output;
  if (!Array.isArray(output)) return [];
  const citations: UrlCitation[] = [];
  output.forEach((item) => {
    if (!item || typeof item !== "object") return;
    const content = (item as { content?: unknown }).content;
    if (!Array.isArray(content)) return;
    content.forEach((part) => {
      if (!part || typeof part !== "object") return;
      const annotations = (part as { annotations?: unknown }).annotations;
      if (!Array.isArray(annotations)) return;
      annotations.forEach((annotation) => {
        if (!annotation || typeof annotation !== "object") return;
        const value = annotation as Record<string, unknown>;
        if (value.type === "url_citation" && typeof value.url === "string" && typeof value.title === "string") {
          citations.push({ url: value.url, title: value.title });
        }
      });
    });
  });
  return [...new Map(citations.map((citation) => [citation.url, citation])).values()];
}

export function parseMarketOutput(value: unknown, citations: UrlCitation[]): MarketResearchOutput {
  if (typeof value !== "object" || value === null || Array.isArray(value)) throw new StructuredOutputError("Market research returned an invalid result.");
  const record = value as Record<string, unknown>;
  const summary = record.summary;
  const findings = record.findings;
  const sources = record.sources;
  const limitations = record.limitations;
  if (typeof summary !== "string" || !summary.trim()) throw new StructuredOutputError("Market research returned no summary.");
  if (!Array.isArray(findings) || !Array.isArray(sources) || !Array.isArray(limitations)) throw new StructuredOutputError("Market research returned incomplete sections.");

  const allowedUrls = new Map(citations.map((citation) => [citation.url, citation]));
  const parsedSources = sources.map((source, index) => {
    if (typeof source !== "object" || source === null || Array.isArray(source)) throw new StructuredOutputError(`Market source ${index + 1} is invalid.`);
    const item = source as Record<string, unknown>;
    if (typeof item.url !== "string" || !allowedUrls.has(item.url)) throw new StructuredOutputError(`Market source ${index + 1} was not returned by web retrieval.`);
    if (typeof item.title !== "string" || !item.title.trim() || typeof item.excerpt !== "string" || !item.excerpt.trim()) throw new StructuredOutputError(`Market source ${index + 1} is incomplete.`);
    return { url: item.url, title: item.title.trim(), excerpt: item.excerpt.trim(), retrievedAt: new Date().toISOString() };
  });
  if (parsedSources.length === 0) throw new StructuredOutputError("Market research returned no verified external sources.");

  const parsedFindings = findings.map((finding, index) => {
    if (typeof finding !== "object" || finding === null || Array.isArray(finding)) throw new StructuredOutputError(`Market finding ${index + 1} is invalid.`);
    const item = finding as Record<string, unknown>;
    if (typeof item.title !== "string" || !item.title.trim() || typeof item.claim !== "string" || !item.claim.trim() || !Array.isArray(item.sourceUrls) || item.sourceUrls.length === 0) throw new StructuredOutputError(`Market finding ${index + 1} is incomplete.`);
    const sourceUrls = item.sourceUrls.filter((url): url is string => typeof url === "string");
    if (sourceUrls.some((url) => !allowedUrls.has(url))) throw new StructuredOutputError(`Market finding ${index + 1} cites an unverified URL.`);
    return { title: item.title.trim(), claim: item.claim.trim(), sourceUrls };
  });

  return { summary: summary.trim(), findings: parsedFindings, sources: parsedSources, limitations: limitations.filter((item): item is string => typeof item === "string" && Boolean(item.trim())).map((item) => item.trim()) };
}

export async function runMarketResearch(question: string): Promise<MarketResearchResult> {
  const normalizedQuestion = question.trim();
  if (!normalizedQuestion || normalizedQuestion.length > 2_000) throw new Error("Enter a market research question of 2,000 characters or fewer.");
  const { model } = getOpenAIConfig();
  const response = await getOpenAIClient().responses.create({
    model,
    input: `Research this product or market question using current external web sources: ${normalizedQuestion}`,
    instructions: "Use actual web retrieval, not model memory. Keep external/web evidence separate from workspace evidence. Make only claims supported by retrieved sources. Return source URLs that appear in the web citations. Do not invent statistics, customer evidence, quotes, or sources. Clearly state limitations and uncertainty. This is a reviewable research draft, not a decision or recommendation.",
    tools: [{ type: "web_search", external_web_access: true, search_context_size: "medium" }],
    max_output_tokens: 12_000,
    store: false,
    text: { format: { type: "json_schema", name: "market_research", strict: true, schema: MARKET_SCHEMA } },
  });
  if (response.status !== "completed") throw new Error(`Market research did not complete (status: ${response.status ?? "unknown"}).`);
  const citations = urlCitations(response);
  const output = parseStructuredOutput(response.output_text, (value) => parseMarketOutput(value, citations));
  return { id: response.id, model: response.model, output, usage: normalizeTokenUsage(response.usage) };
}
