import { NextResponse } from "next/server";

export function GET() {
  return NextResponse.json({ status: "ok", service: "pm-agent", checks: { app: "ok" } }, { headers: { "Cache-Control": "no-store" } });
}
