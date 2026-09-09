# Bootstrap PM Agent V2 beta decisions

Date: 2026-09-08

This records the product decisions accepted for the current beta scope.

## Retention

- Beta retention is manual-delete only.
- Records remain available until an authorized workspace owner deletes them.
- Automatic purge is intentionally disabled for beta.
- Any future automated retention job requires an explicit product decision covering periods, record classes, exceptions, warning/recovery behavior, and job failures.

## Password protection

- The current Supabase Free-plan limitation for leaked-password protection is accepted for beta.
- Enabling the control remains a production-hardening recommendation and requires a plan decision before wider public use.

## Deletion verification

- The owner-controlled preview-and-confirmation deletion flow is implemented.
- Destructive deletion UAT must run against a disposable workspace, never the active product workspace.
