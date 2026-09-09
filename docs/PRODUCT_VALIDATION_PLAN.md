# Bootstrap PM beta product-validation plan

Status: ready for execution; no live-user results are claimed yet.

The product-validation objective is to prove that Bootstrap PM helps Product
Managers make better, faster, and more traceable decisions. Feature presence,
AI output quality, and successful deployment are necessary foundations, but do
not count as validation by themselves.

## Core hypothesis

For a real product question, a PM will use Bootstrap PM to move from:

Question → Context → Evidence → Decision → Artifact → Memory

and will prefer the resulting traceable workflow to their current ad-hoc
process.

## Beta cohort and protocol

Recruit 3–5 practicing Product Managers who each bring one real, non-sensitive
product decision. Each participant should complete at least two workflows over
two weeks:

1. Capture the question and relevant product context.
2. Review or add source-backed evidence.
3. Run Discover and inspect citations and limitations.
4. Review Define output and save only what the participant approves.
5. Use Align to prepare a decision communication.
6. Record the decision, assumption, or next experiment.
7. Return later and reuse the resulting artifact or memory.

Use a disposable beta workspace for testing. Do not upload confidential
customer data until the participant and workspace policy allow it.

## Proposed validation gates

These are proposed success thresholds, not observed results. They should be
approved before the first cohort and then measured against real usage:

- Activation: at least 4 of 5 participants reach a first evidence-backed
  workflow output.
- Workflow completion: at least 70% of started Discover → Define → Align
  workflows reach a human-reviewed output.
- Traceability: at least 80% of reviewed AI findings retain inspectable source
  citations or an explicit limitation.
- Decision usefulness: at least 4 of 5 participants rate the final decision
  or communication as more useful than their usual process.
- Repeat value: at least 3 of 5 participants return and reuse an artifact,
  decision, assumption, or evidence item within 14 days.
- Qualitative safety: no unresolved critical issue involving fabricated
  evidence, lost provenance, unauthorized workspace access, or destructive
  data behavior.

If a threshold is not met, record the failure mode and improve the smallest
part of the workflow that explains it. Do not add infrastructure or AI
complexity solely to improve a vanity metric.

## Existing instrumentation map

The current product already records privacy-aware events for:

- onboarding started/completed;
- workflow started/completed/failed;
- evidence citation inspection;
- decision and assumption creation;
- artifact creation, versioning, and export;
- document upload and extraction;
- workspace views and bounded research outcomes.

The existing outcome baseline can report activation, workflow completion, and
artifact-after-workflow rates. It must remain honest when the cohort is too
small and must not be treated as proof of product value without participant
feedback and repeat-use evidence.

## Missing evidence to collect

- participant role and decision context, collected with consent;
- time from question capture to first useful reviewed output;
- participant-rated usefulness and confidence before/after the workflow;
- whether citations changed or strengthened the decision;
- repeat use within 7 and 14 days;
- artifact or decision reuse in a later workflow;
- qualitative failure reasons for abandonment or low trust.

These can begin as a structured research log alongside the existing analytics;
do not add a new persistence model until the cohort shows that the signal is
needed repeatedly.

## Product-validation completion rule

Product validation reaches 100% only when:

1. the cohort protocol has been executed with real PMs;
2. the proposed gates have measured results;
3. critical safety/provenance issues are resolved or explicitly accepted;
4. the team has recorded the next product decision based on the evidence.

Until then, the product is beta-ready but product validation remains in
progress.
