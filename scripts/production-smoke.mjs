const baseUrl = (process.env.PM_PRODUCTION_URL || "https://pm-agent-v2.vercel.app").replace(/\/$/, "");
const expectedOrigin = new URL(baseUrl).origin;
const requireReleaseMarker = process.env.PM_REQUIRE_RELEASE_MARKER === "true";

function isSafeOrigin(origin) {
  if (origin === expectedOrigin) return true;
  const expected = new URL(expectedOrigin);
  const actual = new URL(origin);
  return expected.protocol === "http:" && actual.protocol === "http:" && expected.port === actual.port && ["localhost", "127.0.0.1"].includes(expected.hostname) && ["localhost", "127.0.0.1"].includes(actual.hostname);
}

async function check(name, path, validate) {
  const response = await fetch(`${baseUrl}${path}`, {
    redirect: "manual",
    headers: { "User-Agent": "bootstrap-pm-production-smoke" },
  });
  const result = await validate(response);
  console.log(`${name}: PASS${result ? ` — ${result}` : ""}`);
}

async function checkProtectedApi(name, path) {
  await check(name, path, async (response) => {
    if (response.status !== 401) throw new Error(`expected 401, received ${response.status}`);
    const body = await response.text();
    if (/supabase|provider|service[- ]?role|stack/i.test(body)) throw new Error("protected API leaked provider or implementation details");
    return "unauthenticated access denied without sensitive details";
  });
}

await check("health endpoint", "/api/health", async (response) => {
  if (!response.ok) throw new Error(`expected 2xx, received ${response.status}`);
  const payload = await response.json();
  if (payload.status !== "ok" || payload.service !== "pm-agent") throw new Error("unexpected health payload");
  const hasReleaseMarker = typeof payload.release === "string" && payload.release.length > 0;
  if (requireReleaseMarker && !hasReleaseMarker) throw new Error("deployed health response has no release marker");
  return hasReleaseMarker ? `200 with release ${payload.release}` : "200; legacy deployment has no release marker";
});

await check("application shell", "/", async (response) => {
  if (!response.ok) throw new Error(`expected 2xx, received ${response.status}`);
  const html = await response.text();
  if (!html.includes("PM Agent") && !html.includes("PM Kit")) throw new Error("product shell marker not found");
  return "public shell rendered";
});

await checkProtectedApi("protected workspace search", "/api/search?q=pricing");
await checkProtectedApi("protected artifact library", "/api/artifacts");
await checkProtectedApi("protected usage endpoint", "/api/usage");
await checkProtectedApi("protected deletion preview", "/api/workspace/delete");

await check("invalid auth callback", "/auth/callback?code=invalid-production-smoke", async (response) => {
  if (![301, 302, 303, 307, 308].includes(response.status)) throw new Error(`expected redirect, received ${response.status}`);
  const location = response.headers.get("location") || "";
  const redirect = new URL(location, baseUrl);
  if (!isSafeOrigin(redirect.origin) || redirect.searchParams.get("auth_error") !== "confirmation") throw new Error("callback did not return a safe same-origin auth error");
  if (location.toLowerCase().includes("supabase") || location.toLowerCase().includes("provider")) throw new Error("provider details leaked into callback redirect");
  return "safe same-origin confirmation error";
});

console.log(`Production smoke checks passed for ${baseUrl}`);
