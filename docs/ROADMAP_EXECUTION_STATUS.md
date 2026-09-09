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
- [ ] Final deployed production smoke test after the next release

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
- [ ] Semantic/model-assisted retrieval when evaluation justifies it
- [x] Apply the analytics migration to the target Supabase project
- [ ] Collect enough live data for retention and outcome baselines
- [ ] Automatic retention automation after policy approval

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
- [ ] External integrations and explicitly authorized tool actions (bounded
  public GitHub read-only preview implemented; OAuth/private-repo/write actions
  remain gated)
- [ ] Billing, subscriptions, and paid plans
- [ ] Enterprise administration and advanced governance

Estimated completion: 40–45%; provider-quality observation and the remaining
commercial/enterprise capabilities are still pending.

## Current roadmap estimate

- Current beta/core product: 93–95%
- P0 production trust: 85–90%
- P1 connected intelligence: 90–92%
- P2 expansion: 40–45%
- Entire master roadmap: approximately 74%

The product is not considered fully complete until the P0 and P1 checkboxes are
closed and each P2 capability has either been implemented and verified or has an
explicit provider/product decision recorded.

## Explicit completion gates

These gates are intentionally visible rather than being represented as fake
implementation progress:

- Production auth/workflow UAT needs an authorized test account and access to
  the deployed release email flow.
- Deletion UAT needs a disposable workspace; the active workspace must not be
  used for destructive verification.
- Leaked-password protection needs either a Supabase Pro-plan decision or an
  explicit beta-risk acceptance before wider public use.
- Retention automation needs an approved period, record classes, exceptions,
  warning/recovery behavior, and failed-job policy.
- Semantic retrieval needs a representative evaluation corpus and a measured
  quality improvement over the deterministic reranker.
- External integrations need one prioritized provider, OAuth/token ownership,
  scopes, and an explicit confirmation model for every external write.
- Billing needs plan, price, entitlement, tax, refund, and payment-provider
  decisions; enterprise administration needs a demand and governance scope.
