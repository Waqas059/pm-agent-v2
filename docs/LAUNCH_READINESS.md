# PM Agent V2 launch readiness

## Verified locally

- `npm test -- --run` passes.
- `npm run lint` passes.
- `npm run typecheck` passes.
- `npm run build` passes.
- `/api/health` returns `200` with a minimal status payload.
- Authenticated browser smoke tests cover context, workflows, artifacts, planning,
  metrics, usage, privacy, integrations, and beta feedback.

## Verified in production

- The application is deployed at `https://pm-agent-v2.vercel.app`.
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

Search now applies a deterministic, stable title-first reranking pass over the
permission-filtered full-text results. It is covered by offline tests and does
not claim semantic similarity; embeddings or model-assisted reranking remain
optional follow-up work if evaluation justifies them.

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
  control is unavailable on the current Free plan, so this requires either a
  plan decision or an explicit beta-risk acceptance.
- Run the implemented owner-controlled deletion flow against a disposable
  workspace and verify storage cleanup, audit status, failure handling, and
  post-deletion sign-out before production use. The read-only production
  preview has already been verified; no real workspace was deleted.
- Decide whether to enable any automatic retention job.
- Continue collecting live evaluation observations after the token telemetry
  migration; the initial qualitative observation is recorded above and the
  checked-in regression harness remains offline and token-free.

No secrets, passwords, payment actions, or destructive deletions are performed by
this readiness checklist.
