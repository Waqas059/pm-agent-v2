"use client";

import { useCallback, useEffect, useState } from "react";
import type { FormEvent } from "react";

import { createClient } from "@/lib/supabase/client";
import type { Database } from "@/lib/supabase/database.types";
import UiIcon from "./ui-icons";
import { CompactEmptyState, formatSourceLocator, LibraryToolbar, PageHeader, StatusBadge } from "./workspace-primitives";

type EvidenceItem = Database["public"]["Tables"]["evidence_items"]["Row"];
type EvidenceCitation = Database["public"]["Tables"]["evidence_citations"]["Row"];
type EvidenceKind = Database["public"]["Enums"]["evidence_kind"];
type EvidenceFilter = "all" | EvidenceKind;
type PanelStatus = "loading" | "ready" | "signed_out" | "not_configured" | "no_workspace" | "error";

type DocumentOption = {
  id: string;
  original_name: string;
};

type ExtractionOption = {
  extracted_text: string;
  locators: Database["public"]["Tables"]["document_extractions"]["Row"]["locators"];
  extractor: string;
};

const kinds: Array<{ value: EvidenceKind; label: string; description: string }> = [
  { value: "quote", label: "Customer quote", description: "A direct statement from a source" },
  { value: "observation", label: "Observation", description: "A grounded observation from evidence" },
  { value: "metric", label: "Metric", description: "A measured value with a clear source" },
];

const evidenceFilters: Array<{ value: EvidenceFilter; label: string }> = [
  { value: "all", label: "All evidence" },
  { value: "quote", label: "Quotes" },
  { value: "observation", label: "Observations" },
  { value: "metric", label: "Metrics" },
];

const emptyForm = {
  kind: "quote" as EvidenceKind,
  title: "",
  content: "",
  sourceLabel: "",
  documentId: "",
  location: "",
};

const MAX_EVIDENCE_CONTENT_LENGTH = 20_000;

export function filterEvidenceItems(items: EvidenceItem[], filter: EvidenceFilter) {
  return filter === "all" ? items : items.filter((item) => item.kind === filter);
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en", { month: "short", day: "numeric", year: "numeric" }).format(new Date(value));
}

