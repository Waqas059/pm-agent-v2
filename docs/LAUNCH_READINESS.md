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

- Complete signup/sign-in, sign-out, and failure-state testing in production.
- Resolve the Supabase advisor warning for leaked-password protection. The
  control is unavailable on the current Free plan, so this requires either a
  plan decision or an explicit beta-risk acceptance.
- Implement owner-controlled full workspace deletion after the deletion contract
  and confirmation flow are defined.
- Decide whether to enable any automatic retention job.
- Add live evaluation observations; the checked-in evaluation harness remains
  offline and token-free.

No secrets, passwords, payment actions, or destructive deletions are performed by
this readiness checklist.
