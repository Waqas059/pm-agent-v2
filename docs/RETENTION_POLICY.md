# PM Agent V2 retention and deletion policy

Status: documented beta policy; automatic retention is not enabled.

## Current behavior

- Workspace records, evidence, decisions, assumptions, artifacts, and document
  metadata remain available until an authorized workspace member deletes them.
- Uploaded documents and their extracted text are private workspace assets and
  are deleted only through an explicit, scoped user action.
- AI prompts and model output are not stored by the provider boundary. Workflow
  telemetry stores only privacy-aware metadata such as status, model, latency,
  safe input/output sizes, and selected tool names.
- There is no scheduled expiry job, background purge, or automatic full-workspace
  deletion.

## Deletion rules

- Record deletion must remain workspace-scoped and must respect the existing
  owner/member/viewer authorization model.
- A document deletion must remove its private storage object and associated
  metadata/extraction records together, or report an explicit failure without
  claiming success.
- Full workspace deletion is owner-only, requires an explicit confirmation, and
  must remove workspace-scoped records and private files as one auditable
  operation. The guarded preview-and-confirmation flow is implemented; it must
  be exercised only against a disposable workspace before production use.

## Full-deletion implementation contract

The future owner-controlled deletion flow must follow this sequence:

1. Show a read-only preview for the selected workspace, including record and
   private-file counts.
2. Require an authenticated workspace owner and exact confirmation text that
   includes the workspace name. A generic confirm button is insufficient.
3. Create an auditable deletion operation before removing data. The operation
   records the requesting user, workspace, start time, item counts, final
   status, and a safe failure reason; it never records file contents.
4. Remove private storage objects using workspace-scoped paths, then delete the
   workspace root so database cascades remove its related records.
5. Report failure explicitly if either storage or database cleanup cannot be
   completed. The UI must never claim success after a partial failure.
6. On success, clear the session and return the user to the signed-out state.

The implementation is guarded by this contract and remains unverified until it
is tested against a disposable workspace. No production workspace is deleted
by documentation, deployment, or readiness checks.

## Future retention decision

Before enabling automatic retention, the product owner must define the period,
which record classes it applies to, legal or contractual exceptions, warning and
recovery behavior, and an auditable job-failure policy. Until then, data is
retained by default and users control deletion manually.
