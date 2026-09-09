"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { authenticatedFetch } from "@/lib/supabase/auth-fetch";
import UiIcon from "./ui-icons";
import { CompactEmptyState, LibraryToolbar, PageHeader, StatusBadge } from "./workspace-primitives";

type Artifact = { id: string; kind: "product_brief" | "communication_message"; title: string; source_workflow: string; created_at: string; updated_at: string; versions: { id: string; version: number; created_at: string }[] };
type Filter = "all" | "product_brief" | "communication_message";

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en", { month: "short", day: "numeric", year: "numeric" }).format(new Date(value));
}

export default function ArtifactLibraryPanel() {
  const [artifacts, setArtifacts] = useState<Artifact[]>([]);
  const [message, setMessage] = useState("");
  const [filter, setFilter] = useState<Filter>("all");
  const load = useCallback(async () => {
    try {
      const response = await authenticatedFetch("/api/artifacts");
      const payload = await response.json() as { artifacts?: Artifact[]; error?: string };
      if (!response.ok) throw new Error(payload.error || "Artifacts could not be loaded.");
      setArtifacts(payload.artifacts ?? []);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Artifacts could not be loaded.");
    }
  }, []);
  useEffect(() => { const initialLoad = window.setTimeout(() => void load(), 0); const handler = () => void load(); window.addEventListener("artifacts:changed", handler); return () => { window.clearTimeout(initialLoad); window.removeEventListener("artifacts:changed", handler); }; }, [load]);
  const visibleArtifacts = useMemo(() => filter === "all" ? artifacts : artifacts.filter((artifact) => artifact.kind === filter), [artifacts, filter]);

  return <div className="pm-page pm-library-page">
    <PageHeader eyebrow="DURABLE OUTPUT" title="Artifacts" description="Find the product work your team has chosen to keep." action={<a className="pm-button pm-button-primary" href="#define">Create from Define <UiIcon name="arrow-up-right" size={14} /></a>} />
    {message && <div role="alert" className="pm-inline-alert">{message}</div>}
    <LibraryToolbar><div className="pm-filter-group" role="group" aria-label="Filter artifacts">{(["all", "product_brief", "communication_message"] as Filter[]).map((item) => <button type="button" key={item} className={filter === item ? "is-active" : ""} aria-pressed={filter === item} onClick={() => setFilter(item)}>{item === "all" ? "All" : item === "product_brief" ? "PRDs" : "Messages"}</button>)}</div><span className="pm-toolbar-count">{visibleArtifacts.length} {visibleArtifacts.length === 1 ? "artifact" : "artifacts"}</span></LibraryToolbar>
    {visibleArtifacts.length === 0 ? <CompactEmptyState title={artifacts.length ? "No artifacts match this filter" : "No saved artifacts yet"} body={artifacts.length ? "Try another filter or return to All." : "Review a workflow result, then save the output here for your team."} icon="archive" action={!artifacts.length ? <a className="pm-button pm-button-secondary" href="#discover">Start a workflow <UiIcon name="arrow-up-right" size={14} /></a> : undefined} /> : <div className="pm-data-list" aria-label="Artifacts"><div className="pm-data-list-head"><span>Artifact</span><span>Source</span><span>Status</span><span>Updated</span><span /></div>{visibleArtifacts.map((artifact) => <article className="pm-data-row" key={artifact.id}><div><strong>{artifact.title}</strong><small>{artifact.kind === "product_brief" ? "Product brief" : "Communication message"} · v{artifact.versions.at(-1)?.version ?? 1}</small></div><span>{artifact.source_workflow.replaceAll("_", " ")}</span><StatusBadge label={artifact.versions.length > 1 ? "Updated" : "Draft"} tone={artifact.versions.length > 1 ? "blue" : "neutral"} /><span>{formatDate(artifact.updated_at)}</span><a href={`/api/artifacts/${artifact.id}/export`} aria-label={`Export ${artifact.title}`}><UiIcon name="arrow-up-right" size={15} /></a></article>)}</div>}
  </div>;
}
