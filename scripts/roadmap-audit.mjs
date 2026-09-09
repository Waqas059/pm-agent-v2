import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const checks = [];

async function text(file) {
  return readFile(path.join(root, file), "utf8");
}

function pass(name, detail) {
  checks.push({ name, detail });
}

function fail(name, detail) {
  throw new Error(`${name}: ${detail}`);
}

async function requireFile(file) {
  try {
    await text(file);
    pass(`file ${file}`, "present");
  } catch {
    fail(`file ${file}`, "missing");
  }
}

async function requireText(file, fragments) {
  const contents = await text(file);
  const missing = fragments.filter((fragment) => !contents.includes(fragment));
  if (missing.length) fail(`content ${file}`, `missing ${missing.join(", ")}`);
  pass(`content ${file}`, `${fragments.length} required markers present`);
}

const packageJson = JSON.parse(await text("package.json"));
const requiredScripts = ["lint", "typecheck", "test", "evals", "build", "smoke:production", "smoke:authenticated", "audit:roadmap"];
const missingScripts = requiredScripts.filter((script) => !packageJson.scripts?.[script]);
if (missingScripts.length) fail("package scripts", `missing ${missingScripts.join(", ")}`);
pass("package scripts", "lint, typecheck, tests, evals, build, smoke, and audit are defined");

for (const file of [
  "src/app/api/health/route.ts",
  "src/app/api/search/route.ts",
  "src/app/api/artifacts/route.ts",
  "src/app/api/usage/route.ts",
  "src/app/api/workspace/delete/route.ts",
  "src/app/api/integrations/github/route.ts",
  "src/app/api/research/market/route.ts",
  "src/lib/supabase/auth-fetch.ts",
  "src/lib/analytics/outcomes.ts",
  "src/lib/analytics/outcomes.test.ts",
  "src/lib/retention/policy.ts",
  "src/lib/integrations.ts",
  "src/lib/integrations.consent.test.ts",
  "src/lib/workflows/handoff.ts",
  "src/lib/workflows/handoff.test.ts",
  "src/lib/evaluation/retrieval.test.ts",
  "scripts/authenticated-smoke.mjs",
  ".github/workflows/quality-gate.yml",
  ".github/workflows/production-smoke.yml",
  "docs/PM_AGENT_V2_MASTER_SPEC.md",
  "docs/ROADMAP_EXECUTION_STATUS.md",
  "docs/SECURITY_REVIEW.md",
]) await requireFile(file);

for (const migration of [
  "supabase/migrations/20260908010000_product_analytics.sql",
  "supabase/migrations/20260908020000_ocr_image_types.sql",
  "supabase/migrations/20260908030000_product_outcome_events.sql",
  "supabase/migrations/20260908040000_product_reasoning_events.sql",
  "supabase/migrations/20260908050000_provider_quality_events.sql",
  "supabase/migrations/20260908060000_define_artifact_align_handoff.sql",
  "supabase/migrations/20260908070000_reasoning_memory_search.sql",
]) await requireFile(migration);

await requireText("src/app/api/health/route.ts", ["release", "VERCEL_GIT_COMMIT_SHA"]);
await requireText("scripts/production-smoke.mjs", ["checkProtectedApi", "/api/search?q=pricing", "/api/workspace/delete"]);
await requireText(".github/workflows/quality-gate.yml", ["pull_request:", "npm run audit:roadmap", "npm run build"]);
await requireText(".github/workflows/production-smoke.yml", ["workflow_dispatch:", "PM_REQUIRE_RELEASE_MARKER", "production-smoke.mjs"]);
await requireText("docs/ROADMAP_EXECUTION_STATUS.md", ["Explicit completion gates", "Production auth/workflow UAT"]);
await requireText("docs/SECURITY_REVIEW.md", ["store: false", "error class"]);

const envExample = await text(".env.example");
const openAiValue = envExample.match(/^OPENAI_API_KEY=(.*)$/mi)?.[1]?.trim() ?? "";
if (openAiValue && !/your|replace|placeholder|example|<|\.\.\./i.test(openAiValue)) fail(".env.example", "appears to contain a non-placeholder OpenAI key");
pass("environment template", "no non-placeholder OpenAI key detected");

console.log(`Roadmap audit passed: ${checks.length} checks`);
for (const check of checks) console.log(`PASS ${check.name} — ${check.detail}`);
