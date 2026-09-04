import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

import { getSupabaseConfig } from "./src/lib/supabase/env";
import type { Database } from "./src/lib/supabase/database.types";

export async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request });

  try {
    const { url, publishableKey } = getSupabaseConfig();
    const supabase = createServerClient<Database>(url, publishableKey, {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
        },
      },
    });

    await supabase.auth.getUser();
  } catch {
    // Keep the preview shell available when Supabase is not configured.
  }

  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
};
