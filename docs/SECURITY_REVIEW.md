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
- Production responses add baseline browser hardening headers for content type,
  framing, referrer, permissions, and HTTPS transport.
- The production Supabase Site URL and
  `https://pm-agent-v2.vercel.app/auth/callback` redirect URL were verified in
  the project dashboard; the live callback route safely returns to the app.

## Still required before wider public use

- The workflow persistence migration has now been applied successfully to the
  linked Supabase project. Verify the new tables once in the dashboard as part
  of the authenticated UAT.
- Complete authenticated production UAT across signup/sign-in, workspace
  creation, context, evidence, documents, workflows, artifacts, planning,
  metrics, privacy, feedback, sign-out, and failure states.
- Recheck live Supabase RLS/storage behavior from the project dashboard.
- Decide and implement workspace deletion and retention automation.
- Add live evaluation observations; the checked-in evaluation harness is
  intentionally offline and token-free.
