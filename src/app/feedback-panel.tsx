"use client";

import { FormEvent, useState } from "react";
import { authenticatedFetch } from "@/lib/supabase/auth-fetch";
import { getFeedbackLabel, normalizeFeedbackRating, SESSION_FEEDBACK_KEY, type FeedbackRating } from "@/lib/feedback";

const areas = ["Workspace", "Context and evidence", "AI workflows", "Planning and metrics", "Other"];

export default function FeedbackPanel() {
  const [area, setArea] = useState(areas[0]);
  const [rating, setRating] = useState<FeedbackRating>(4);
  const [wouldUseAgain, setWouldUseAgain] = useState(true);
  const [continuedAccess, setContinuedAccess] = useState(true);
  const [note, setNote] = useState("");
  const [message, setMessage] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  async function submitFeedback(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSaving(true);
    setMessage("");
    const text = `${area}: ${note.trim()}`.trim();
    try {
      const response = await authenticatedFetch("/api/beta/feedback", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ usefulnessRating: normalizeFeedbackRating(rating), wouldUseAgain, wantsContinuedAccess: continuedAccess, feedbackText: text }) });
      const payload = await response.json() as { error?: string };
      if (!response.ok) {
        if (response.status === 422) {
          const existing = window.localStorage.getItem(SESSION_FEEDBACK_KEY);
          window.localStorage.setItem(SESSION_FEEDBACK_KEY, JSON.stringify([{ area, rating, note: note.trim(), createdAt: new Date().toISOString() }, ...(existing ? JSON.parse(existing) as unknown[] : [])].slice(0, 10)));
          setMessage("Saved locally. It will become admin-visible after your beta participant record is registered.");
        } else throw Error(payload.error || "Feedback could not be saved.");
      } else setMessage("Feedback sent to the beta team. Thank you.");
      setNote("");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Feedback could not be saved.");
    } finally { setIsSaving(false); }
  }

  return <div className="beta-feedback-panel">
    <div className="pm-page-header"><div><p className="pm-eyebrow">BETA FEEDBACK</p><h2 id="feedback-heading">Help shape the next access decision</h2><p className="pm-page-description">A short signal helps us understand usefulness and whether the workflow earns continued PM use.</p></div><span className="pm-status-badge pm-status-blue"><span />Private beta</span></div>
    <form onSubmit={submitFeedback} className="beta-feedback-form">
      <div className="beta-feedback-grid">
        <label htmlFor="feedback-area">Area<select id="feedback-area" value={area} onChange={(event) => setArea(event.target.value)}>{areas.map((option) => <option key={option}>{option}</option>)}</select></label>
        <label htmlFor="feedback-rating">Usefulness<select id="feedback-rating" value={rating} onChange={(event) => setRating(normalizeFeedbackRating(Number(event.target.value)))}>{[1, 2, 3, 4, 5].map((value) => <option key={value} value={value}>{value} / 5 · {getFeedbackLabel(value as FeedbackRating)}</option>)}</select></label>
        <label htmlFor="feedback-note">What should improve?<textarea id="feedback-note" maxLength={1900} value={note} onChange={(event) => setNote(event.target.value)} placeholder="What helped, confused you, or slowed down a decision?" /></label>
      </div>
      <fieldset><legend>Would you use Bootstrap PM again?</legend><label><input type="radio" checked={wouldUseAgain} onChange={() => setWouldUseAgain(true)} /> Yes</label><label><input type="radio" checked={!wouldUseAgain} onChange={() => setWouldUseAgain(false)} /> No</label></fieldset>
      <fieldset><legend>Would you like continued beta access?</legend><label><input type="radio" checked={continuedAccess} onChange={() => setContinuedAccess(true)} /> Yes</label><label><input type="radio" checked={!continuedAccess} onChange={() => setContinuedAccess(false)} /> No</label></fieldset>
      <div className="beta-feedback-actions"><p>Feedback is private to the beta team. No external contact is triggered by submitting.</p><button type="submit" className="pm-button pm-button-primary" disabled={isSaving}>{isSaving ? "Sending…" : "Send feedback"}</button></div>
      {message && <p role="status" className="pm-status-message">{message}</p>}
    </form>
  </div>;
}
