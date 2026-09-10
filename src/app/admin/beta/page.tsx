"use client";

import { useEffect, useState } from "react";

import { authenticatedFetch } from "@/lib/supabase/auth-fetch";

type WorkflowProgress = { started: number; completed: number };
type Participant = {
  id: string;
  full_name: string;
  preferred_name: string | null;
  email: string;
  status: string;
  request_allowance: number;
  used: number;
  remaining: number;
  country_name: string | null;
  country_code: string | null;
  created_at: string;
  updated_at: string;
  lastActive: string | null;
  active: boolean;
  workflowProgress: Record<string, WorkflowProgress>;
  usefulOutput: boolean;
  artifactsCreated: number;
  evidenceCitationEngagement: number;
  feedbackSubmitted: boolean;
  continuationRequested: boolean;
  contactClicked: boolean;
  latestContactClick: string | null;
  limitReachedAt: string | null;
};
type Feedback = { id: string; participant_id: string; usefulness_rating: number; would_use_again: boolean; feedback_text: string; wants_continued_access: boolean; status: string; created_at: string };
type ContinuationRequest = { id: string; participant_id: string; requested_at: string; status: string; allowance_at_request: number; used_at_request: number; reviewed_at: string | null; admin_note: string | null };
type AdminPayload = {
  accessMode: string;
  participants: Participant[];
  feedback: Feedback[];
  continuationRequests: ContinuationRequest[];
  needsAttention: Array<{ type: string; participantId: string; label: string; detail: string }>;
  overview: { participants: number; active: number; aiRequestsUsed: number; feedback: number; continuation: number; countryBreakdown: Record<string, number> };
};

function formatDate(value: string | null) {
  if (!value) return "Never";
  return new Intl.DateTimeFormat(undefined, { month: "short", day: "numeric", year: "numeric" }).format(new Date(value));
}

function displayName(participant: Participant) {
  return participant.preferred_name || participant.full_name;
}

function progressLabel(participant: Participant) {
  const completed = Object.values(participant.workflowProgress).filter((workflow) => workflow.completed > 0).length;
  return `${completed} / 3 workflows`;
}

