"use client";

import { useState } from "react";

import { createClient } from "@/lib/supabase/client";

const controls = [
  { label: "Credentials", detail: "Provider keys stay server-side and are not exposed through browser variables.", status: "Protected" },
  { label: "Workspace access", detail: "Supabase authentication and workspace-scoped row-level policies protect durable records.", status: "Protected" },
  { label: "Uploaded files", detail: "Documents use private, workspace-scoped storage and member-aware access rules.", status: "Protected" },
  { label: "AI responses", detail: "Responses API calls use store:false; prompts and model output are not logged by the app.", status: "Protected" },
];

type DeletionPreview = {
  workspace: { id: string; name: string };
  counts: Record<string, number>;
  storageObjectCount: number;
  confirmationText: string;
};

export default function PrivacyPanel() {
  const [preview, setPreview] = useState<DeletionPreview | null>(null);
  const [confirmation, setConfirmation] = useState("");
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  async function loadDeletionPreview() {
    setIsLoading(true);
    setMessage("");
    try {
      const response = await fetch("/api/workspace/delete");
      const payload = await response.json() as DeletionPreview & { error?: string };
      if (!response.ok) throw new Error(payload.error || "The deletion preview could not be loaded.");
      setPreview(payload);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "The deletion preview could not be loaded.");
    } finally {
      setIsLoading(false);
    }
  }

  async function deleteWorkspace() {
    if (!preview || confirmation !== preview.confirmationText) return;
    setIsLoading(true);
    setMessage("");
    try {
      const response = await fetch("/api/workspace/delete", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ workspaceId: preview.workspace.id, confirmation }),
      });
      const payload = await response.json() as { error?: string };
      if (!response.ok) throw new Error(payload.error || "Workspace deletion did not complete.");
      await createClient().auth.signOut();
      window.location.reload();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Workspace deletion did not complete.");
      setIsLoading(false);
    }
  }

  return <div>
    <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start"><div><p className="text-xs font-bold uppercase tracking-[0.18em] text-[#4d8c65]">PRIVACY & CONTROL</p><h2 id="privacy-heading" className="mt-2 text-2xl font-semibold tracking-[-0.04em] text-[#192235]">Make data controls visible</h2><p className="mt-2 max-w-2xl text-sm leading-6 text-[#68748a]">Review the protections currently applied to this workspace. Deletion stays deliberate and scoped; this screen never removes data automatically.</p></div><span className="inline-flex w-fit items-center gap-2 rounded-full border border-[#cfe5d6] bg-[#f5fbf6] px-3 py-2 text-xs font-semibold text-[#4d8c65]"><span className="h-2 w-2 rounded-full bg-[#53b67b]" />Controls active</span></div>
    <div className="mt-6 grid gap-3 md:grid-cols-2">{controls.map((control) => <article key={control.label} className="rounded-xl border border-[#e3e7ee] bg-white p-4"><div className="flex items-start justify-between gap-3"><h3 className="text-sm font-semibold text-[#192235]">{control.label}</h3><span className="rounded-full bg-[#e4f3e8] px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.1em] text-[#4d8c65]">{control.status}</span></div><p className="mt-2 text-xs leading-5 text-[#68748a]">{control.detail}</p></article>)}</div>
    <div className="mt-4 rounded-xl border border-[#e3e7ee] bg-[#fafbfc] p-4 sm:p-5"><p className="text-xs font-bold uppercase tracking-[0.14em] text-[#8d98a9]">Workspace data controls</p><div className="mt-4 grid gap-3 sm:grid-cols-3"><a href="#context" className="rounded-lg border border-[#d8dee8] bg-white p-3 text-sm font-semibold text-[#526075] hover:border-[#bfc8d6]">Review or delete context<span className="mt-1 block text-xs font-normal text-[#8d98a9]">Manual records</span></a><a href="#documents" className="rounded-lg border border-[#d8dee8] bg-white p-3 text-sm font-semibold text-[#526075] hover:border-[#bfc8d6]">Review or delete files<span className="mt-1 block text-xs font-normal text-[#8d98a9]">Private documents</span></a><a href="#evidence" className="rounded-lg border border-[#d8dee8] bg-white p-3 text-sm font-semibold text-[#526075] hover:border-[#bfc8d6]">Review or delete evidence<span className="mt-1 block text-xs font-normal text-[#8d98a9]">Source-backed items</span></a></div><div className="mt-5 rounded-lg border border-[#f0d9cf] bg-[#fffaf7] p-4"><div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start"><div><h3 className="text-sm font-semibold text-[#192235]">Delete this workspace</h3><p className="mt-1 text-xs leading-5 text-[#8d98a9]">Owner-only, permanent deletion. Review the preview and type the exact confirmation text before anything is removed.</p></div><button type="button" onClick={() => void loadDeletionPreview()} disabled={isLoading} className="rounded-lg border border-[#e2b9aa] bg-white px-3 py-2 text-xs font-semibold text-[#a04c43] disabled:cursor-wait disabled:opacity-60">{isLoading && !preview ? "Loading…" : "Review deletion"}</button></div>{preview ? <div className="mt-4 space-y-3"><p className="text-xs text-[#526075]">This will remove <strong>{Object.values(preview.counts).reduce((total, count) => total + count, 0)} database records</strong> and <strong>{preview.storageObjectCount} private files</strong> from <strong>{preview.workspace.name}</strong>.</p><label className="grid gap-2 text-xs font-semibold text-[#526075]" htmlFor="workspace-delete-confirmation">Type <code className="rounded bg-white px-1.5 py-0.5 font-mono text-[#a04c43]">{preview.confirmationText}</code> to confirm<input id="workspace-delete-confirmation" value={confirmation} onChange={(event) => setConfirmation(event.target.value)} autoComplete="off" className="rounded-lg border border-[#d8dee8] bg-white px-3 py-2.5 text-sm font-normal text-[#192235] outline-none focus:border-[#a04c43] focus:ring-2 focus:ring-[#f0d4d0]" /></label><div className="flex flex-wrap gap-3"><button type="button" onClick={() => void deleteWorkspace()} disabled={isLoading || confirmation !== preview.confirmationText} className="rounded-lg bg-[#a04c43] px-3 py-2.5 text-xs font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50">{isLoading ? "Deleting…" : "Permanently delete workspace"}</button><button type="button" onClick={() => { setPreview(null); setConfirmation(""); setMessage(""); }} disabled={isLoading} className="rounded-lg border border-[#d8dee8] bg-white px-3 py-2.5 text-xs font-semibold text-[#526075]">Cancel</button></div></div> : null}{message ? <p className="mt-3 text-xs leading-5 text-[#a04c43]" role="alert">{message}</p> : null}</div><p className="mt-4 text-xs leading-5 text-[#8d98a9]">Automatic retention remains disabled. Records are retained by default until an authorized user deletes them.</p></div>
  </div>;
}
