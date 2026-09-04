import type { Json } from "@/lib/supabase/database.types";

export type ArtifactKind = "product_brief" | "communication_message";

function asRecord(value: Json): Record<string, Json | undefined> {
  return typeof value === "object" && value !== null && !Array.isArray(value) ? value as Record<string, Json | undefined> : {};
}
function stringValue(value: Json | undefined): string { return typeof value === "string" ? value : ""; }
function listValue(value: Json | undefined): Json[] { return Array.isArray(value) ? value : []; }
function bulletList(value: Json | undefined): string { return listValue(value).map((item) => `- ${stringValue(item)}`).join("\n"); }
function findingList(value: Json | undefined): string { return listValue(value).map((item) => { const finding = asRecord(item); return `### ${stringValue(finding.title)}\n${stringValue(finding.detail)}\n\nCitations: ${bulletList(finding.citationKeys)}`; }).join("\n\n"); }

export function artifactToMarkdown(kind: ArtifactKind, title: string, content: Json): string {
  const record = asRecord(content);
  if (kind === "product_brief") {
    const brief = asRecord(record.productBrief ?? null);
    const stories = listValue(record.userStories).map((item) => { const story = asRecord(item); return `### ${stringValue(story.title)}\n${stringValue(story.story)}\n\nAcceptance criteria:\n${bulletList(story.acceptanceCriteria)}\n\nCitations: ${bulletList(story.citationKeys)}`; }).join("\n\n");
    const metrics = listValue(record.successMetrics).map((item) => { const metric = asRecord(item); return `### ${stringValue(metric.name)} (${stringValue(metric.direction)})\n${stringValue(metric.definition)}\n\nCitations: ${bulletList(metric.citationKeys)}`; }).join("\n\n");
    const risks = listValue(record.risks).map((item) => { const risk = asRecord(item); return `### ${stringValue(risk.title)}\n${stringValue(risk.description)}\n\nMitigation: ${stringValue(risk.mitigation)}\n\nCitations: ${bulletList(risk.citationKeys)}`; }).join("\n\n");
    return `# ${title}\n\n## Executive summary\n${stringValue(record.executiveSummary)}\n\n## Product brief\n### Problem\n${stringValue(brief.problemStatement)}\n\n### Target user\n${stringValue(brief.targetUser)}\n\n### Proposed solution\n${stringValue(brief.proposedSolution)}\n\n### Desired outcome\n${stringValue(brief.desiredOutcome)}\n\nCitations: ${bulletList(brief.citationKeys)}\n\n## In scope\n${bulletList(record.inScope)}\n\n## Out of scope\n${bulletList(record.outOfScope)}\n\n## User stories\n${stories}\n\n## Success metrics\n${metrics}\n\n## Risks\n${risks}\n\n## Open questions\n${bulletList(record.openQuestions)}\n\n## Limitations\n${bulletList(record.limitations)}\n`;
  }
  return `# ${title}\n\n## Format\n${stringValue(record.format)}\n\n## Audience\n${stringValue(record.audience)}\n\n## Message\n${stringValue(record.message)}\n\n## Key points\n${findingList(record.keyPoints)}\n\n## Decisions or asks\n${bulletList(record.decisionsOrAsks)}\n\n## Caveats\n${findingList(record.caveats)}\n\n## Open questions\n${bulletList(record.openQuestions)}\n\n## Limitations\n${bulletList(record.limitations)}\n`;
}
