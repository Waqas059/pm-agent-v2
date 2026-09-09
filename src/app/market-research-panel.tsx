"use client";

import { useState } from "react";
import { authenticatedFetch } from "@/lib/supabase/auth-fetch";

type Result = {
  id: string;
  model: string;
  output: {
    summary: string;
    findings: { title: string; claim: string; sourceUrls: string[] }[];
    sources: { url: string; title: string; excerpt: string; retrievedAt: string }[];
    limitations: string[];
  };
};

export default function MarketResearchPanel() {
  const [question, setQuestion] = useState("");
  const [result, setResult] = useState<Result | null>(null);
  const [message, setMessage] = useState("");
  const [isRunning, setIsRunning] = useState(false);

  async function executeResearch() {
    if (!question.trim()) return;
    setIsRunning(true); setMessage(""); setResult(null);
    try {
      const response = await authenticatedFetch("/api/research/market", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ question: question.trim() }) });
      const payload = await response.json() as { result?: Result; error?: string };
      if (!response.ok || !payload.result) throw new Error(payload.error || "Market research could not be completed.");
      setResult(payload.result);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Market research could not be completed.");
    } finally { setIsRunning(false); }
  }

  function runResearch(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void executeResearch();
  }

  return <div className="pm-research-panel">
    <div className="pm-page-header"><div><p className="pm-eyebrow">EXTERNAL / WEB EVIDENCE</p><h2>Research the market with sources</h2><p className="pm-page-description">Ask a focused external question. Results remain a reviewable draft and are kept separate from workspace evidence until you explicitly decide what to keep.</p></div><span className="pm-status-badge pm-status-blue"><span />Review first</span></div>
    <form onSubmit={runResearch} className="pm-research-form"><label htmlFor="market-research-question">What do you want to learn from the current market?<textarea id="market-research-question" required maxLength={2000} rows={3} value={question} onChange={(event) => setQuestion(event.target.value)} placeholder="For example: What onboarding patterns are competitors using for team collaboration products?" /></label><div className="pm-form-actions"><span>External claims will include retrieved URLs and retrieval dates.</span><button type="submit" className="pm-button pm-button-primary" disabled={isRunning || !question.trim()}>{isRunning ? "Researching…" : "Run market research"}</button></div></form>
    {isRunning && <p className="kit-notice" role="status" aria-live="polite">Searching current external sources and preparing a reviewable synthesis…</p>}
    {message && <div className="pm-inline-alert" role="alert"><span>{message}</span><button type="button" className="pm-button pm-button-secondary" onClick={() => void executeResearch()} disabled={isRunning || !question.trim()}>Retry</button></div>}
    {result && <div className="pm-research-result"><section className="pm-result-lead"><p className="pm-eyebrow">EXTERNAL WEB EVIDENCE · NOT WORKSPACE EVIDENCE</p><h3>Research synthesis</h3><p>{result.output.summary}</p><small>Run {result.id} · {result.model} · Review required · Not persisted</small></section><section className="pm-result-section"><h3>Findings</h3><div className="pm-result-list">{result.output.findings.map((finding) => <article key={finding.title}><h4>{finding.title}</h4><p>{finding.claim}</p><div className="pm-citations">{finding.sourceUrls.map((url) => <a key={url} href={url} target="_blank" rel="noreferrer">Source ↗</a>)}</div></article>)}</div></section><section className="pm-result-section"><h3>Retrieved sources</h3><div className="pm-result-list">{result.output.sources.map((source) => <article key={source.url}><a href={source.url} target="_blank" rel="noreferrer"><h4>{source.title}</h4></a><p>{source.excerpt}</p><small>Retrieved {new Intl.DateTimeFormat("en", { dateStyle: "medium" }).format(new Date(source.retrievedAt))} · {source.url}</small></article>)}</div></section><section className="pm-result-section"><h3>Limitations</h3><ul>{result.output.limitations.map((limitation) => <li key={limitation}>{limitation}</li>)}</ul></section></div>}
  </div>;
}
