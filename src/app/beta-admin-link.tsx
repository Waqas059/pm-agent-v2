"use client";

import { useEffect, useState } from "react";

import UiIcon from "./ui-icons";
import { authenticatedFetch } from "@/lib/supabase/auth-fetch";

export default function BetaAdminLink() {
  const [isAdmin, setIsAdmin] = useState(false);
  useEffect(() => { const timer = window.setTimeout(() => { void authenticatedFetch("/api/admin/beta/access", { cache: "no-store" }).then(async (response) => response.ok ? await response.json() as { isAdmin?: boolean } : null).then((payload) => setIsAdmin(payload?.isAdmin === true)).catch(() => undefined); }, 0); return () => window.clearTimeout(timer); }, []);
  if (!isAdmin) return null;
  return <a href="/admin/beta" className="beta-admin-settings-link"><span><UiIcon name="activity" size={16} /></span><strong>Beta operations</strong><small>Manage participants, allowances, and feedback.</small><UiIcon name="chevron-right" size={15} /></a>;
}
