# Bootstrap PM Agent V2 roadmap execution status

Updated: 2026-09-09

This is the delivery tracker for the complete PM Agent V2 roadmap. Percentages
are workstream estimates based on implemented capability plus verification
evidence; they are not code-coverage percentages.

The external release, authenticated UAT, deletion UAT, and commercialization
steps are documented in `docs/PRODUCTION_RELEASE_RUNBOOK.md`.

## Phase 1 — P0 production trust

Status: substantially implemented; final external verification remains.

- [x] Auth callback and invalid-callback handling
- [x] RLS, storage privacy, server boundaries, and secret review
- [x] Static sensitive-log review with provider/file error redaction
- [x] Launch-readiness status accuracy for verified checks versus open gates
- [x] Structured AI evaluation harness
- [x] Digital document extraction and locator preservation
- [x] Reviewable evidence drafts from extracted document text with document provenance
- [x] Workflow failure messages and explicit retry actions
- [x] Production build, lint, typecheck, and regression tests
- [x] Credential-free production smoke script for health, shell, and callback
  safety
- [x] Credential-free smoke coverage for protected API denial and detail
  leakage checks
- [x] Credential-free CI quality gate for pull requests and the main branch
- [x] Credentialed read-only authenticated smoke harness (credentials supplied
  only at runtime)
- [x] Deterministic repository release-readiness audit (`npm run audit:roadmap`)
- [x] Auditable non-sensitive release marker in the health endpoint
- [x] Strict post-deployment smoke mode that requires the release marker
- [x] Manually triggered production-smoke workflow for post-deploy verification
- [x] Authenticated-fetch bearer fallback and invalid-session regression tests
- [ ] Verify authenticated browser session propagation after a fresh sign-in
- [x] Owner-visible sanitized deletion-operation audit in the privacy controls
- [ ] Deliberate production signup/sign-in/sign-out cycle
- [ ] Disposable-workspace deletion UAT, including post-delete sign-out
- [x] Record a beta-risk mitigation for Supabase leaked-password protection
- [ ] Resolve the leaked-password protection limitation before wider public use
- [x] Final deployed production smoke test after release `105f0b653dd0`

The post-release production smoke passed against `https://pm-agent-v2.vercel.app`
after release `105f0b653dd0`: health marker, public shell, protected API denial,
and invalid callback safety all passed.

Estimated completion: 85–90%.

## Phase 2 — P1 connected PM intelligence

Status: core capability implemented; expansion and measurement remain.

- [x] Discover → Define → Align handoffs with human approval, including saved Define artifact → Align provenance
- [x] Decision records
- [x] Assumption registry
- [x] Constrained PM entry point and typed PM tools
- [x] PM plans explicitly retrieve durable decisions and assumptions before proposing action
- [x] Permission-filtered full-text retrieval and transparent hybrid lexical
  reranking
- [x] Searchable durable decision and assumption memory
- [x] AI observability, latency, token, and run metadata
- [x] Privacy-aware product analytics for activation, workflow conversion,
  failure signals, artifact creation, version reuse, and export outcomes
- [x] Deterministic descriptive outcome-baseline calculations with honest empty
  states
- [x] Provider-quality telemetry for review-only market research (counts and
  latency only; no prompt/source payloads)
- [x] Activation onboarding
- [x] Manual workspace deletion policy
- [x] Fail-closed retention policy gate with regression tests
- [x] Defer semantic/model-assisted retrieval by approved beta decision; keep
  the lexical retrieval boundary extensible
- [x] Apply the analytics migration to the target Supabase project
- [ ] Collect enough live data for retention and outcome baselines
- [x] Defer automatic retention by approved beta policy; manual deletion remains
  the beta behavior

The analytics migrations through `20260908050000_provider_quality_events` and
the additive `20260908060000_define_artifact_align_handoff` and
`20260908070000_reasoning_memory_search` migrations are applied to the target
Supabase project. The event layer now covers workflow
conversion, artifact reuse/export, citation inspection, human decision /
assumption creation, and bounded market-research provider quality; live
retention and outcome baselines still require real usage over time.

The offline retrieval baseline now covers five representative PM queries and
reports mean reciprocal rank 1.0 for the current deterministic reranker. This
is a useful regression guard, but it is not evidence that semantic retrieval is
needed; a larger corpus and live relevance feedback should precede that cost
and complexity.

Estimated completion: 90–92%.

## Phase 3 — P2 expansion capabilities

Market research and OCR are implemented as bounded, review-first capabilities.
The remaining items require additional product definitions and, for some items,
external providers, credentials, billing configuration, or enterprise demand.

- [x] Live market research with cited provider-backed sources, verified URL
  annotations, retrieval dates, limitations, and review-only output
- [x] OCR for scanned PDFs and PNG/JPEG/WebP documents via strict structured
  Responses API output; live provider-quality observation remains
- [x] Explicit read-only integration consent and write-action guard for the
  public GitHub preview
- [x] Approve GitHub as the only beta integration, read-only; defer OAuth,
  private-repository, write actions, and other providers
- [x] Defer billing, subscriptions, and paid plans from beta
- [x] Defer enterprise administration and advanced governance from beta

Estimated completion: 40–45%; provider-quality observation and the remaining
commercial/enterprise capabilities are still pending.

## Current roadmap estimate

- Current beta/core product implementation: 93–95%; approved beta scope is
  now explicit and contains no speculative billing, enterprise, or semantic
  retrieval work
- P0 production trust: 85–90%
- P1 connected intelligence: 90–92%
- P2 expansion: 40–45%
- Entire master roadmap: approximately 75%; the remaining expansion is
  intentionally deferred by approved beta decisions or requires live UAT/data

The approved beta scope is now fully decided. The product is not considered
public-launch complete until the remaining P0 UAT and security gates are
verified. The broader master roadmap remains intentionally deferred where the
beta decisions above say not to build yet.

Product validation execution is documented in
`docs/PRODUCT_VALIDATION_PLAN.md`. Existing analytics provide the measurement
foundation, but no live cohort results are claimed until real Product Managers
complete the protocol and the proposed gates are measured.

## Explicit completion gates

These gates are intentionally visible rather than being represented as fake
implementation progress:

- Production auth/workflow UAT needs an authorized test account and access to
  the deployed release email flow.
- Deletion UAT needs a disposable workspace; the active workspace must not be
  used for destructive verification.
- Leaked-password protection is accepted for private beta and remains a
  required pre-public-launch task.
- Retention automation needs an approved period, record classes, exceptions,
  warning/recovery behavior, and failed-job policy.
- Semantic retrieval is explicitly deferred until real query behavior shows a
  measured improvement opportunity.
- GitHub is the approved beta integration and remains read-only; other
  providers and writes are deferred.
- Billing and enterprise administration are explicitly deferred from beta.
