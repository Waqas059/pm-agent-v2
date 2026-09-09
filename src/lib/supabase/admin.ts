import "server-only";

import { createClient } from "@supabase/supabase-js";

import { getSupabaseConfig } from "./env";
import type { Database } from "./database.types";

export function createAdminClient() {
  const { url } = getSupabaseConfig();
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  if (!serviceRoleKey) throw new Error("Supabase service role is not configured.");
  return createClient<Database>(url, serviceRoleKey, { auth: { autoRefreshToken: false, persistSession: false } });
}
