export type SearchCandidate = {
  id: string;
  type: string;
  title: string;
  detail: string;
  href: string;
};

function normalize(value: string) {
  return value.toLocaleLowerCase().replace(/[^\p{L}\p{N}]+/gu, " ").trim();
}

function scoreCandidate(candidate: SearchCandidate, query: string) {
  const normalizedQuery = normalize(query);
  const terms = normalizedQuery.split(/\s+/).filter((term) => term.length > 1);
  const title = normalize(candidate.title);
  const detail = normalize(candidate.detail);
  let score = 0;

  if (normalizedQuery && title.includes(normalizedQuery)) score += 10;
  if (normalizedQuery && title.startsWith(normalizedQuery)) score += 3;
  for (const term of terms) {
    if (title.includes(term)) score += 5;
    if (title.split(" ").some((word) => word.startsWith(term))) score += 2;
    if (detail.includes(term)) score += 1;
  }

  const type = normalize(candidate.type);
  if (type === "evidence") score += 2;
  if (type === "context") score += 1;
  if (type === "artifact" && /\b(brief|decision|spec)\b/.test(title)) score += 1;

  return score;
}

/**
 * Ranks already permission-filtered search results with transparent lexical
 * signals: phrase matches, title/token-prefix matches, detail matches, and
 * small source-type boosts. This is intentionally not semantic similarity.
 * Stable ordering keeps equally relevant results predictable.
 */
export function rankSearchResults(candidates: readonly SearchCandidate[], query: string) {
  return candidates
    .map((candidate, index) => ({ candidate, index, score: scoreCandidate(candidate, query) }))
    .sort((left, right) => right.score - left.score || left.index - right.index)
    .map(({ candidate }) => candidate);
}
