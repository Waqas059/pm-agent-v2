# P0 production UAT report

Date: 2026-09-09
Environment: `https://pm-agent-v2.vercel.app`

## Latest live browser UAT — 2026-09-09

- The previously authenticated session was signed out successfully.
- The same beta account signed in again through the production UI, and the
  workspace, saved work queue, evidence, and navigation loaded after the fresh
  session was established.
- The existing Discover handoff loaded with its saved evidence and citations.
- Define completed from the approved Discover handoff and returned a reviewable
  cited product brief with scope, acceptance criteria, metrics, and risks.
- Align loaded its approved Discover summary and decision inputs, but its AI
  draft was blocked by the configured beta limit of 10 active or successful AI
  runs. This is an expected beta guardrail, not an auth or handoff failure.
- Signup was not repeated because the account is an existing production user;
  a separate disposable signup account is still required for that test.
- Workspace deletion and post-delete cleanup were not attempted because no
  disposable workspace was available; the active workspace was protected from
  destructive testing.

## Passed without an AI call

- Authenticated production session loaded for the workspace user.
- Workspace navigation loaded the PM entry point, context, documents, evidence,
  workflows, observability, decisions, and launch-readiness surfaces.
- Existing workspace context, evidence, document metadata, and artifact history
  loaded successfully.
- The constrained PM entry point returned an approved internal tool plan with
  human-approval markers for workflow and write actions.
- Indexed workspace search returned the saved evidence item for a matching
  query.
- A synthetic text-based PDF (`pm-agent-uat-sample.pdf`) uploaded successfully,
  extracted without an AI call, and appeared in workspace search for the
  citation marker `CIT-PDF-UAT-001`.
- Observability loaded without exposing prompts, provider payloads, or keys.
- Invalid short search input returned the expected validation message.
- Read-only Supabase policy verification passed: RLS is enabled for
  `workflow_runs`, `workflow_handoffs`, `decision_records`, and `assumptions`.
- The `documents` storage bucket was verified as private.
- The production Site URL is configured in Supabase, and
  `https://pm-agent-v2.vercel.app/auth/callback` is allowlisted.
- The activation onboarding guide is present in production and exposes links
  for context, source material, Discover, and outcome capture. Its checklist
  progress is local-only.
- An invalid auth callback code redirected safely to the fixed app root with
  `auth_error=confirmation`; the active authenticated session remained
  available and no provider details were exposed.

## Controlled AI chain completed

- Discover completed with one focused request and returned a citation-backed
  synthesis, themes, pain points, opportunities, open questions, and explicit
  limitations.
- The Discover result was approved for Define and Align.
- Define completed with a reviewable product brief, acceptance criteria,
  measurable success metrics, risks, and validation questions.
- Align completed with a citation-backed executive update and a clear decision
  ask: sponsor focused setup-flow validation before a larger commitment.
- The final communication was saved as workspace artifact version 1.
- Three successful AI runs were recorded in the session meter; no additional
  workflow calls were made.

## Controlled document test scope

- Extraction was attempted on the existing `WhatsApp to SMS Fallback_v3.docx`.
  The file has a legacy `.doc` binary signature despite its `.docx` name; the
  application now detects that mismatch and returns an actionable 422 message.
- The synthetic PDF was used only to validate the successful extraction and
  search path. It remains in the private workspace for review; it was not
  deleted automatically.

## Remaining before wider public use

- Complete a deliberate signup/sign-in/sign-out cycle in the production
  browser. The invalid-callback failure path is covered above; the active
  session was intentionally not signed out during this remote run to avoid
  disrupting access.
- Review retention and deletion decisions from the dashboard. Storage privacy
  and authentication callback configuration have been verified.
- Decide whether to enable ongoing retention/deletion automation.
- If the WhatsApp source is needed in the workspace, save/export it as a valid
  `.docx` or PDF and upload it separately.

## Reproducible authenticated smoke

The repository includes `npm run smoke:authenticated`, a read-only harness that
signs in through Supabase using runtime-only `UAT_*` environment variables and
checks the authenticated health, search, artifacts, usage, analytics, and
workspace-deletion-preview endpoints. It never logs the access token and never
submits a destructive request. The harness is ready, but its production run
still requires an authorized UAT account.
