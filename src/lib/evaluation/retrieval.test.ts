import { describe, expect, it } from "vitest";

import { rankSearchResults, type SearchCandidate } from "@/lib/search/rank";

type RetrievalCase = {
  query: string;
  candidates: SearchCandidate[];
  relevantId: string;
};

const candidate = (id: string, type: string, title: string, detail: string): SearchCandidate => ({ id, type, title, detail, href: `#${type.toLowerCase()}` });

const cases: RetrievalCase[] = [
  {
    query: "setup friction",
    candidates: [
      candidate("setup-evidence", "Evidence", "Setup friction interview", "Customers abandon setup after the first configuration step."),
      candidate("setup-context", "Context", "Activation context", "The setup experience is a priority for new customers."),
      candidate("setup-artifact", "Artifact", "Onboarding brief", "A saved product brief."),
    ],
    relevantId: "setup-evidence",
  },
  {
    query: "pricing decision",
    candidates: [
      candidate("pricing-artifact", "Artifact", "Pricing decision brief", "A saved decision brief for the mid-market launch."),
      candidate("pricing-evidence", "Evidence", "Pricing interview", "Customers compare price against setup effort."),
      candidate("pricing-context", "Context", "Commercial context", "The pricing model serves a mid-market segment."),
    ],
    relevantId: "pricing-artifact",
  },
  {
    query: "completion rate",
    candidates: [
      candidate("completion-evidence", "Evidence", "Completion rate observation", "Observed completion rate is lower than the target."),
      candidate("completion-context", "Context", "Success metrics", "Completion is a key activation metric."),
      candidate("completion-artifact", "Artifact", "Activation update", "A saved stakeholder message."),
    ],
    relevantId: "completion-evidence",
  },
  {
    query: "stakeholder update",
    candidates: [
      candidate("stakeholder-artifact", "Artifact", "Stakeholder update", "A saved communication message."),
      candidate("stakeholder-evidence", "Evidence", "Stakeholder interview", "The team needs a concise update."),
      candidate("stakeholder-context", "Context", "Stakeholder context", "Stakeholders review product decisions weekly."),
    ],
    relevantId: "stakeholder-artifact",
  },
  {
    query: "enterprise customer",
    candidates: [
      candidate("enterprise-context", "Context", "Enterprise customer profile", "The product serves enterprise teams with compliance needs."),
      candidate("enterprise-evidence", "Evidence", "Customer interview", "An enterprise customer requested audit controls."),
      candidate("enterprise-artifact", "Artifact", "Enterprise brief", "A saved product brief."),
    ],
    relevantId: "enterprise-context",
  },
];

describe("deterministic retrieval evaluation baseline", () => {
  it("keeps the relevant result at rank one across the representative PM cases", () => {
    const reciprocalRanks = cases.map((testCase) => {
      const ranked = rankSearchResults(testCase.candidates, testCase.query);
      const rank = ranked.findIndex((item) => item.id === testCase.relevantId) + 1;
      return rank > 0 ? 1 / rank : 0;
    });
    const meanReciprocalRank = reciprocalRanks.reduce((total, value) => total + value, 0) / reciprocalRanks.length;

    expect(meanReciprocalRank).toBe(1);
  });
});
