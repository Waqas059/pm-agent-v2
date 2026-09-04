<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# PM Agent V2 — Codex project rules

## Source of truth

Read `docs/PM_AGENT_V2_MASTER_SPEC.md` before making product, architecture, or scope decisions. It supersedes the older planning documents and this repository's implementation must stay inside the currently approved task.

## Product principle

Build one excellent connected PM workflow before expanding feature breadth. PM Agent should know the user's product context, not behave like a collection of disconnected prompt wrappers.

## MVP stack

- Next.js App Router with TypeScript
- Tailwind CSS
- Supabase for Postgres, Auth, and Storage when introduced in a later task
- OpenAI Responses API when introduced in a later task
- Vercel as the initial web deployment target

## Architecture guardrails

- Use one workflow orchestration layer; do not create ten independent agent classes.
- Use structured, schema-backed AI outputs for model-backed features.
- Never parse model responses using fixed string offsets.
- Keep provider and model names configurable.
- Never fabricate confidence, quality, completeness, sources, customer quotes, surveys, or metrics.
- Live research must be grounded in retrieved sources with citations.
- Code should calculate business metrics, scoring, and statistical values; AI may interpret those results.
- Every schema change requires a migration.
- Prefer a simple MVP architecture over premature infrastructure.
- Never commit API keys or other secrets.

## Development rules

- Work on one scoped task at a time.
- Read the master spec and relevant existing code before changing architecture.
- Run linting, type checking, tests, and a production build before declaring completion.
- Do not introduce placeholder production logic.
- Report assumptions and blockers instead of silently inventing behavior.
- Do not expand scope without explicit approval.

## T01, T02, and T03 boundaries

T01 is repository bootstrap only: Next.js TypeScript App Router, Tailwind, ESLint, a test runner with a basic smoke test, `.env.example`, `.gitignore`, README, and the initial static application shell.

For T01 specifically:

- Keep the shell useful and accessible without pretending that future integrations already work.

T02 is the Supabase foundation only: official client packages, browser/server client helpers, safe environment validation, and documentation.

For T02 specifically:

- Do not add authentication UI or flows, database schema, migrations, RLS policies, persistence, file storage, OpenAI, or PM workflows.
- Never use a Supabase secret or service-role key in browser code or a `NEXT_PUBLIC_*` variable.

T03 is the core schema and migrations task only: version-controlled SQL for the foundational workspace, membership, and product-context tables, plus matching TypeScript database types.

For T03 specifically:

- Do not add authentication UI or flows, RLS policies, storage buckets, OpenAI, or PM workflows.
- Do not begin T04 or any later task in the same change.
- Every future schema change must be a new migration; do not edit an applied migration.
- Treat the schema as unsafe for direct client use until T04 adds and verifies RLS policies.

T04 is authorization and Row Level Security for the existing core schema only.

For T04 specifically:

- Keep the existing core tables and migration immutable; add a new migration for every security change.
- Enable RLS on every exposed core table and explicitly grant only authenticated client operations.
- Keep anonymous access denied. Keep service-role credentials server-side only; never place them in browser code or a `NEXT_PUBLIC_*` variable.
- Use narrowly scoped policies: workspace owners manage workspaces and memberships; members can read workspace data; viewers are read-only; owners and members can edit context.
- Keep membership checks in private security-definer helpers with a fixed search path to avoid recursive RLS policy evaluation.
- Automatically create the owner membership when a workspace is created, and prevent changing membership or context workspace boundaries through updates.
- Do not add authentication UI, storage buckets, OpenAI integration, or PM workflows.
- Do not begin T05 or any later task in the same change.

T05 is the Product Workspace UI only.

For T05 specifically:

- Build the responsive overview dashboard and workspace navigation on top of the existing App Router foundation.
- Use honest preview and empty-state copy; do not fabricate saved context, customer evidence, activity, or business metrics.
- Keep future actions visibly unavailable until their approved task: context editing belongs to T06, uploads to T07, and workflows to T11–T13.
- Keep the UI presentational unless a small client component is necessary for local interface state; do not connect persistence yet.
- Do not add authentication UI, database writes, file uploads, OpenAI integration, or PM workflow execution.
- Do not begin T06 or any later task in the same change.

T06 is Product Context Management only.

For T06 specifically:

- Use the existing typed Supabase browser client and T04 RLS policies for context persistence.
- Support manual create, read, update, delete, and category filtering for `context_items`.
- Preserve `source_type = user_input` and record lightweight provenance; imported and generated sources belong to later tasks.
- Show explicit loading, signed-out, missing-configuration, no-workspace, empty, and error states. Never imply that a save succeeded unless Supabase confirms it.
- Do not add authentication UI, file uploads, document extraction, evidence retrieval, OpenAI integration, or PM workflow execution.
- Do not begin T07 or any later task in the same change.

T07 is File Upload and Document Handling only.

For T07 specifically:

- Keep uploaded files in a private, workspace-scoped Storage bucket and metadata in a versioned database migration.
- Enforce file type and size limits in both the UI and Storage/database constraints; never rely on the UI alone for security.
- Scope Storage and metadata access through the existing authenticated workspace membership helpers and RLS policies.
- Keep upload paths workspace-scoped and user-scoped. Do not use `upsert` for new uploads, and never expose a service-role key in browser code.
- Record original filename, MIME type, size, uploader, storage path, and upload status without extracting or interpreting document contents yet.
- Show explicit signed-out, missing-configuration, no-workspace, empty, and error states. Never imply an upload succeeded unless both Storage and metadata persistence succeed.
- Do not add OCR, document extraction, evidence retrieval, citations, OpenAI integration, or PM workflow execution.
- Do not begin T08 or any later task in the same change.
