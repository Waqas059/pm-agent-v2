# Production security review

This is the repository-side review for the PM Agent V2 Version 3.0 P0
hardening work. It records repository and linked-project evidence; it does not
replace a full authenticated production test.

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
- The linked Supabase security advisor returned one warning: leaked-password
  protection is disabled. The dashboard makes this control available only on
  the Pro plan and above; no billing or plan change was performed.

## Still required before wider public use

- The workflow persistence migration has now been applied successfully to the
  linked Supabase project, and its RLS/storage checks passed in the dashboard.
- Before wider public use, either enable leaked-password protection after a
  plan decision or explicitly accept this Free-plan limitation for beta use.
- Complete signup/sign-in, sign-out, and failure-state testing in production.
- Decide and implement workspace deletion and retention automation.
- Add live evaluation observations; the checked-in evaluation harness is
  intentionally offline and token-free.
