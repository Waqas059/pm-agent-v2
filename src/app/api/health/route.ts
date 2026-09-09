import { NextResponse } from "next/server";

export function GET() {
  const release = process.env.VERCEL_GIT_COMMIT_SHA?.trim().slice(0, 12) || "local";
  return NextResponse.json({ status: "ok", service: "pm-agent", release, checks: { app: "ok" } }, { headers: { "Cache-Control": "no-store" } });
}
