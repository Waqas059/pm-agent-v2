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

## Live beta observation

Date: 2026-09-05
Environment: `https://pm-agent-v2.vercel.app`

One bounded Discover → Define → Align chain was completed in the authenticated
production workspace. The observed checks were:

- schema-valid workflow results: pass for all three steps;
- citation-backed grounding: pass; outputs included supplied citation keys and
  explicit limitations;
- workflow continuity: pass; Discover handoffs were approved and loaded into
  Define and Align;
- durable outcome: pass; the final communication was saved as artifact version
  1;
- observed latency: Discover 7,063 ms, Define 13,980 ms, Align 6,670 ms;
- provider token totals and estimated cost: unavailable for these older runs,
  so no cost percentage is claimed.

This is an initial qualitative beta observation, not a statistically sufficient
quality baseline. The offline harness remains the regression gate and makes no
provider calls.

## Additional bounded production observation

Date: 2026-09-05
Environment: `https://pm-agent-v2.vercel.app`

One additional Discover-only run was completed with the question: “What
recurring setup friction should we investigate before planning the next
release?” The result:

- completed successfully with the configured `gpt-5.6-luna` provider;
- returned the expected synthesis, themes, pain points, opportunities, open
  questions, and limitations sections;
- cited the saved evidence key `CIT-BC29D6AA` and explicitly limited the
  conclusion to the single UAT interview;
- correctly identified missing quantitative setup-time, completion-rate,
  drop-off, recurrence, and severity data;
- did not start Define or Align, keeping this observation to one provider call;
- observed latency: 9,060 ms;
- provider-reported total tokens: 789; estimated cost remains unavailable
  because model-specific pricing is not configured.

This observation confirms bounded execution and evidence-aware behavior, but
does not replace broader human review or the offline regression harness.