export default function EvidenceLibraryPanel() {
  const [items, setItems] = useState<EvidenceItem[]>([]);
  const [citations, setCitations] = useState<EvidenceCitation[]>([]);
  const [documents, setDocuments] = useState<DocumentOption[]>([]);
  const [extractions, setExtractions] = useState<Record<string, ExtractionOption>>({});
  const [status, setStatus] = useState<PanelStatus>("loading");
  const [workspaceId, setWorkspaceId] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [messageTone, setMessageTone] = useState<"success" | "error">("success");
  const [search, setSearch] = useState("");
  const [activeSearch, setActiveSearch] = useState("");
  const [activeKind, setActiveKind] = useState<EvidenceFilter>("all");
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

      const [{ data: evidenceRows, error: evidenceError }, { data: citationRows, error: citationError }, { data: documentRows, error: documentsError }, { data: extractionRows, error: extractionsError }] = await Promise.all([
        evidenceQuery,
        supabase.from("evidence_citations").select("id, workspace_id, evidence_item_id, citation_key, label, locator, created_by, created_at").eq("workspace_id", workspace.id),
        supabase.from("documents").select("id, original_name").eq("workspace_id", workspace.id).order("original_name"),
        supabase.from("document_extractions").select("document_id, extracted_text, locators, extractor").eq("workspace_id", workspace.id),
      ]);

      if (evidenceError) throw evidenceError;
      if (citationError) throw citationError;
      if (documentsError) throw documentsError;
      if (extractionsError) throw extractionsError;

      setItems(evidenceRows ?? []);
      setCitations(citationRows ?? []);
      setDocuments(documentRows ?? []);
      setExtractions(Object.fromEntries((extractionRows ?? []).map((extraction) => [extraction.document_id, extraction])));
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

  function draftFromExtraction() {
    if (!form.documentId) return;

    const extraction = extractions[form.documentId];
    const document = documents.find((candidate) => candidate.id === form.documentId);
    if (!extraction || !document) return;

    const wasTruncated = extraction.extracted_text.length > MAX_EVIDENCE_CONTENT_LENGTH;
    const locatorCount = Array.isArray(extraction.locators) ? extraction.locators.length : 0;
    setForm((current) => ({
      ...current,
      sourceLabel: current.sourceLabel || document.original_name,
      title: current.title || `Extracted source: ${document.original_name}`.slice(0, 200),
      content: extraction.extracted_text.slice(0, MAX_EVIDENCE_CONTENT_LENGTH),
      location: current.location || `Extracted text · ${locatorCount} source locator${locatorCount === 1 ? "" : "s"}`,
    }));
    setMessage(wasTruncated
      ? "Extracted text loaded as a draft (first 20,000 characters). Review and edit it before saving as evidence."
      : "Extracted text loaded as a draft. Review and edit it before saving as evidence.");
    setMessageTone("success");
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
    const extraction = form.documentId ? extractions[form.documentId] : undefined;
    const locatorCount = extraction && Array.isArray(extraction.locators) ? extraction.locators.length : undefined;
    const locator = {
      ...(form.location.trim() ? { location: form.location.trim() } : {}),
      ...(extraction ? { extractor: extraction.extractor, source_locator_count: locatorCount ?? 0 } : {}),
    };

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

  const visibleItems = filterEvidenceItems(items, activeKind);

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

  if (status === "loading") return <PanelMessage title="Loading evidence" body="Searching the connected workspace." />;
  if (status === "not_configured") return <PanelMessage title="Connect Supabase to retrieve evidence" body="Add your project URL and publishable key to .env.local, then reload the app." />;
  if (status === "signed_out") return <PanelMessage title="Sign in to access workspace evidence" body="Your evidence library is private. The same library structure will remain here after authentication." />;
  if (status === "no_workspace") return <PanelMessage title="Create a workspace first" body="Your evidence library will appear after an authenticated workspace is created in the Product Context section." />;
  if (status === "error") return <PanelMessage title="We could not load your evidence" body={message || "Please try again."} action={<button type="button" onClick={() => void loadEvidence(activeSearch)} className="pm-button pm-button-secondary">Try again</button>} />;

  return (
    <div className="pm-page pm-library-page">
      <PageHeader eyebrow="GROUNDED PRODUCT KNOWLEDGE" title="Evidence" description="Find what the workspace knows and where it came from." action={<button type="button" onClick={startCreate} className="pm-button pm-button-primary"><UiIcon name="plus" size={14} />Add evidence</button>} />

      <LibraryToolbar><form onSubmit={submitSearch} className="pm-library-search"><label className="sr-only" htmlFor="evidence-search">Search evidence</label><input id="evidence-search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search evidence…" /><button type="submit" className="pm-button pm-button-secondary">Search</button>{activeSearch && <button type="button" onClick={() => { setSearch(""); setActiveSearch(""); void loadEvidence(); }} className="pm-button pm-button-ghost">Clear</button>}</form><div className="pm-filter-group" role="group" aria-label="Evidence type">{evidenceFilters.map((filter) => <button key={filter.value} type="button" aria-pressed={activeKind === filter.value} className={activeKind === filter.value ? "is-active" : ""} onClick={() => setActiveKind(filter.value)}>{filter.label}</button>)}</div></LibraryToolbar>

      {isFormOpen && (
        <form onSubmit={saveEvidence} className="pm-inline-form pm-evidence-form">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h3 className="text-sm font-semibold text-[#192235]">Record evidence</h3>
              <p className="mt-1 text-xs text-[#7d88a2]">Add only evidence you can trace to a real source.</p>
            </div>
            <button type="button" onClick={() => setIsFormOpen(false)} className="min-h-11 px-2 text-xs font-semibold text-[#68748a] hover:text-[#192235]">Cancel</button>
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
            <div className="grid gap-2 text-xs font-semibold text-[#526075]">
              <label htmlFor="evidence-document">Source document <span className="font-normal text-[#8d98a9]">Optional</span></label>
              <select id="evidence-document" value={form.documentId} onChange={(event) => setForm((current) => ({ ...current, documentId: event.target.value }))} className="rounded-lg border border-[#d8dee8] bg-white px-3 py-2.5 text-sm font-normal text-[#192235] outline-none focus:border-[#5269d8] focus:ring-2 focus:ring-[#dfe4ff]">
                <option value="">No uploaded document</option>
                {documents.map((document) => <option key={document.id} value={document.id}>{document.original_name}</option>)}
              </select>
              {form.documentId && extractions[form.documentId] && <button type="button" onClick={draftFromExtraction} className="pm-button pm-button-ghost min-h-11 justify-self-start text-xs">Use extracted text as draft</button>}
              {form.documentId && !extractions[form.documentId] && <span className="font-normal text-[#8d98a9]">Extract this document first to create a reviewable evidence draft.</span>}
            </div>
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
            <button type="submit" disabled={isSaving || !form.title.trim() || !form.content.trim() || !form.sourceLabel.trim()} className="min-h-11 rounded-lg bg-[#5269d8] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#435ac6] disabled:cursor-not-allowed disabled:opacity-50">{isSaving ? "Saving…" : "Save evidence"}</button>
          </div>
        </form>
      )}

      {visibleItems.length === 0 ? (
        <CompactEmptyState title={activeSearch ? "No matching evidence" : activeKind === "all" ? "No evidence recorded yet" : `No ${evidenceFilters.find((filter) => filter.value === activeKind)?.label.toLowerCase()} yet`} body={activeSearch ? "Try a different search term or clear the filter." : activeKind === "all" ? "Record a confirmed quote, observation, or metric and attach its source reference." : "Choose another evidence type or add a new source-backed item."} icon="scan" action={<button type="button" onClick={startCreate} className="pm-button pm-button-secondary">Add evidence <UiIcon name="plus" size={14} /></button>} />
      ) : (
        <div className="pm-data-list" aria-label="Evidence"><div className="pm-data-list-head"><span>Finding</span><span>Source</span><span>Type</span><span>Added</span><span /></div>
          {visibleItems.map((item) => {
            const citation = citations.find((candidate) => candidate.evidence_item_id === item.id);
            return (
              <article key={item.id} className="pm-data-row pm-evidence-row">
                <div className="flex items-start justify-between gap-3">
                  <strong>{item.title}</strong>
                  <details className="pm-row-details"><summary>Inspect</summary><div><p>{item.content}</p><strong>{item.source_label}</strong>{formatSourceLocator(item.source_locator) ? <small>Source location: {formatSourceLocator(item.source_locator)}</small> : <small className="pm-source-location-empty">No source location recorded</small>}</div></details>
                </div>
                <span>{item.source_label}{citation ? ` · [${citation.citation_key}]` : ""}</span><StatusBadge label={item.kind} tone="blue" /><span>{formatDate(item.created_at)}</span><button type="button" onClick={() => void deleteEvidence(item)} aria-label={`Delete ${item.title}`} className="pm-icon-button"><UiIcon name="trash" size={14} /></button>
              </article>
            );
          })}
        </div>
      )}

      {message && <p role="alert" aria-live="polite" className={`mt-4 text-xs ${messageTone === "error" ? "text-[#b4534b]" : "text-[#4d8c65]"}`}>{message}</p>}
      <div className="mt-5 flex items-start gap-2 rounded-lg bg-[#f8f9fb] px-3 py-2.5 text-xs leading-5 text-[#8d98a9]"><span className="mt-0.5 text-[#53a977]">✓</span>Every evidence item must have a traceable source. Inspect the source before using a finding to make a decision.</div>
    </div>
  );
}

function PanelMessage({ title, body, action }: { title: string; body: string; action?: React.ReactNode }) {
  return <div className="pm-page pm-library-page"><PageHeader eyebrow="GROUNDED PRODUCT KNOWLEDGE" title="Evidence" description="Find what the workspace knows and where it came from." /><LibraryToolbar><span className="pm-library-search-placeholder">Search evidence…</span><span className="pm-filter-group"><span className="is-active">All evidence</span><span>Quotes</span><span>Observations</span><span>Metrics</span></span></LibraryToolbar><div className="pm-auth-inline-state"><div><p className="pm-eyebrow">{title.startsWith("Sign in") ? "PRIVATE WORKSPACE DATA" : "EVIDENCE LIBRARY"}</p><h2>{title}</h2><p>{body}</p></div>{action}</div></div>;
}