export default function BetaAdminPage() {
  const [data, setData] = useState<AdminPayload | null>(null);
  const [message, setMessage] = useState("Loading beta operations…");
  const [tab, setTab] = useState<"overview" | "participants" | "feedback">("overview");
  const [selectedParticipant, setSelectedParticipant] = useState<Participant | null>(null);
  const [allowanceDraft, setAllowanceDraft] = useState("");
  const [continuationDrafts, setContinuationDrafts] = useState<Record<string, string>>({});
  const [form, setForm] = useState({ fullName: "", preferredName: "", email: "", allowance: "10" });

  async function load() {
    const response = await authenticatedFetch("/api/admin/beta", { cache: "no-store" });
    const payload = await response.json() as AdminPayload & { error?: string };
    if (!response.ok) throw Error(payload.error || "Could not load beta operations.");
    setData(payload);
    setMessage("");
  }

  useEffect(() => {
    const timer = window.setTimeout(() => { void load().catch((error: unknown) => setMessage(error instanceof Error ? error.message : "Could not load beta operations.")); }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  async function act(body: Record<string, unknown>) {
    const response = await authenticatedFetch("/api/admin/beta", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    const payload = await response.json() as { error?: string };
    if (!response.ok) throw Error(payload.error || "Could not save the admin action.");
    await load();
  }

  function showError(error: unknown, fallback: string) {
    setMessage(error instanceof Error ? error.message : fallback);
  }

  if (!data) {
    return <main className="beta-admin-page"><div className="beta-admin-header"><div><p className="pm-eyebrow">BETA OPERATIONS · SERVER-AUTHORIZED</p><h1>Product Manager beta</h1><p>{message}</p></div></div></main>;
  }

  const openRequests = data.continuationRequests.filter((item) => item.status === "new");

  return <main className="beta-admin-page">
    <header className="beta-admin-header">
      <div><p className="pm-eyebrow">BETA OPERATIONS · SERVER-AUTHORIZED</p><h1>Product Manager beta</h1><p>Manage participant access and product signals without exposing prompts, evidence, artifacts, or workspace content.</p></div>
      <span className="beta-admin-mode">Access mode: {data.accessMode}</span>
    </header>
    {message && <p className="beta-admin-message" role="status">{message}</p>}
    <nav className="beta-admin-tabs" aria-label="Beta admin sections">
      {(["overview", "participants", "feedback"] as const).map((item) => <button key={item} type="button" className={tab === item ? "is-active" : ""} onClick={() => setTab(item)}>{item === "overview" ? "Overview" : item === "participants" ? "Beta users" : "Feedback"}</button>)}
    </nav>

    {tab === "overview" && <section className="beta-admin-section">
      <div className="beta-admin-summary">
        <div><strong>{data.overview.participants}</strong><span>beta PMs</span></div>
        <div><strong>{data.overview.active}</strong><span>active in 7 days</span></div>
        <div><strong>{data.overview.aiRequestsUsed}</strong><span>AI requests used</span></div>
        <div><strong>{data.overview.continuation}</strong><span>access requests</span></div>
      </div>
      <div className="beta-admin-grid">
        <div><h2>Needs attention</h2>{data.needsAttention.length ? data.needsAttention.map((item, index) => <button className="beta-admin-attention" type="button" key={`${item.type}-${item.participantId}-${index}`} onClick={() => { const participant = data.participants.find((candidate) => candidate.id === item.participantId); if (participant) { setSelectedParticipant(participant); setTab("participants"); } }}><span><strong>{item.label}</strong><small>{item.detail}</small></span><span aria-hidden="true">›</span></button>) : <p className="beta-admin-empty">Nothing needs review right now.</p>}</div>
        <div><h2>Country mix</h2>{Object.entries(data.overview.countryBreakdown).length ? Object.entries(data.overview.countryBreakdown).map(([country, count]) => <p key={country}><span>{country}</span><strong>{count}</strong></p>) : <p className="beta-admin-empty">Country data appears after a participant signs in.</p>}</div>
      </div>
      <div className="beta-admin-grid">
        <div><h2>Operating rules</h2><p>Participant access is observational. Existing authentication remains unchanged.</p><p>Only meaningful AI generation consumes allowance; reads, navigation, evidence browsing, exports, and feedback do not.</p><p>Admin analytics use engagement metadata only, never PM content.</p></div>
        <div><h2>Continuation requests</h2>{openRequests.length ? openRequests.slice(0, 5).map((item) => <ContinuationReview key={item.id} item={item} participant={data.participants.find((candidate) => candidate.id === item.participant_id)} draft={continuationDrafts[item.id] || ""} setDraft={(value) => setContinuationDrafts((current) => ({ ...current, [item.id]: value }))} onAct={act} onError={showError} />) : <p className="beta-admin-empty">No continuation requests are waiting.</p>}</div>
      </div>
    </section>}

    {tab === "participants" && <section className="beta-admin-section">
      <form className="beta-admin-form" onSubmit={(event) => { event.preventDefault(); void act({ action: "create_participant", ...form, allowance: Number(form.allowance) }).then(() => setForm({ fullName: "", preferredName: "", email: "", allowance: "10" })).catch((error: unknown) => showError(error, "Could not add participant.")); }}><input aria-label="Full name" placeholder="Full name" value={form.fullName} onChange={(event) => setForm({ ...form, fullName: event.target.value })} required /><input aria-label="Preferred name" placeholder="Preferred name" value={form.preferredName} onChange={(event) => setForm({ ...form, preferredName: event.target.value })} /><input aria-label="Email" type="email" placeholder="Email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} required /><input aria-label="Allowance" type="number" min="0" placeholder="Requests" value={form.allowance} onChange={(event) => setForm({ ...form, allowance: event.target.value })} /><button type="submit">Add participant</button></form>
      <div className="beta-admin-table-wrap"><table><caption className="sr-only">Beta participant engagement</caption><thead><tr><th>Name</th><th>Email</th><th>Country</th><th>Requests</th><th>Last active</th><th>Workflow progress</th><th>Useful output</th><th>Status</th><th /></tr></thead><tbody>{data.participants.map((participant) => { const limitReached = participant.used >= participant.request_allowance && participant.used > 0; return <tr key={participant.id}><td><strong>{displayName(participant)}</strong><small>{participant.full_name !== displayName(participant) ? participant.full_name : ""}</small></td><td>{participant.email}</td><td>{participant.country_name || "—"}</td><td>{participant.used} / {participant.request_allowance}<small>{participant.remaining} remaining</small></td><td>{formatDate(participant.lastActive)}</td><td>{progressLabel(participant)}</td><td>{participant.usefulOutput ? "Yes" : "Not yet"}</td><td><span className={`beta-admin-status ${limitReached ? "is-limit" : `is-${participant.status}`}`}>{limitReached ? "Limit reached" : participant.status}</span></td><td><div className="beta-admin-row-actions"><button type="button" onClick={() => { setSelectedParticipant(participant); setAllowanceDraft(String(participant.request_allowance)); }}>Details</button><button type="button" onClick={() => void act({ action: "grant_allowance", id: participant.id, amount: 5 }).catch((error: unknown) => showError(error, "Could not grant allowance."))}>+5</button></div></td></tr>; })}</tbody></table></div>
    </section>}

    {tab === "feedback" && <section className="beta-admin-section"><div className="beta-admin-feedback-list">{data.feedback.length ? data.feedback.map((item) => { const participant = data.participants.find((candidate) => candidate.id === item.participant_id); return <article key={item.id}><div><strong>{participant?.preferred_name || participant?.full_name || "Participant"} · {item.usefulness_rating} / 5</strong><small>{participant?.email || "Participant"} · {participant?.country_name || "Country not detected"} · {formatDate(item.created_at)}</small></div><span className="beta-admin-status">{item.status}</span><p>{item.feedback_text || "No written note."}</p><p className="beta-admin-feedback-meta">{item.would_use_again ? "Would use again" : "Would not use again"} · {item.wants_continued_access ? "Wants continued access" : "No continued access requested"}</p><button type="button" onClick={() => void act({ action: "review_feedback", id: item.id, status: item.wants_continued_access ? "follow_up" : "reviewed" }).catch((error: unknown) => showError(error, "Could not review feedback."))}>{item.status === "new" ? "Mark reviewed" : item.status}</button></article>; }) : <p className="beta-admin-empty">No beta feedback has arrived yet.</p>}</div></section>}

    {selectedParticipant && <div className="beta-admin-drawer-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setSelectedParticipant(null); }}><aside className="beta-admin-drawer" role="dialog" aria-modal="true" aria-labelledby="beta-participant-title"><div className="beta-admin-drawer-header"><div><p className="pm-eyebrow">PARTICIPANT DETAIL</p><h2 id="beta-participant-title">{displayName(selectedParticipant)}</h2><p>{selectedParticipant.email}</p></div><button type="button" className="beta-admin-close" aria-label="Close participant detail" onClick={() => setSelectedParticipant(null)}>×</button></div><dl className="beta-admin-detail-list"><div><dt>Full name</dt><dd>{selectedParticipant.full_name}</dd></div><div><dt>Preferred name</dt><dd>{selectedParticipant.preferred_name || "Not set"}</dd></div><div><dt>Administrative status</dt><dd>{selectedParticipant.status}</dd></div><div><dt>Country</dt><dd>{selectedParticipant.country_name || "Not detected"}{selectedParticipant.country_code ? ` · ${selectedParticipant.country_code}` : ""}</dd></div><div><dt>First seen</dt><dd>{formatDate(selectedParticipant.created_at)}</dd></div><div><dt>Last active</dt><dd>{formatDate(selectedParticipant.lastActive)}</dd></div><div><dt>Requests used</dt><dd>{selectedParticipant.used}</dd></div><div><dt>Allowance</dt><dd>{selectedParticipant.request_allowance}</dd></div><div><dt>Remaining</dt><dd>{selectedParticipant.remaining}</dd></div><div><dt>Limit reached</dt><dd>{formatDate(selectedParticipant.limitReachedAt)}</dd></div><div><dt>Useful output reached</dt><dd>{selectedParticipant.usefulOutput ? "Yes" : "No"}</dd></div><div><dt>Continuation requested</dt><dd>{selectedParticipant.continuationRequested ? "Yes" : "No"}</dd></div><div><dt>Contact Waqas clicked</dt><dd>{selectedParticipant.contactClicked ? `Yes · ${formatDate(selectedParticipant.latestContactClick)}` : "No"}</dd></div><div><dt>Feedback submitted</dt><dd>{selectedParticipant.feedbackSubmitted ? "Yes" : "No"}</dd></div></dl><div className="beta-admin-detail-section"><h3>Workflow progress</h3>{Object.entries(selectedParticipant.workflowProgress).map(([workflow, progress]) => <p key={workflow}><span>{workflow.replaceAll("_", " ")}</span><strong>{progress.completed} completed · {progress.started} started</strong></p>)}</div><div className="beta-admin-detail-section"><h3>Engagement</h3><p><span>Artifacts created</span><strong>{selectedParticipant.artifactsCreated}</strong></p><p><span>Evidence / citation engagement</span><strong>{selectedParticipant.evidenceCitationEngagement}</strong></p></div><div className="beta-admin-detail-section"><h3>Allowance</h3><div className="beta-admin-inline-form"><input aria-label="Participant allowance" type="number" min="0" value={allowanceDraft} onChange={(event) => setAllowanceDraft(event.target.value)} /><button type="button" onClick={() => void act({ action: "update_participant", id: selectedParticipant.id, allowance: Number(allowanceDraft) }).then(() => setMessage("Allowance updated.")).catch((error: unknown) => showError(error, "Could not update allowance."))}>Save allowance</button></div><p className="beta-admin-help">Use +5 for a small extension, or set a total allowance explicitly.</p></div></aside></div>}
  </main>;
}

function ContinuationReview({ item, participant, draft, setDraft, onAct, onError }: { item: ContinuationRequest; participant?: Participant; draft: string; setDraft: (value: string) => void; onAct: (body: Record<string, unknown>) => Promise<void>; onError: (error: unknown, fallback: string) => void }) {
  return <article className="beta-admin-continuation"><span><strong>{participant ? displayName(participant) : item.participant_id.slice(0, 8)}</strong><small>{item.used_at_request} / {item.allowance_at_request} used · {formatDate(item.requested_at)}</small></span><div className="beta-admin-continuation-actions"><button type="button" onClick={() => void onAct({ action: "review_continuation", id: item.id, status: "approved", grantAmount: 5 }).catch((error: unknown) => onError(error, "Could not approve request."))}>Grant +5</button><label><span className="sr-only">Total allowance</span><input type="number" min="0" placeholder="Total" value={draft} onChange={(event) => setDraft(event.target.value)} /><button type="button" disabled={!draft} onClick={() => void onAct({ action: "review_continuation", id: item.id, status: "approved", customAllowance: Number(draft) }).catch((error: unknown) => onError(error, "Could not grant custom allowance."))}>Set</button></label><button type="button" onClick={() => void onAct({ action: "review_continuation", id: item.id, status: "declined" }).catch((error: unknown) => onError(error, "Could not decline request."))}>Decline</button></div></article>;
}
