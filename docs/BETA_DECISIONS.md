# Bootstrap PM Agent V2 beta decisions

Date: 2026-09-09

This records the product decisions accepted for the current beta scope.

## Beta product principle

Bootstrap PM beta prioritizes one connected decision workflow:

Question → Context → Evidence → Decision → Artifact → Memory

Every new technical capability must materially improve that workflow. If it
does not, it is recorded as deferred rather than added speculatively.

## Retention

- Beta retention is manual-delete only.
- Records remain available until an authorized workspace owner deletes them.
- Automatic purge is intentionally disabled for beta.
- Any future automated retention job requires an explicit product decision covering periods, record classes, exceptions, warning/recovery behavior, and job failures.
- The data model must remain compatible with future workspace-level retention
  controls; no arbitrary expiry period is introduced for beta.

## Password protection

- The current Supabase Free-plan limitation for leaked-password protection is accepted for beta.
- Existing authentication and security behavior must not be weakened.
- Enabling the control remains a required pre-public-launch security task.

## Retrieval

- Do not add vector or embedding retrieval for beta.
- Keep the current deterministic lexical and reranking boundary extensible for
  future semantic, hybrid, metadata-filtered, or improved ranking strategies.
- Collect real search behavior before reconsidering semantic retrieval.

## Integrations

- GitHub is the first integration target.
- Beta integration scope is read-only repository context, issues, pull requests,
  and relevant development activity where available.
- No autonomous GitHub writes are allowed.
- Any future write requires explicit user confirmation.
- Slack, Jira/Linear, and other providers remain deferred and must use a
  provider-neutral integration boundary rather than GitHub-specific UX.

## Commercialization and enterprise

- Billing, subscriptions, pricing enforcement, paywalls, checkout, refunds,
  and payment infrastructure are deferred from beta.
- SAML, enterprise SSO, SCIM, advanced governance, complex admin roles,
  enterprise retention, and enterprise policy management are deferred from
  beta.
- Future workspace-level entitlements remain an architectural consideration,
  not an implemented beta capability.

## Deletion verification

- The owner-controlled preview-and-confirmation deletion flow is implemented.
- Destructive deletion UAT must run against a disposable workspace, never the active product workspace.
