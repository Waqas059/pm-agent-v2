"use client";

import { useCallback, useEffect, useState } from "react";
import type { FormEvent } from "react";

import { createClient } from "@/lib/supabase/client";
import type { Database } from "@/lib/supabase/database.types";

type EvidenceItem = Database["public"]["Tables"]["evidence_items"]["Row"];
type EvidenceCitation = Database["public"]["Tables"]["evidence_citations"]["Row"];
type EvidenceKind = Database["public"]["Enums"]["evidence_kind"];
type PanelStatus = "loading" | "ready" | "signed_out" | "not_configured" | "no_workspace" | "error";

type DocumentOption = {
  id: string;
  original_name: string;
};

const kinds: Array<{ value: EvidenceKind; label: string; description: string }> = [
  { value: "quote", label: "Customer quote", description: "A direct statement from a source" },
  { value: "observation", label: "Observation", description: "A grounded observation from evidence" },
  { value: "metric", label: "Metric", description: "A measured value with a clear source" },
];

const emptyForm = {
  kind: "quote" as EvidenceKind,
  title: "",
  content: "",
  sourceLabel: "",
  documentId: "",
  location: "",
};

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en", { month: "short", day: "numeric", year: "numeric" }).format(new Date(value));
}

export default function EvidenceLibraryPanel() {
  const [items, setItems] = useState<EvidenceItem[]>([]);
  const [citations, setCitations] = useState<EvidenceCitation[]>([]);
  const [documents, setDocuments] = useState<DocumentOption[]>([]);
  const [status, setStatus] = useState<PanelStatus>("loading");
  const [workspaceId, setWorkspaceId] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [messageTone, setMessageTone] = useState<"success" | "error">("success");
  const [search, setSearch] = useState("");
  const [activeSearch, setActiveSearch] = useState("");
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [isSaving, setIsSaving] = useState(false);

  const loadEvidence = useCallback(async (searchTerm = "") => {
    setStatus("loading");
    setMessage("");

    try {
      const supabase = createClient();
      const { data: userData, error: userError } = await supabase.auth.getUser();

      if (userError || !userData.user) {
        setStatus("signed_out");
        return;
      }

      setUserId(userData.user.id);
      const { data: workspace, error: workspaceError } = await supabase
        .from("workspaces")
        .select("id")
        .order("created_at", { ascending: true })
        .limit(1)
        .maybeSingle();

      if (workspaceError) throw workspaceError;
      if (!workspace) {
        setStatus("no_workspace");
        return;
      }

      setWorkspaceId(workspace.id);
      let evidenceQuery = supabase
        .from("evidence_items")
        .select("id, workspace_id, document_id, kind, title, content, source_label, source_locator, created_by, created_at, updated_at, search_vector")
        .eq("workspace_id", workspace.id)
        .order("created_at", { ascending: false });

      if (searchTerm.trim()) {
        evidenceQuery = evidenceQuery.textSearch("search_vector", searchTerm.trim(), { type: "websearch", config: "simple" });
      }

      const [{ data: evidenceRows, error: evidenceError }, { data: citationRows, error: citationError }, { data: documentRows, error: documentsError }] = await Promise.all([
        evidenceQuery,
        supabase.from("evidence_citations").select("id, workspace_id, evidence_item_id, citation_key, label, locator, created_by, created_at").eq("workspace_id", workspace.id),
        supabase.from("documents").select("id, original_name").eq("workspace_id", workspace.id).order("original_name"),
      ]);

      if (evidenceError) throw evidenceError;
      if (citationError) throw citationError;
      if (documentsError) throw documentsError;

      setItems(evidenceRows ?? []);
      setCitations(citationRows ?? []);
      setDocuments(documentRows ?? []);
      setStatus("ready");
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unable to load evidence.";
      if (errorMessage.startsWith("Supabase is not configured")) {
        setStatus("not_configured");
      } else {
        setStatus("error");
        setMessage(errorMessage);
        setMessageTone("error");
      }
    }
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadEvidence();
    }, 0);

    return () => window.clearTimeout(timer);
  }, [loadEvidence]);

  function startCreate() {
    setForm(emptyForm);
    setIsFormOpen(true);
  }

  function submitSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setActiveSearch(search.trim());
    void loadEvidence(search.trim());
  }

  async function saveEvidence(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!workspaceId || !userId || !form.title.trim() || !form.content.trim() || !form.sourceLabel.trim()) return;

    setIsSaving(true);
    setMessage("");
    const supabase = createClient();
    const title = form.title.trim();
    const content = form.content.trim();
    const sourceLabel = form.sourceLabel.trim();
    const locator = form.location.trim() ? { location: form.location.trim() } : {};

    try {
      const { data: evidence, error: evidenceError } = await supabase
        .from("evidence_items")
        .insert({
          workspace_id: workspaceId,
          document_id: form.documentId || null,
          kind: form.kind,
          title,
          content,
          source_label: sourceLabel,
          source_locator: locator,
          created_by: userId,
        })
        .select("id, workspace_id, document_id, kind, title, content, source_label, source_locator, created_by, created_at, updated_at, search_vector")
        .single();

      if (evidenceError) throw evidenceError;

      const citationKey = `CIT-${crypto.randomUUID().replaceAll("-", "").slice(0, 8).toUpperCase()}`;
      const { data: citation, error: citationError } = await supabase
        .from("evidence_citations")
        .insert({
          workspace_id: workspaceId,
          evidence_item_id: evidence.id,
          citation_key: citationKey,
          label: sourceLabel,
          locator,
          created_by: userId,
        })
        .select("id, workspace_id, evidence_item_id, citation_key, label, locator, created_by, created_at")
        .single();

      if (citationError) {
        await supabase.from("evidence_items").delete().eq("id", evidence.id);
        throw citationError;
      }

      setItems((current) => [evidence, ...current]);
      setCitations((current) => [citation, ...current]);
      setForm(emptyForm);
      setIsFormOpen(false);
      setMessage("Evidence saved with a citation reference.");
      setMessageTone("success");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to save this evidence.");
      setMessageTone("error");
    } finally {
      setIsSaving(false);
    }
  }

  async function deleteEvidence(item: EvidenceItem) {
    if (!window.confirm(`Delete “${item.title}”?`)) return;
    setMessage("");

    try {
      const supabase = createClient();
      const { error } = await supabase.from("evidence_items").delete().eq("id", item.id);
      if (error) throw error;
      setItems((current) => current.filter((currentItem) => currentItem.id !== item.id));
      setCitations((current) => current.filter((citation) => citation.evidence_item_id !== item.id));
      setMessage("Evidence deleted.");
      setMessageTone("success");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to delete this evidence.");
      setMessageTone("error");
    }
  }

  if (status === "loading") return <PanelMessage title="Loading your evidence library…" body="Searching the connected workspace." />;
  if (status === "not_configured") return <PanelMessage title="Connect Supabase to retrieve evidence" body="Add your project URL and publishable key to .env.local, then reload the app." />;
  if (status === "signed_out") return <PanelMessage title="Sign in to retrieve evidence" body="Evidence is private workspace data. An authenticated session is required before it can be read or changed." />;
  if (status === "no_workspace") return <PanelMessage title="Create a workspace first" body="Your evidence library will appear after an authenticated workspace is created in the Product Context section." />;
  if (status === "error") return <PanelMessage title="We could not load your evidence" body={message || "Please try again."} action={<button type="button" onClick={() => void loadEvidence(activeSearch)} className="mt-5 rounded-lg border border-[#d8dee8] bg-white px-4 py-2.5 text-sm font-semibold text-[#526075] hover:border-[#aab8ee]">Try again</button>} />;

  return (
    <div>
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#8d98a9]">Grounded product knowledge</p>
          <h2 id="evidence-heading" className="mt-2 text-2xl font-semibold tracking-[-0.04em] text-[#192235]">Evidence library</h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-[#68748a]">Save confirmed quotes, observations, and metrics with a traceable source reference. No unsupported claims are generated here.</p>
        </div>
        <button type="button" onClick={startCreate} className="inline-flex w-fit items-center gap-2 rounded-lg bg-[#5269d8] px-3.5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#435ac6]"><span className="text-lg leading-none">+</span>Add evidence</button>
      </div>

      <form onSubmit={submitSearch} className="mt-6 flex flex-col gap-2 sm:flex-row">
        <label className="sr-only" htmlFor="evidence-search">Search evidence</label>
        <input id="evidence-search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search quotes, observations, or metrics…" className="min-w-0 flex-1 rounded-lg border border-[#d8dee8] bg-white px-3.5 py-2.5 text-sm text-[#192235] outline-none placeholder:text-[#a0a9b8] focus:border-[#5269d8] focus:ring-2 focus:ring-[#dfe4ff]" />
        <button type="submit" className="rounded-lg border border-[#d8dee8] bg-white px-4 py-2.5 text-sm font-semibold text-[#526075] hover:border-[#aab8ee]">Search</button>
        {activeSearch && <button type="button" onClick={() => { setSearch(""); setActiveSearch(""); void loadEvidence(); }} className="rounded-lg px-3 py-2.5 text-sm font-semibold text-[#8d98a9] hover:text-[#192235]">Clear</button>}
      </form>

      {isFormOpen && (
        <form onSubmit={saveEvidence} className="mt-6 rounded-xl border border-[#cdd6f6] bg-[#f8f9ff] p-4 sm:p-5">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h3 className="text-sm font-semibold text-[#192235]">Record evidence</h3>
              <p className="mt-1 text-xs text-[#7d88a2]">Add only evidence you can trace to a real source.</p>
            </div>
            <button type="button" onClick={() => setIsFormOpen(false)} className="text-xs font-semibold text-[#68748a] hover:text-[#192235]">Cancel</button>
          </div>
          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <label className="grid gap-2 text-xs font-semibold text-[#526075]">
              Evidence type
              <select value={form.kind} onChange={(event) => setForm((current) => ({ ...current, kind: event.target.value as EvidenceKind }))} className="rounded-lg border border-[#d8dee8] bg-white px-3 py-2.5 text-sm font-normal text-[#192235] outline-none focus:border-[#5269d8] focus:ring-2 focus:ring-[#dfe4ff]">
                {kinds.map((kind) => <option key={kind.value} value={kind.value}>{kind.label}</option>)}
              </select>
              <span className="font-normal text-[#8d98a9]">{kinds.find((kind) => kind.value === form.kind)?.description}</span>
            </label>
            <label className="grid gap-2 text-xs font-semibold text-[#526075]">
              Source label
              <input required maxLength={255} value={form.sourceLabel} onChange={(event) => setForm((current) => ({ ...current, sourceLabel: event.target.value }))} placeholder="For example, Interview with Alex" className="rounded-lg border border-[#d8dee8] bg-white px-3 py-2.5 text-sm font-normal text-[#192235] outline-none placeholder:text-[#a0a9b8] focus:border-[#5269d8] focus:ring-2 focus:ring-[#dfe4ff]" />
            </label>
            <label className="grid gap-2 text-xs font-semibold text-[#526075]">
              Title
              <input required maxLength={200} value={form.title} onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))} placeholder="A short description of the evidence" className="rounded-lg border border-[#d8dee8] bg-white px-3 py-2.5 text-sm font-normal text-[#192235] outline-none placeholder:text-[#a0a9b8] focus:border-[#5269d8] focus:ring-2 focus:ring-[#dfe4ff]" />
            </label>
            <label className="grid gap-2 text-xs font-semibold text-[#526075]">
              Source document <span className="font-normal text-[#8d98a9]">Optional</span>
              <select value={form.documentId} onChange={(event) => setForm((current) => ({ ...current, documentId: event.target.value }))} className="rounded-lg border border-[#d8dee8] bg-white px-3 py-2.5 text-sm font-normal text-[#192235] outline-none focus:border-[#5269d8] focus:ring-2 focus:ring-[#dfe4ff]">
                <option value="">No uploaded document</option>
                {documents.map((document) => <option key={document.id} value={document.id}>{document.original_name}</option>)}
              </select>
            </label>
            <label className="grid gap-2 text-xs font-semibold text-[#526075] sm:col-span-2">
              Evidence content
              <textarea required maxLength={20000} rows={5} value={form.content} onChange={(event) => setForm((current) => ({ ...current, content: event.target.value }))} placeholder="Paste the exact quote or write the observation. Keep the wording faithful to the source." className="resize-y rounded-lg border border-[#d8dee8] bg-white px-3 py-2.5 text-sm font-normal leading-6 text-[#192235] outline-none placeholder:text-[#a0a9b8] focus:border-[#5269d8] focus:ring-2 focus:ring-[#dfe4ff]" />
            </label>
            <label className="grid gap-2 text-xs font-semibold text-[#526075] sm:col-span-2">
              Location in source <span className="font-normal text-[#8d98a9]">Optional</span>
              <input maxLength={255} value={form.location} onChange={(event) => setForm((current) => ({ ...current, location: event.target.value }))} placeholder="For example, page 4 or timestamp 12:30" className="rounded-lg border border-[#d8dee8] bg-white px-3 py-2.5 text-sm font-normal text-[#192235] outline-none placeholder:text-[#a0a9b8] focus:border-[#5269d8] focus:ring-2 focus:ring-[#dfe4ff]" />
            </label>
          </div>
          <div className="mt-4 flex justify-end">
            <button type="submit" disabled={isSaving || !form.title.trim() || !form.content.trim() || !form.sourceLabel.trim()} className="rounded-lg bg-[#5269d8] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#435ac6] disabled:cursor-not-allowed disabled:opacity-50">{isSaving ? "Saving…" : "Save evidence"}</button>
          </div>
        </form>
      )}

      {items.length === 0 ? (
        <div className="mt-6 rounded-xl border border-dashed border-[#d8dee8] p-7 text-center">
          <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-[#f3f5fb] text-sm font-bold text-[#8692a6]">E</div>
          <h3 className="mt-3 text-sm font-semibold text-[#526075]">{activeSearch ? "No matching evidence" : "No evidence recorded yet"}</h3>
          <p className="mx-auto mt-1 max-w-md text-xs leading-5 text-[#9aa4b3]">{activeSearch ? "Try a different search term or clear the filter." : "Record a confirmed quote, observation, or metric and attach its source reference."}</p>
        </div>
      ) : (
        <div className="mt-6 grid gap-3 lg:grid-cols-2">
          {items.map((item) => {
            const citation = citations.find((candidate) => candidate.evidence_item_id === item.id);
            return (
              <article key={item.id} className="rounded-xl border border-[#e3e7ee] bg-white p-4 transition-shadow hover:shadow-[0_8px_24px_rgba(25,34,53,0.06)] sm:p-5">
                <div className="flex items-start justify-between gap-3">
                  <span className="rounded-full bg-[#eef1ff] px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.12em] text-[#5269d8]">{item.kind}</span>
                  <button type="button" onClick={() => void deleteEvidence(item)} className="text-xs font-semibold text-[#9aa4b3] hover:text-[#b4534b]">Delete</button>
                </div>
                <h3 className="mt-4 text-sm font-semibold text-[#192235]">{item.title}</h3>
                <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-[#68748a]">{item.content}</p>
                <div className="mt-4 flex flex-wrap items-center gap-2 text-xs text-[#8d98a9]">
                  <span className="font-semibold text-[#526075]">{item.source_label}</span>
                  {citation && <span className="rounded bg-[#f3f5f8] px-2 py-1 font-mono text-[10px] font-semibold text-[#68748a]">[{citation.citation_key}]</span>}
                  <span>·</span>
                  <span>{formatDate(item.created_at)}</span>
                </div>
              </article>
            );
          })}
        </div>
      )}

      {message && <p role="alert" aria-live="polite" className={`mt-4 text-xs ${messageTone === "error" ? "text-[#b4534b]" : "text-[#4d8c65]"}`}>{message}</p>}
      <div className="mt-5 flex items-start gap-2 rounded-lg bg-[#f8f9fb] px-3 py-2.5 text-xs leading-5 text-[#8d98a9]"><span className="mt-0.5 text-[#53a977]">✓</span>Every evidence item must have a traceable source. AI interpretation and retrieval over indexed documents arrive in later tasks.</div>
    </div>
  );
}

function PanelMessage({ title, body, action }: { title: string; body: string; action?: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-dashed border-[#cfd7e4] bg-[#fbfcff] p-7 text-center">
      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-[#e9edff] text-lg font-bold text-[#5269d8]">E</div>
      <h3 className="mt-4 text-base font-semibold text-[#192235]">{title}</h3>
      <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-[#68748a]">{body}</p>
      {action}
    </div>
  );
}
