"use client";

import { useEffect, useState } from "react";

import { authenticatedFetch } from "@/lib/supabase/auth-fetch";

type Participant = { id: string; full_name: string; preferred_name: string | null; email: string; status: string; request_allowance: number; used: number; country_name: string | null };
type Feedback = { id: string; participant_id: string; usefulness_rating: number; would_use_again: boolean; feedback_text: string; wants_continued_access: boolean; status: string; created_at: string };
type ContinuationRequest = { id: string; participant_id: string; requested_at: string; status: string; allowance_at_request: number; used_at_request: number };
type AdminPayload = { accessMode: string; participants: Participant[]; feedback: Feedback[]; continuationRequests: ContinuationRequest[]; overview: { participants: number; active: number; feedback: number; continuation: number; countryBreakdown: Record<string, number> } };

export default function BetaAdminPage() {
  const [data, setData] = useState<AdminPayload | null>(null);
  const [message, setMessage] = useState("Loading beta operations…");
  const [tab, setTab] = useState<"overview" | "participants" | "feedback">("overview");
  const [form, setForm] = useState({ fullName: "", preferredName: "", email: "", allowance: "10" });

  async function load() {
    const response = await authenticatedFetch("/api/admin/beta", { cache: "no-store" });
    const payload = await response.json() as AdminPayload & { error?: string };
    if (!response.ok) throw Error(payload.error || "Could not load beta operations.");
    setData(payload); setMessage("");
  }
  useEffect(() => { const timer = window.setTimeout(() => { void load().catch((error: unknown) => setMessage(error instanceof Error ? error.message : "Could not load beta operations.")); }, 0); return () => window.clearTimeout(timer); }, []);

  async function act(body: Record<string, unknown>) {
    const response = await authenticatedFetch("/api/admin/beta", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    const payload = await response.json() as { error?: string };
    if (!response.ok) throw Error(payload.error || "Could not save the admin action.");
    await load();
  }

  return <main className="beta-admin-page"><header className="beta-admin-header"><div><p className="pm-eyebrow">BETA OPERATIONS · SERVER-AUTHORIZED</p><h1>Product Manager beta</h1><p>Manage participants, allowance, feedback, and continuation requests without exposing PM workspace content.</p></div><span className="beta-admin-mode">Access mode: {data?.accessMode || "observe"}</span></header>
    {message && <p className="beta-admin-message" role="status">{message}</p>}
    {data && <><nav className="beta-admin-tabs" aria-label="Beta admin sections">{(["overview", "participants", "feedback"] as const).map((item) => <button key={item} type="button" className={tab === item ? "is-active" : ""} onClick={() => setTab(item)}>{item === "overview" ? "Overview" : item === "participants" ? "Beta users" : "Feedback"}</button>)}</nav>
      {tab === "overview" && <section className="beta-admin-section"><div className="beta-admin-summary"><div><strong>{data.overview.participants}</strong><span>participants</span></div><div><strong>{data.overview.active}</strong><span>active</span></div><div><strong>{data.overview.feedback}</strong><span>new feedback</span></div><div><strong>{data.overview.continuation}</strong><span>access requests</span></div></div><div className="beta-admin-grid"><div><h2>Country mix</h2>{Object.entries(data.overview.countryBreakdown).map(([country, count]) => <p key={country}><span>{country}</span><strong>{count}</strong></p>)}</div><div><h2>Operating rules</h2><p>Participant access is observational. Existing authentication stays unchanged.</p><p>Allowance is server-authoritative and only meaningful AI generations consume it.</p><p>Private beta feedback is visible to admins, not other participants.</p></div></div>{data.continuationRequests.filter((item) => item.status === "new").length > 0 && <div className="beta-admin-review"><h2>Continuation requests</h2>{data.continuationRequests.filter((item) => item.status === "new").map((item) => <article key={item.id}><span>{item.participant_id.slice(0, 8)} · {item.used_at_request} / {item.allowance_at_request} used</span><button type="button" onClick={() => void act({ action: "review_continuation", id: item.id, status: "approved" }).catch((error: unknown) => setMessage(error instanceof Error ? error.message : "Could not approve request."))}>Approve</button><button type="button" onClick={() => void act({ action: "review_continuation", id: item.id, status: "declined" }).catch((error: unknown) => setMessage(error instanceof Error ? error.message : "Could not decline request."))}>Decline</button></article>)}</div>}</section>}
      {tab === "participants" && <section className="beta-admin-section"><form className="beta-admin-form" onSubmit={(event) => { event.preventDefault(); void act({ action: "create_participant", ...form, allowance: Number(form.allowance) }).then(() => setForm({ fullName: "", preferredName: "", email: "", allowance: "10" })).catch((error: unknown) => setMessage(error instanceof Error ? error.message : "Could not add participant.")); }}><input aria-label="Full name" placeholder="Full name" value={form.fullName} onChange={(event) => setForm({ ...form, fullName: event.target.value })} required /><input aria-label="Preferred name" placeholder="Preferred name" value={form.preferredName} onChange={(event) => setForm({ ...form, preferredName: event.target.value })} /><input aria-label="Email" type="email" placeholder="Email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} required /><input aria-label="Allowance" type="number" min="0" placeholder="Requests" value={form.allowance} onChange={(event) => setForm({ ...form, allowance: event.target.value })} /><button type="submit">Add participant</button></form><div className="beta-admin-table-wrap"><table><thead><tr><th>Name</th><th>Email</th><th>Country</th><th>Usage</th><th>Status</th><th /></tr></thead><tbody>{data.participants.map((participant) => <tr key={participant.id}><td><strong>{participant.preferred_name || participant.full_name}</strong><small>{participant.full_name}</small></td><td>{participant.email}</td><td>{participant.country_name || "—"}</td><td>{participant.used} / {participant.request_allowance}</td><td><span className={`beta-admin-status is-${participant.status}`}>{participant.status}</span></td><td><button type="button" onClick={() => void act({ action: "grant_allowance", id: participant.id, amount: 5 }).catch((error: unknown) => setMessage(error instanceof Error ? error.message : "Could not grant allowance."))}>+5</button></td></tr>)}</tbody></table></div></section>}
      {tab === "feedback" && <section className="beta-admin-section"><div className="beta-admin-feedback-list">{data.feedback.length ? data.feedback.map((item) => <article key={item.id}><div><strong>{item.usefulness_rating} / 5 · {item.would_use_again ? "Would use again" : "Would not use again"}</strong><small>{new Date(item.created_at).toLocaleString()}</small></div><p>{item.feedback_text || "No written note."}</p><button type="button" onClick={() => void act({ action: "review_feedback", id: item.id, status: item.wants_continued_access ? "follow_up" : "reviewed" }).catch((error: unknown) => setMessage(error instanceof Error ? error.message : "Could not review feedback."))}>{item.status === "new" ? "Mark reviewed" : item.status}</button></article>) : <p>No beta feedback has arrived yet.</p>}</div></section>}
    </>}
  </main>;
}
