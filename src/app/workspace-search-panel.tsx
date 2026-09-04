"use client";

import { FormEvent, useState } from "react";

type SearchResult = { id: string; type: string; title: string; detail: string; href: string };

export default function WorkspaceSearchPanel() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [message, setMessage] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  async function search(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (query.trim().length < 2) { setResults([]); setMessage("Type at least 2 characters."); return; }
    setIsSearching(true); setMessage("");
    try { const response = await fetch(`/api/search?q=${encodeURIComponent(query.trim())}`); const payload = await response.json() as { results?: SearchResult[]; error?: string }; if (!response.ok) throw new Error(payload.error || "Search failed."); setResults(payload.results ?? []); if (!payload.results?.length) setMessage("No matching context, evidence, or artifacts."); } catch (error) { setMessage(error instanceof Error ? error.message : "Search failed."); setResults([]); } finally { setIsSearching(false); }
  }
  return <div className="relative"><form onSubmit={search} className="flex items-center gap-2"><label htmlFor="workspace-search" className="sr-only">Search workspace</label><input id="workspace-search" value={query} onChange={(event) => { setQuery(event.target.value); if (!event.target.value.trim()) { setResults([]); setMessage(""); } }} placeholder="Search workspace" maxLength={120} className="h-9 w-44 rounded-lg border border-[#e3e7ee] bg-white px-3 text-xs text-[#192235] outline-none placeholder:text-[#a0a9b8] focus:border-[#aab8ee] focus:ring-2 focus:ring-[#eef1ff]" /><button type="submit" aria-label="Search workspace" disabled={isSearching} className="flex h-9 w-9 items-center justify-center rounded-lg border border-[#e3e7ee] bg-white text-xs font-semibold text-[#5269d8] hover:bg-[#f5f7fa] disabled:opacity-50">{isSearching ? "…" : "⌕"}</button></form>{(results.length > 0 || message) && <div className="absolute right-0 top-11 z-20 w-80 rounded-xl border border-[#e3e7ee] bg-white p-2 shadow-[0_12px_30px_rgba(25,34,53,0.12)]">{message && <p className="px-3 py-3 text-xs text-[#8d98a9]">{message}</p>}{results.map((result) => <a key={`${result.type}-${result.id}`} href={result.href} onClick={() => { setResults([]); setMessage(""); }} className="block rounded-lg px-3 py-2.5 hover:bg-[#f5f7fa]"><div className="flex items-center justify-between gap-3"><span className="text-[10px] font-bold uppercase tracking-[0.12em] text-[#5269d8]">{result.type}</span><span className="text-[10px] text-[#a0a9b8]">Open</span></div><p className="mt-1 truncate text-sm font-semibold text-[#192235]">{result.title}</p><p className="mt-1 line-clamp-2 text-xs leading-5 text-[#8d98a9]">{result.detail}</p></a>)}</div>}</div>;
}
