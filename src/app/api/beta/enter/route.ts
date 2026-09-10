import { NextResponse } from "next/server";
import { cookies } from "next/headers";

import { betaClaimCookieName, readBetaClaimToken } from "@/lib/beta/claim";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient, getAuthenticatedUser } from "@/lib/supabase/server";

const participantSelect = "id,full_name,preferred_name,email,status,request_allowance,auth_user_id";

function workspaceSlug(userId: string) {
  return `bootstrap-pm-${userId.replaceAll("-", "").slice(0, 24)}`;
}

async function ensureWorkspace(admin: ReturnType<typeof createAdminClient>, userId: string) {
  const existing = await admin.from("workspaces").select("id").eq("owner_id", userId).order("created_at", { ascending: true }).limit(1).maybeSingle();
  if (existing.error) throw existing.error;
  if (existing.data) return existing.data.id;

  const created = await admin.from("workspaces").insert({
    owner_id: userId,
    name: "Product workspace",
    slug: workspaceSlug(userId),
    description: "A private Bootstrap PM workspace.",
  }).select("id").single();
  if (!created.error && created.data) return created.data.id;

  const retry = await admin.from("workspaces").select("id").eq("owner_id", userId).order("created_at", { ascending: true }).limit(1).maybeSingle();
  if (retry.error || !retry.data) throw created.error || retry.error || Error("Workspace could not be created.");
  return retry.data.id;
}

export async function POST(request: Request) {
  if (request.body) {
    const raw = await request.text();
    if (new TextEncoder().encode(raw).byteLength > 2_048) return NextResponse.json({ error: "That workspace entry request is too large." }, { status: 413 });
  }

  try {
    const supabase = await createClient();
    const { data: userData, error: userError } = await getAuthenticatedUser(supabase);
    const user = userData.user;
    if (userError || !user) return NextResponse.json({ error: "We could not open your workspace. Please try again." }, { status: 401 });
    if (!user.is_anonymous) return NextResponse.json({ error: "This workspace is already connected to a secure account." }, { status: 403 });

    const claimCookie = (await cookies()).get(betaClaimCookieName)?.value;
    const claim = readBetaClaimToken(claimCookie);
    if (!claim) return NextResponse.json({ error: "Your workspace entry expired. Please start again." }, { status: 400 });

    const admin = createAdminClient();
    const existing = await admin.from("beta_participants").select(participantSelect).eq("id", claim.participantId).maybeSingle();
    if (existing.error || !existing.data) return NextResponse.json({ error: "Beta access is temporarily unavailable." }, { status: 503 });
    const participant = existing.data as unknown as { id: string; email: string; status: string; auth_user_id: string | null };
    if (participant.email.toLowerCase() !== claim.email.toLowerCase()) return NextResponse.json({ error: "Your workspace entry could not be verified." }, { status: 409 });
    if (["paused", "declined"].includes(participant.status)) return NextResponse.json({ error: "This beta profile is not currently available." }, { status: 403 });
    if (participant.auth_user_id && participant.auth_user_id !== user.id) return NextResponse.json({ error: "This beta profile is already connected to another workspace." }, { status: 409 });

    if (!participant.auth_user_id) {
      const linked = await admin.from("beta_participants").update({ auth_user_id: user.id }).eq("id", participant.id).is("auth_user_id", null).select("id").maybeSingle();
      if (linked.error) return NextResponse.json({ error: "Your workspace entry could not be completed." }, { status: 502 });
      if (!linked.data) return NextResponse.json({ error: "This beta profile is already connected to another workspace." }, { status: 409 });
    }

    await ensureWorkspace(admin, user.id);
    const activated = await admin.from("beta_participants").update({ status: "active" }).eq("id", participant.id).eq("auth_user_id", user.id);
    if (activated.error) return NextResponse.json({ error: "We could not open your workspace." }, { status: 502 });

    const response = NextResponse.json({ email: participant.email, created: false }, { status: 200 });
    response.cookies.delete(betaClaimCookieName);
    return response;
  } catch (error) {
    if (error instanceof Error && error.message.includes("service role")) return NextResponse.json({ error: "Bootstrap PM is temporarily unavailable." }, { status: 503 });
    return NextResponse.json({ error: "We could not open your workspace." }, { status: 502 });
  }
}
