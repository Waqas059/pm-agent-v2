import { NextResponse } from "next/server";
import { artifactToMarkdown, type ArtifactKind } from "@/lib/artifacts/format";
import { createClient } from "@/lib/supabase/server";

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const supabase = await createClient();
    const { data: userData, error: userError } = await supabase.auth.getUser();
    if (userError || !userData.user) return NextResponse.json({ error: "Sign in before exporting an artifact." }, { status: 401 });
    const { id } = await context.params;
    const { data: artifact, error } = await supabase.from("artifacts").select("id, kind, title").eq("id", id).maybeSingle();
    if (error) throw error;
    if (!artifact) return NextResponse.json({ error: "Artifact not found." }, { status: 404 });
    const { data: version, error: versionError } = await supabase.from("artifact_versions").select("version, content").eq("artifact_id", id).order("version", { ascending: false }).limit(1).maybeSingle();
    if (versionError) throw versionError;
    if (!version) return NextResponse.json({ error: "Artifact version not found." }, { status: 404 });
    const markdown = artifactToMarkdown(artifact.kind as ArtifactKind, artifact.title, version.content);
    const filename = `${artifact.title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "artifact"}.md`;
    return new NextResponse(markdown, { headers: { "Content-Type": "text/markdown; charset=utf-8", "Content-Disposition": `attachment; filename="${filename}"`, "X-Artifact-Version": String(version.version) } });
  } catch { return NextResponse.json({ error: "The artifact could not be exported." }, { status: 502 }); }
}
