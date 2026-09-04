export type FeedbackRating = 1 | 2 | 3 | 4 | 5;

export const SESSION_FEEDBACK_KEY = "pm-agent.session-feedback";

export function getFeedbackLabel(rating: FeedbackRating): string {
  return ({ 1: "Needs work", 2: "Could be better", 3: "Useful", 4: "Very useful", 5: "Excellent" })[rating];
}

export function normalizeFeedbackRating(value: number): FeedbackRating {
  return Math.min(5, Math.max(1, Math.round(value))) as FeedbackRating;
}
