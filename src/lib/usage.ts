export const SESSION_USAGE_KEY = "pm-agent.session-ai-runs";
export const BETA_AI_RUN_LIMIT = 10;

export function getUsagePercent(used: number, limit: number): number {
  if (limit <= 0) return 100;
  return Math.min(100, Math.max(0, (used / limit) * 100));
}

export function getUsageLabel(used: number, limit: number): "Available" | "Near limit" | "Limit reached" {
  if (used >= limit) return "Limit reached";
  if (used >= limit * 0.8) return "Near limit";
  return "Available";
}

export function readSessionAiRuns(): number {
  if (typeof window === "undefined") return 0;
  const value = Number(window.localStorage.getItem(SESSION_USAGE_KEY) ?? 0);
  return Number.isInteger(value) && value >= 0 ? value : 0;
}

export function recordSessionAiRun(): number {
  const nextValue = readSessionAiRuns() + 1;
  window.localStorage.setItem(SESSION_USAGE_KEY, String(nextValue));
  window.dispatchEvent(new CustomEvent("pm-agent:usage-updated"));
  return nextValue;
}
