const baseUrl = (process.env.PM_PRODUCTION_URL || "https://pm-agent-v2.vercel.app").replace(/\/$/, "");
const supabaseUrl = process.env.UAT_SUPABASE_URL?.replace(/\/$/, "");
const publishableKey = process.env.UAT_SUPABASE_PUBLISHABLE_KEY;
const email = process.env.UAT_EMAIL;
const password = process.env.UAT_PASSWORD;

const required = { UAT_SUPABASE_URL: supabaseUrl, UAT_SUPABASE_PUBLISHABLE_KEY: publishableKey, UAT_EMAIL: email, UAT_PASSWORD: password };
const missing = Object.entries(required).filter(([, value]) => !value).map(([name]) => name);
if (missing.length) {
  console.error(`Authenticated smoke requires environment variables: ${missing.join(", ")}`);
  process.exit(2);
}

async function signIn() {
  const response = await fetch(`${supabaseUrl}/auth/v1/token?grant_type=password`, {
    method: "POST",
    headers: { apikey: publishableKey, "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  if (!response.ok) throw new Error(`Supabase sign-in failed with status ${response.status}.`);
  const payload = await response.json();
  if (typeof payload.access_token !== "string" || !payload.access_token) throw new Error("Supabase sign-in did not return an access token.");
  return payload.access_token;
}

async function check(name, path, token, validate) {
  const response = await fetch(`${baseUrl}${path}`, {
    redirect: "manual",
    headers: { Authorization: `Bearer ${token}`, "User-Agent": "bootstrap-pm-authenticated-smoke" },
  });
  await validate(response);
  console.log(`${name}: PASS`);
}

const token = await signIn();
await check("authenticated health endpoint", "/api/health", token, async (response) => {
  if (!response.ok) throw new Error(`expected 2xx, received ${response.status}`);
});
await check("authenticated workspace search", "/api/search?q=pricing", token, async (response) => {
  if (!response.ok) throw new Error(`expected 2xx, received ${response.status}`);
  const payload = await response.json();
  if (!Array.isArray(payload.results)) throw new Error("search payload did not contain results");
});
await check("authenticated artifact library", "/api/artifacts", token, async (response) => {
  if (!response.ok) throw new Error(`expected 2xx, received ${response.status}`);
  const payload = await response.json();
  if (!Array.isArray(payload.artifacts)) throw new Error("artifact payload did not contain artifacts");
});
await check("authenticated usage endpoint", "/api/usage", token, async (response) => {
  if (!response.ok) throw new Error(`expected 2xx, received ${response.status}`);
  const payload = await response.json();
  if (!Number.isInteger(payload.used) || !Number.isInteger(payload.limit)) throw new Error("usage payload did not contain integer limits");
});
await check("authenticated analytics endpoint", "/api/analytics", token, async (response) => {
  if (!response.ok) throw new Error(`expected 2xx, received ${response.status}`);
  const payload = await response.json();
  if (!payload.workflowConversion || !payload.outcomeBaseline) throw new Error("analytics payload did not contain conversion and outcome baselines");
});
await check("read-only deletion preview", "/api/workspace/delete", token, async (response) => {
  if (!response.ok) throw new Error(`expected 2xx, received ${response.status}`);
  const payload = await response.json();
  if (typeof payload.confirmationText !== "string" || !Array.isArray(payload.recentOperations)) throw new Error("deletion preview payload was incomplete");
});

console.log(`Authenticated read-only smoke checks passed for ${baseUrl}`);
