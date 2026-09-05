# Workspace deletion readiness

This checklist tracks the irreversible workspace-deletion capability required
before wider public use. It is a design gate, not an execution command.

## Acceptance criteria

- Only an authenticated workspace owner can start the operation.
- The UI shows a read-only preview with the workspace name and counts before
  any mutation.
- Confirmation requires exact workspace-name text and cannot be satisfied by a
  generic click alone.
- Database records are deleted only for the selected workspace; membership and
  child records cannot cross workspace boundaries.
- Private document objects are addressed only through the selected workspace's
  storage prefix.
- The operation has an auditable start, success, or failure status without
  storing document contents, prompts, provider payloads, or credentials.
- Any storage or database failure returns an explicit failure state and never a
  false success state.
- A successful deletion signs the user out and leaves no active workspace in
  the client.
- Automated retention remains disabled until the product owner defines the
  period, record classes, legal exceptions, warning/recovery behavior, and
  job-failure policy.

## Current state

- Workspace-scoped record deletion is available through existing owner/member
  controls.
- The documents bucket is private and document objects use workspace-scoped
  paths.
- The guarded preview-and-confirmation flow is implemented in the application.
- Full deletion still requires a disposable-workspace UAT before being treated
  as production-ready.
- Automatic retention or purge is not enabled.
- No production data was changed while preparing this checklist.
