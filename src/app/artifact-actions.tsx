"use client";

import { useState } from "react";

type Props = { kind: "product_brief" | "communication_message"; sourceWorkflow: "define_specify" | "align_communicate"; title: string; content: unknown };

export default function ArtifactActions({ kind, sourceWorkflow, title, content }: Props) {
  const [artifactId, setArtifactId] = useState<string | null>(null);
  const [version, setVersion] = useState(0);
  const [message, setMessage] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  async function save() {
    setIsSaving(true); setMessage("");
    try {
      const endpoint = artifactId ? `/api/artifacts/${artifactId}/versions` : "/api/artifacts";
      const body = artifactId ? { content } : { kind, sourceWorkflow, title, content };
      const response = await fetch(endpoint, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      const payload = await response.json() as { artifact?: { id: string; version: { version: number } }; version?: { version: number }; error?: string };
      if (!response.ok) throw new Error(payload.error || "The artifact could not be saved.");
      if (payload.artifact) { setArtifactId(payload.artifact.id); setVersion(payload.artifact.version.version); }
      if (payload.version) setVersion(payload.version.version);
      setMessage("Saved to workspace history.");
      window.dispatchEvent(new Event("artifacts:changed"));
    } catch (error) { setMessage(error instanceof Error ? error.message : "The artifact could not be saved."); } finally { setIsSaving(false); }
  }

  return <div className="mt-4 flex flex-wrap items-center gap-3"><button type="button" onClick={save} disabled={isSaving} className="rounded-lg border border-[#cdd6f6] bg-white px-3 py-2 text-xs font-semibold text-[#5269d8] hover:bg-[#f8f9ff] disabled:cursor-not-allowed disabled:opacity-50">{isSaving ? "Saving…" : artifactId ? `Save new version${version ? ` · v${version + 1}` : ""}` : "Save artifact"}</button>{artifactId && <a className="rounded-lg border border-[#d8dee8] bg-white px-3 py-2 text-xs font-semibold text-[#68748a] hover:bg-[#f5f7fa]" href={`/api/artifacts/${artifactId}/export`}>Export Markdown</a>}{message && <span role="status" className="text-xs text-[#68748a]">{message}</span>}</div>;
}
