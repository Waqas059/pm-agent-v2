# PM Agent V2 production release runbook

This runbook closes the remaining external release gates without weakening the
local roadmap checks. It is intentionally credential-free in the repository;
UAT credentials must be supplied only in the operator's runtime environment.

## 1. Release preparation

Run from the approved checkout before merging or releasing:

```powershell
npm run lint
npm run typecheck
npm run test
npm run evals
npm run audit:roadmap
npm run build
```

The production build may use an isolated `distDir` temporarily when a local
Next dev server is running. Restore the tracked `next.config.ts` afterward and
remove the temporary build directory.

## 2. Deploy through the configured pipeline

Deploy the reviewed commit through the repository's configured GitHub/Vercel
pipeline. Do not paste provider tokens into the repository, command history,
browser code, or logs. Record the resulting commit or deployment identifier.

The health endpoint exposes a non-sensitive release marker from
`VERCEL_GIT_COMMIT_SHA`. The currently deployed legacy release may not expose
that marker; the strict smoke command below must be used after the next release.

## 3. Credential-free post-deploy smoke

```powershell
$env:PM_PRODUCTION_URL = "https://pm-agent-v2.vercel.app"
$env:PM_REQUIRE_RELEASE_MARKER = "true"
npm run smoke:production
```

The same check can be run from GitHub Actions with the **PM Agent production
smoke** workflow. Keep `Require the deployed release marker` enabled for the
release sign-off run.

Acceptance criteria:

- health is `200` and contains a release marker;
- the public application shell renders;
- protected search, artifacts, usage, and deletion-preview endpoints deny
  anonymous access without provider or implementation details;
- invalid auth callbacks redirect to the same application origin with the
  fixed confirmation error.

## 4. Authenticated read-only smoke

Use a dedicated non-production-data UAT account and provide values only at
runtime:

```powershell
$env:UAT_SUPABASE_URL = "..."
$env:UAT_SUPABASE_PUBLISHABLE_KEY = "..."
$env:UAT_EMAIL = "..."
$env:UAT_PASSWORD = "..."
$env:PM_PRODUCTION_URL = "https://pm-agent-v2.vercel.app"
npm run smoke:authenticated
```

The harness must not print access tokens or mutate workspace data. Run it
before the destructive UAT below.

## 5. Manual authenticated browser UAT

Use a disposable workspace and record pass/fail evidence for:

1. fresh signup, email confirmation, sign-in, and sign-out;
2. workspace creation and product context save/edit/delete;
3. document upload, extraction, evidence citation inspection, and search;
4. Discover → Define → Align with approval checkpoints and saved artifact
   provenance;
5. decisions, assumptions, experiments, metrics, artifacts, export, and
   failure/retry behavior;
6. privacy controls, deletion preview, feedback, and invalid-session recovery;
7. narrow mobile and desktop checks for navigation, forms, focus, and action
   hit areas.

Confirm that saved drafts, hash navigation, visited-panel mounting, and
workflow state survive navigation and an auth refresh.

## 6. Destructive deletion UAT

Never use the active product workspace. Create a disposable workspace, upload a
non-sensitive test file, then:

- review the deletion preview and expected record/file counts;
- verify the exact confirmation phrase is required;
- confirm deletion and inspect the sanitized operation status;
- verify the storage object and workspace are gone;
- verify the browser is signed out and protected routes deny access;
- record any partial-failure behavior before retrying.

## 7. Wider-public gate decisions

Before declaring the roadmap complete, record explicit decisions for:

- Supabase leaked-password protection (plan upgrade or accepted risk scope);
- retention periods, exceptions, warnings, recovery, and failed-job handling;
- semantic retrieval only after a larger corpus demonstrates improvement over
  deterministic reranking;
- one prioritized OAuth/private integration, token ownership, scopes, and
  confirmation for each external write;
- billing plans, entitlements, taxes, refunds, and payment provider;
- enterprise demand, roles, audit scope, and governance requirements.

Until these decisions and the associated evidence exist, launch-readiness must
continue to show the relevant gates as open.
