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
  operation. This flow is not enabled yet.

## Future retention decision

Before enabling automatic retention, the product owner must define the period,
which record classes it applies to, legal or contractual exceptions, warning and
recovery behavior, and an auditable job-failure policy. Until then, data is
retained by default and users control deletion manually.
