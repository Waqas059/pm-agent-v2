"use client";

import { authenticatedFetch } from "./supabase/auth-fetch";

export function trackClientProductEvent(eventName: "evidence_citation_inspected" | "decision_created" | "assumption_created", surface: string) {
  void authenticatedFetch("/api/analytics", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ eventName, surface }),
  }).catch(() => {
    // Analytics is best-effort and must never interrupt a PM action.
  });
}
