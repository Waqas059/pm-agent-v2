import { createClient } from "./client";

async function clearInvalidSession(supabase: ReturnType<typeof createClient>) {
  try {
    await supabase.auth.signOut({ scope: "local" });
  } catch {
    // The browser event still lets the UI recover if local sign-out cannot reach Supabase.
  }
  if (typeof window !== "undefined") window.dispatchEvent(new Event("pm-auth-invalid"));
}

/**
 * Send a same-origin request with the current browser session attached.
 *
 * Supabase SSR normally propagates the session through cookies. The bearer
 * header is an explicit fallback for local preview hosts and other setups
 * where the browser session is available but the request cookie has not yet
 * been refreshed by the Next.js proxy.
 */
export async function authenticatedFetch(input: RequestInfo | URL, init: RequestInit = {}) {
  const supabase = createClient();
  const headers = new Headers(init.headers);
  const hasExplicitAuthorization = headers.has("Authorization");

  async function requestWithSession(accessToken?: string) {
    const requestHeaders = new Headers(headers);
    if (!hasExplicitAuthorization) requestHeaders.delete("Authorization");
    if (!hasExplicitAuthorization && accessToken) {
      requestHeaders.set("Authorization", `Bearer ${accessToken}`);
    }
    return fetch(input, { ...init, headers: requestHeaders });
  }

  async function observeBetaUsage(response: Response) {
    if (typeof window === "undefined") return response;
    const contentType = response.headers.get("content-type") ?? "";
    if (!contentType.includes("application/json")) return response;
    try {
      const payload = await response.clone().json() as { betaUsage?: unknown };
      if (payload.betaUsage && typeof payload.betaUsage === "object") window.dispatchEvent(new CustomEvent("pm-agent:beta-usage", { detail: payload.betaUsage }));
    } catch {
      // Non-JSON or incomplete responses do not affect the original request.
    }
    return response;
  }

  if (!hasExplicitAuthorization) {
    const { data } = await supabase.auth.getSession();
    if (data.session?.access_token) {
      headers.set("Authorization", `Bearer ${data.session.access_token}`);
    }
  }

  const response = await requestWithSession(headers.get("Authorization")?.replace(/^Bearer\s+/i, ""));
  if (hasExplicitAuthorization || response.status !== 401) return observeBetaUsage(response);

  const { data: refreshed } = await supabase.auth.refreshSession();
  if (!refreshed.session?.access_token) {
    await clearInvalidSession(supabase);
    return observeBetaUsage(response);
  }
  const retriedResponse = await requestWithSession(refreshed.session.access_token);
  if (retriedResponse.status === 401) await clearInvalidSession(supabase);
  return observeBetaUsage(retriedResponse);
}
