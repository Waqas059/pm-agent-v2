# AI evaluation harness

PM Agent keeps an offline evaluation corpus and metric reducer in
`src/lib/evaluation/`. The corpus covers evidence synthesis, citation accuracy,
opportunity identification, PRD quality, acceptance criteria, prioritization,
decision rationale, assumptions, stakeholder communication, and insufficient
evidence behavior.

Run the contract harness with:

```bash
npm run evals
```

This command makes no provider calls and does not consume model tokens. It
checks that the representative cases exist and that reported metrics are
derived from supplied observations. Empty observations return `null` metrics;
the harness never invents quality, confidence, or cost percentages.

When a live evaluation runner is added, it should record only the non-sensitive
metadata represented by `EvaluationObservation`: schema validity, grounding,
unsupported-claim counts, completeness, human acceptance, latency, token use,
and estimated provider cost. Raw customer content and credentials must stay out
of logs.
