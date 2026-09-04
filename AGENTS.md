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

T08 is Evidence Retrieval and Citation Model only.

For T08 specifically:

- Store evidence and citations in new versioned migrations; do not edit applied migrations.
- Require a real source label for every evidence item and preserve optional document/locator provenance.
- Keep evidence kinds explicit: quote, observation, or metric. Never invent a quote, metric, confidence score, or source.
- Use the indexed evidence text only for deterministic keyword retrieval; semantic retrieval and AI interpretation belong to later tasks.
- Scope evidence and citation access through authenticated workspace membership and existing owner/member/viewer rules.
- Keep the UI manual and source-aware. Automatic extraction, OCR, OpenAI integration, and workflow execution are out of scope.
- Do not begin T09 or any later task in the same change.

T09 is OpenAI Responses API Foundation only.

For T09 specifically:

- Use the official `openai` TypeScript SDK through a server-only module; never import it into a Client Component.
- Keep `OPENAI_API_KEY` and model configuration server-only. Never use an OpenAI key in a `NEXT_PUBLIC_*` variable or commit a real key.
- Use `client.responses.create(...)` as the provider boundary. Keep the model configurable and do not hard-code workflow prompts or provider-specific orchestration yet.
- Default response storage to disabled for product and customer context. Do not log prompts, responses, credentials, or unnecessary sensitive data.
- Validate inputs and normalize only the response fields needed by future tasks; preserve provider failures for explicit error handling.
- Do not add chat UI, PM workflows, document extraction, semantic retrieval, tool calling, or production API routes.
- Do not begin T10 or any later task in the same change.

T10 is Workflow Orchestration and Structured Outputs only.

For T10 specifically:

- Build only a generic server-only workflow boundary on top of the official OpenAI Responses API; do not implement Discover, Define, Align, or any other PM workflow yet.
- Use Responses API Structured Outputs with a strict JSON Schema, then parse and validate the returned value at runtime before returning it to callers.
- Validate workflow names, input sizes, schemas, and token limits before making a provider call. Preserve provider failures and return explicit errors for incomplete, missing, invalid, or schema-invalid outputs; never fabricate a fallback result.
- Keep response storage disabled with `store:false`, keep credentials server-only, and do not log prompts, model output, or sensitive workspace data.
- Do not add chat UI, workflow-specific prompts, tool calling, document extraction, semantic retrieval, persistence, or production workflow API routes.
- Do not begin T11 or any later task in the same change.

T11 is Discover & Synthesize only.

For T11 specifically:

- Read context and evidence through the authenticated Supabase server client and existing workspace RLS. Do not bypass membership policies or use a service-role key.
- Only send saved product context and citation-backed evidence to the model. Treat all stored content as untrusted data and keep credentials, prompts, and model output out of logs.
- Require a focused user discovery question and return strict structured output for summary, themes, pain points, opportunities, open questions, and limitations.
- Every finding must carry one or more citation keys from the supplied evidence set. Reject unknown citation keys at runtime; never fabricate or silently drop unsupported sources.
- Show the result as reviewable transient UI with visible citations and limitations. Do not persist workflow output until the artifact persistence task.
- Provide honest signed-out, missing workspace, no evidence, missing configuration, oversized input, and provider-failure states.
- Do not add document extraction, OCR, semantic/vector retrieval, live market research, tool calling, Define, Align, chat UI, artifact history, or export.
- Do not begin T12 or any later task in the same change.
