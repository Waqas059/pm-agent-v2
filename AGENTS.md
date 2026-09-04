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
