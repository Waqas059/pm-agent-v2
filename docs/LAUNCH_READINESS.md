# PM Agent V2 launch readiness

## Verified locally

- `npm test -- --run` passes.
- `npm run lint` passes.
- `npm run typecheck` passes.
- `npm run build` passes.
- `/api/health` returns `200` with a minimal status payload.
- Authenticated browser smoke tests cover context, workflows, artifacts, planning, metrics, usage, privacy, integrations, and beta feedback.

## Still requires an explicit release decision

- Review and push the local branch to GitHub.
- Choose and configure the production host.
- Add production-only server secrets through the host's secret manager.
- Recheck Supabase Auth redirect URLs, RLS policies, storage policies, and retention decisions in production.
- Run final authenticated UAT against the deployed URL.

## Workflow persistence foundation

`20260904040000_workflow_runs.sql` adds workspace-scoped `workflow_runs` and
`workflow_run_steps` tables for resumable long-chain execution. The tables are
protected by authenticated workspace-member RLS and store structured JSON state
without logging provider credentials. The current workflow routes remain
transient until the chain executor is introduced.

No deployment, GitHub push, account change, payment action, or external data sharing is performed by the local readiness checklist.
