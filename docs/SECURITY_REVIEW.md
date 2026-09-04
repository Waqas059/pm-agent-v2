# Production security review

This is the repository-side review for the PM Agent V2 Version 3.0 P0
hardening work. It records static evidence only; it does not replace an
authenticated production test or a Supabase dashboard review.

## Verified in the repository

- Public workspace, membership, context, document, evidence, artifact, and
  workflow-state tables have versioned migrations with RLS enabled.
- Anonymous table access is revoked; authenticated access is limited by
  workspace membership and owner/member/viewer roles.
- Private document storage uses a non-public bucket and workspace/user-scoped
  object paths.
- OpenAI credentials are read only by server-side modules. The browser uses
  only Supabase public configuration.
- OpenAI Responses calls use `store: false`, and the app does not log prompts,
  model output, or credentials.
- The auth callback exchanges a supplied code for a session and redirects to a
  fixed same-application root URL; provider details are not returned to users.
- Workflow-run and step identity guards prevent moving durable state between
  workspaces after creation.

## Still required before wider public use

- Apply and verify the workflow persistence migration in the linked Supabase
  project. The current CLI environment needs a fresh `supabase login` because
  it has no access token; no token should be pasted into chat.
- Complete authenticated production UAT across signup/sign-in, workspace
  creation, context, evidence, documents, workflows, artifacts, planning,
  metrics, privacy, feedback, sign-out, and failure states.
- Recheck live Supabase RLS/storage behavior and authentication callback URLs
  from the project dashboard.
- Decide and implement workspace deletion and retention automation.
- Add live evaluation observations; the checked-in evaluation harness is
  intentionally offline and token-free.
