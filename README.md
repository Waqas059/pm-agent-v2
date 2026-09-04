# PM Agent V2

PM Agent is an AI product workspace designed to help Product Managers turn customer evidence, product context, and team decisions into clear, useful artifacts.

T01 established the production-ready web foundation and a clean product shell. T02 added the Supabase client foundation, T03 added the version-controlled core schema migration, T04 added authorization and Row Level Security, T05 added the Product Workspace UI, T06 added Product Context Management, T07 added File Upload and Document Handling, T08 added Evidence Retrieval and the Citation Model, T09 added the OpenAI Responses API foundation, T10 added the generic workflow orchestration and structured-output boundary, T11–T23 added the connected PM workspace capabilities, and the latest stage adds LangChain Core orchestration around the OpenAI Responses runtime.

## Prerequisites

- Node.js 24 or newer (Node.js 20.9+ is the minimum supported by the current Next.js release)
- npm 11 or newer
- Supabase CLI for applying migrations

## Installation

```bash
npm install
```

Copy the environment template and add the values from your Supabase project:

```bash
cp .env.example .env.local
```

On Windows PowerShell, use `Copy-Item .env.example .env.local` instead.

T01 does not require database, authentication, or AI-provider credentials.

T02 requires only the Supabase project URL and publishable key. In the Supabase Dashboard, open the project’s **Connect** panel and copy those values into `.env.local`. Never expose a secret or service-role key in a `NEXT_PUBLIC_*` variable.

T09 and T10 require an OpenAI API key only on the server. Add `OPENAI_API_KEY` and a supported `OPENAI_MODEL` to `.env.local`; never expose the key through a `NEXT_PUBLIC_*` variable or browser code. Document extraction does not require an AI provider.

## Database migrations

Schema changes live in `supabase/migrations/` and should be applied through the Supabase CLI. Link the local repository to your Supabase project, then run:

```bash
supabase db push
```

T03 creates the `workspaces`, `workspace_members`, and `context_items` tables. T04 enables RLS and grants authenticated users only the operations allowed by the workspace role policies. Anonymous requests have no access path. Do not use these tables from a deployed client until the app has a real authenticated session.

The document extraction migration adds workspace-scoped `document_extractions` records. PDF, DOCX, Markdown, text, CSV, and JSON files can be extracted into searchable text with line locators. Legacy binary `.doc` files must be converted to `.docx` or PDF first. See [`docs/DOCUMENT_EXTRACTION.md`](docs/DOCUMENT_EXTRACTION.md).

## Local development

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in a browser.

## Quality checks

```bash
npm run lint
npm run typecheck
npm test
npm run build
```

Use `npm run test:watch` for an interactive test session.

## Project structure

- `src/app/` — Next.js App Router routes and global styles
- `src/lib/supabase/` — browser/server clients and environment validation
- `src/lib/langchain/` — shared LangChain Core orchestration pipeline and tests
- `src/lib/documents/` — server-only document extraction and source locators
- `src/lib/openai/` — server-only OpenAI Responses runtime and structured-output boundary
- `docs/PM_AGENT_V2_MASTER_SPEC.md` — authoritative product and technical source of truth
- `AGENTS.md` — persistent instructions for Codex and future contributors
- `vitest.config.mts` — test runner configuration

## Orchestration boundary

LangChain Core provides the reusable `RunnableSequence` validation and invocation pipeline for Discover, Define, and Align. The final model call remains the official OpenAI Responses API with strict JSON Schema output, `store: false`, and server-only credentials. LangChain does not expose keys to the browser and does not add an autonomous agent swarm or unsupported provider routing.
