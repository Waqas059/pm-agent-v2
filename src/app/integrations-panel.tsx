"use client";

import { useState, type FormEvent } from "react";
import { integrationDefinitions, type IntegrationStatus } from "@/lib/integrations";
import type { GitHubRepositoryPreview } from "@/lib/integrations/github";
import { authenticatedFetch } from "@/lib/supabase/auth-fetch";

const statusCopy: Record<IntegrationStatus, string> = { connected: "Connected", not_connected: "Not connected", not_enabled: "Not enabled" };

export default function IntegrationsPanel() {
  const [showPolicy, setShowPolicy] = useState(false);
  const [repositoryUrl, setRepositoryUrl] = useState("");
  const [githubPreview, setGithubPreview] = useState<GitHubRepositoryPreview | null>(null);
  const [githubMessage, setGithubMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  async function reviewGitHubRepository(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsLoading(true);
    setGithubMessage("");
    setGithubPreview(null);
    try {
      const response = await authenticatedFetch("/api/integrations/github", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ repositoryUrl }),
      });
      const payload = await response.json() as { result?: GitHubRepositoryPreview; error?: string };
      if (!response.ok || !payload.result) throw new Error(payload.error || "GitHub context could not be loaded.");
      setGithubPreview(payload.result);
    } catch (error) {
      setGithubMessage(error instanceof Error ? error.message : "GitHub context could not be loaded.");
    } finally {
      setIsLoading(false);
    }
  }

  return <div>
    <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start"><div><p className="text-xs font-bold uppercase tracking-[0.18em] text-[#5269d8]">SCOPED INTEGRATIONS</p><h2 id="integrations-heading" className="mt-2 text-2xl font-semibold tracking-[-0.04em] text-[#192235]">Connect only what the workflow needs</h2><p className="mt-2 max-w-2xl text-sm leading-6 text-[#68748a]">External services are isolated behind explicit boundaries. This first integration layer shows what is active and keeps optional connections read-only until deliberately enabled.</p></div><span className="inline-flex w-fit items-center gap-2 rounded-full border border-[#dfe4ff] bg-[#f6f7ff] px-3 py-2 text-xs font-semibold text-[#5269d8]"><span className="h-2 w-2 rounded-full bg-[#5269d8]" />Scoped</span></div>
    <div className="mt-6 grid gap-3 md:grid-cols-2">{integrationDefinitions.map((integration) => { const connected = integration.status === "connected"; const pending = integration.status === "not_connected"; return <article key={integration.name} className="rounded-xl border border-[#e3e7ee] bg-white p-4"><div className="flex items-start justify-between gap-3"><div><h3 className="text-sm font-semibold text-[#192235]">{integration.name}</h3><p className="mt-2 text-xs leading-5 text-[#68748a]">{integration.purpose}</p></div><span className={`rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.1em] ${connected ? "bg-[#e4f3e8] text-[#4d8c65]" : pending ? "bg-[#eef1ff] text-[#5269d8]" : "bg-[#f3f5f8] text-[#8d98a9]"}`}>{statusCopy[integration.status]}</span></div><p className="mt-4 text-[11px] font-semibold uppercase tracking-[0.1em] text-[#8d98a9]">Access: {integration.access.replace("_", " ")}</p></article>; })}</div>
    <section className="mt-4 rounded-xl border border-[#dfe4ff] bg-[#f9faff] p-4 sm:p-5" aria-labelledby="github-preview-heading"><div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start"><div><p className="text-xs font-bold uppercase tracking-[0.14em] text-[#5269d8]">READ-ONLY PREVIEW</p><h3 id="github-preview-heading" className="mt-2 text-base font-semibold text-[#192235]">Review public GitHub context</h3><p className="mt-1 max-w-2xl text-xs leading-5 text-[#68748a]">Inspect repository metadata and up to five open issue summaries. Nothing is saved, and no GitHub write action is available.</p></div><span className="w-fit rounded-full bg-white px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.1em] text-[#5269d8]">Public only</span></div><form onSubmit={reviewGitHubRepository} className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-end"><label htmlFor="github-repository-url" className="grid flex-1 gap-2 text-xs font-semibold text-[#526075]">Repository URL<input id="github-repository-url" type="url" required value={repositoryUrl} onChange={(event) => setRepositoryUrl(event.target.value)} placeholder="https://github.com/owner/repository" className="min-h-11 rounded-lg border border-[#d8dee8] bg-white px-3 py-2.5 text-sm font-normal text-[#192235] outline-none placeholder:text-[#a0a9b8] focus:border-[#5269d8] focus:ring-2 focus:ring-[#dfe4ff]" /></label><button type="submit" disabled={isLoading || !repositoryUrl.trim()} className="min-h-11 rounded-lg bg-[#192235] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#303b4e] disabled:cursor-wait disabled:opacity-60">{isLoading ? "Reviewing…" : "Review repository"}</button></form>{githubMessage && <p className="mt-3 text-xs leading-5 text-[#a04c43]" role="alert">{githubMessage}</p>}{githubPreview && <div className="mt-4 rounded-lg border border-[#e3e7ee] bg-white p-4"><div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-start"><div><a href={githubPreview.url} target="_blank" rel="noreferrer" className="text-sm font-semibold text-[#5269d8] hover:underline">{githubPreview.fullName}</a><p className="mt-1 text-xs leading-5 text-[#68748a]">{githubPreview.description || "No public description provided."}</p></div><span className="text-xs font-semibold text-[#526075]">★ {githubPreview.stars} · {githubPreview.defaultBranch}</span></div>{githubPreview.openIssues.length ? <div className="mt-4"><p className="text-xs font-bold uppercase tracking-[0.12em] text-[#8d98a9]">Open issue summaries</p><ul className="mt-2 grid gap-2">{githubPreview.openIssues.map((issue) => <li key={issue.url} className="flex flex-col gap-1 rounded-lg bg-[#fafbfc] p-3 sm:flex-row sm:items-center sm:justify-between"><a href={issue.url} target="_blank" rel="noreferrer" className="text-xs font-semibold text-[#192235] hover:underline">{issue.title}</a><span className="text-[11px] text-[#8d98a9]">{issue.labels.join(", ") || "Unlabelled"}</span></li>)}</ul></div> : <p className="mt-4 text-xs text-[#8d98a9]">No open issues were returned in the preview.</p>}<p className="mt-4 text-[11px] leading-5 text-[#8d98a9]">Retrieved {new Date(githubPreview.retrievedAt).toLocaleString()} · Review-only preview · not persisted</p></div>}</section>
    <div className="mt-4 rounded-xl border border-[#e3e7ee] bg-[#fafbfc] p-4 sm:p-5"><div className="flex items-center justify-between gap-3"><div><p className="text-xs font-bold uppercase tracking-[0.14em] text-[#8d98a9]">Integration policy</p><p className="mt-2 text-sm font-semibold text-[#192235]">Review before any external data leaves the workspace.</p></div><button type="button" onClick={() => setShowPolicy((current) => !current)} className="rounded-lg border border-[#d8dee8] bg-white px-3 py-2 text-xs font-semibold text-[#526075] hover:border-[#bfc8d6]">{showPolicy ? "Hide policy" : "Show policy"}</button></div>{showPolicy && <ul className="mt-4 grid gap-2 text-xs leading-5 text-[#68748a] sm:grid-cols-2"><li className="rounded-lg bg-white p-3">Start read-only and workspace-scoped.</li><li className="rounded-lg bg-white p-3">Keep provider credentials server-side.</li><li className="rounded-lg bg-white p-3">Show the exact data and destination before sharing.</li><li className="rounded-lg bg-white p-3">Do not send messages or create tasks automatically.</li></ul>}<p className="mt-4 text-xs leading-5 text-[#8d98a9]">No external account was connected and no workspace data was transmitted by this panel.</p></div>
  </div>;
}
