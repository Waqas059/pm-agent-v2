# PM Agent V2 launch readiness

## Verified locally

- `npm test -- --run` passes.
- `npm run lint` passes.
- `npm run typecheck` passes.
- `npm run build` passes.
- `/api/health` returns `200` with a minimal status payload and a non-sensitive
  release marker, making deployed-version verification auditable.
- `npm run smoke:production` verifies the public production health endpoint,
  application shell, and invalid-auth callback safety without requiring user
  credentials or mutating workspace data.
- The current deployed release passes the public smoke checks but reports no
  release marker because it predates the local health-endpoint change; the
  next deployment will make release identity visible.
- Authenticated browser smoke tests cover context, workflows, artifacts, planning,
  metrics, usage, privacy, integrations, and beta feedback.

## Verified in production

- The application is deployed at `https://pm-agent-v2.vercel.app`.
- Credential-free production smoke was re-run on 2026-09-09: health, public
  shell, protected API denial/detail-leakage checks, and invalid callback safety
  all passed. The deployed release still predates the local release-marker
  change, so the health response reports no release marker until the next
  deployment.
- After that deployment, run `PM_REQUIRE_RELEASE_MARKER=true npm run
  smoke:production` to make release identity a strict smoke requirement.
- Supabase Site URL and the production auth callback are configured and the live
  callback route returns safely to the application.
- RLS is enabled for workflow runs, handoffs, decisions, and assumptions.
- The documents storage bucket is private.
- A controlled Discover -> Define -> Align chain completed with three bounded AI
  runs, citation-backed outputs, approval handoffs, and one saved artifact.
- The activation onboarding guide is deployed and was verified in an
  authenticated production browser session.
- A bounded production Discover → Define → Align observation passed schema,
  citation-grounding, handoff-continuity, and artifact-persistence checks. The
  three observed latencies were 7,063 ms, 13,980 ms, and 6,670 ms; token and
  cost totals were unavailable for these older runs and are not inferred.
- A subsequent single-call production Discover observation completed with the
  expected structured sections, citation key, and explicit evidence
  limitations. Define and Align were intentionally not run in that check; the
  persisted run reports 9,060 ms latency and 789 provider-reported tokens.

The activation onboarding guide is present on the workspace overview. It
guides a new PM through context, source material, Discover, and capturing the
first outcome. Checklist progress is local-only and does not create, update,
or delete workspace data.

The in-product launch-readiness surface now separates verified local/deployment
checks from open production UAT, deletion, password-protection, and retention
gates. It no longer presents every checklist item as ready while the release
still requires review.

## Workflow persistence foundation

`20260904040000_workflow_runs.sql` adds workspace-scoped `workflow_runs` and
`workflow_run_steps` tables for resumable long-chain execution. The tables are
protected by authenticated workspace-member RLS and store structured JSON state
without logging provider credentials. Discover, Define, and Align create a run
and step record, then persist completed or failed outcomes.

## P1 workflow controls

Migration `20260905010000_handoffs_decisions_assumptions.sql` adds
RLS-protected `workflow_handoffs`, `decision_records`, and `assumptions`
tables. Discover results expose explicit approval actions; approved handoffs are
loaded into Define and Align as editable starting context. Decisions and
assumptions are maintained by the human PM.

The constrained PM entry point, indexed full-text retrieval, and privacy-aware
workflow telemetry are also present. Telemetry does not store prompts, provider
payloads, or credentials.

Workflow telemetry now also stores provider-reported input, output, and total
token counts, and surfaces total tokens in the observability panel. Pricing is
not inferred until model-specific rates are deliberately configured.

The beta usage cap is enforced server-side across Discover, Define, and Align;
failed runs do not consume the cap, while active and successful runs are counted
to prevent accidental unbounded provider usage. The usage panel reads that
workspace-level count, with a browser-only fallback if the status request fails.

Search now applies a deterministic, stable hybrid lexical reranking pass over
permission-filtered full-text results. Phrase matches, title matches,
token-prefix matches, detail matches, and small source-type boosts are explicit
and covered by offline tests plus a five-case PM retrieval baseline. The current
baseline reports mean reciprocal rank 1.0 on that representative corpus. This
does not claim semantic similarity; embeddings or model-assisted reranking
remain optional follow-up work until a larger corpus and live relevance signals
justify them.

Workflow failure handling now preserves the entered Discover, Define, and Align
inputs and exposes an explicit Retry action after a provider, network, or
workflow error. Authenticated requests also retry once after refreshing an
expired Supabase session.

Privacy-aware product analytics now records workspace views, onboarding
progress, workflow starts/completions/failures, artifact creation, artifact
version saves, artifact exports, evidence citation inspection, and human
decision/assumption creation without storing prompts, outputs, credentials, or
source content. The observability surface reports workflow conversion when the
analytics migration is applied; these events provide the foundation for
retention and outcome baselines.

Scanned PDFs and PNG/JPEG/WebP documents now use a server-only OCR path with
strict structured page output and page-aware source locators. Deterministic
text extraction remains the default for ordinary text-bearing documents.

Market research now uses the Responses API web-search tool, validates returned
source URLs against web-retrieval annotations, preserves retrieval dates and
source excerpts, labels web evidence separately, and keeps the result
review-only rather than persisting it automatically.

The integrations surface now includes a bounded public GitHub preview. It
requires an authenticated PM action, reads repository metadata plus up to five
open issue summaries, strips issue bodies, persists nothing, and exposes no
write action. Private repositories, OAuth, and external writes remain explicit
future gates.

## Beta completion evidence — 2026-09-08

- An authenticated local Discover run completed through the real UI with a
  focused question, structured themes, pain points, opportunity, open questions,
  explicit limitations, and a citation key grounded in saved evidence. The run
  was persisted as review-required and reported 8,780 ms latency and 758 tokens
  in the observability panel.
- The owner deletion flow was exercised through its read-only review step. The
  preview correctly reported 21 database records and 2 private files, required
  the exact confirmation phrase, kept the destructive action disabled until
  confirmation, and exposed a cancel path. No workspace was deleted.
- Current beta decisions are recorded in `docs/BETA_DECISIONS.md`: manual
  delete-only retention remains in effect, automatic purge is disabled, and the
  Free-plan leaked-password protection limitation is accepted for beta.

## Retention policy

The beta policy is documented in `docs/RETENTION_POLICY.md`. Data is retained
by default, deletion is explicit and workspace-scoped, and no automatic purge or
full-workspace deletion flow is enabled until retention periods and exception
rules are defined.

## Remaining before wider public use

- Complete a deliberate signup/sign-in/sign-out cycle in production. The
  invalid-callback failure path has been verified; the active session was not
  signed out during the remote run.
- Resolve the Supabase advisor warning for leaked-password protection. The
  control is unavailable on the current Free plan. The beta-risk acceptance is
  recorded; a wider-public-use release still needs either a plan decision or a
  compensating control.
- Run the implemented owner-controlled deletion flow against a disposable
  workspace and verify storage cleanup, audit status, failure handling, and
  post-deletion sign-out before production use. The read-only production
  preview has already been verified; no real workspace was deleted.
- Automatic retention remains intentionally disabled for beta; revisit it only
  when retention periods and exception rules are approved.
- Continue collecting live evaluation observations after the token telemetry
  migration; the initial qualitative observation is recorded above and the
  checked-in regression harness remains offline and token-free.

No secrets, passwords, payment actions, or destructive deletions are performed by
this readiness checklist.
