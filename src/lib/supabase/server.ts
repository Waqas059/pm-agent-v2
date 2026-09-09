import { createServerClient } from "@supabase/ssr";
import { cookies, headers } from "next/headers";

import { getSupabaseConfig } from "./env";
import type { Database } from "./database.types";

export async function createClient() {
  const cookieStore = await cookies();
  const requestHeaders = await headers();
  const authorization = requestHeaders.get("authorization");
  const { url, publishableKey } = getSupabaseConfig();

  return createServerClient<Database>(url, publishableKey, {
    global: authorization ? { headers: { Authorization: authorization } } : undefined,
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options);
          });
        } catch {
          // Server Components cannot write response cookies. Server Actions and
          // Route Handlers can use the same client and write them normally.
        }
      },
    },
  });
}

export async function getAuthenticatedUser(supabase: Awaited<ReturnType<typeof createClient>>) {
  const authorization = (await headers()).get("authorization");
  const token = authorization?.match(/^Bearer\s+(.+)$/i)?.[1];
  return token ? supabase.auth.getUser(token) : supabase.auth.getUser();
}

export function isSupabaseUnavailable(error: { message?: string } | null | undefined) {
  const message = error?.message?.toLowerCase() ?? "";
  return message.includes("fetch failed") || message.includes("network") || message.includes("failed to fetch");
}
