"use client";

import { FormEvent, useEffect, useState } from "react";
import { getFeedbackLabel, normalizeFeedbackRating, SESSION_FEEDBACK_KEY, type FeedbackRating } from "@/lib/feedback";

type FeedbackEntry = { id: string; area: string; rating: FeedbackRating; note: string; createdAt: string };

const areas = ["Workspace", "Context and evidence", "AI workflows", "Planning and metrics", "Other"];

function readFeedback(): FeedbackEntry[] {
  try {
    const raw = window.localStorage.getItem(SESSION_FEEDBACK_KEY);
    const parsed = raw ? JSON.parse(raw) as unknown : [];
    return Array.isArray(parsed) ? parsed as FeedbackEntry[] : [];
  } catch {
    return [];
  }
}

export default function FeedbackPanel() {
  const [area, setArea] = useState(areas[0]);
  const [rating, setRating] = useState<FeedbackRating>(4);
  const [note, setNote] = useState("");
  const [entries, setEntries] = useState<FeedbackEntry[]>([]);
  const [message, setMessage] = useState("");

  useEffect(() => {
    const timer = window.setTimeout(() => setEntries(readFeedback()), 0);
    return () => window.clearTimeout(timer);
  }, []);

  function submitFeedback(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const entry: FeedbackEntry = { id: crypto.randomUUID(), area, rating: normalizeFeedbackRating(rating), note: note.trim(), createdAt: new Date().toISOString() };
    const nextEntries = [entry, ...entries].slice(0, 10);
    window.localStorage.setItem(SESSION_FEEDBACK_KEY, JSON.stringify(nextEntries));
    setEntries(nextEntries);
    setNote("");
    setMessage("Feedback saved in this browser session.");
  }

  return <div>
    <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start"><div><p className="text-xs font-bold uppercase tracking-[0.18em] text-[#a06bd8]">T22 · BETA FEEDBACK</p><h2 id="feedback-heading" className="mt-2 text-2xl font-semibold tracking-[-0.04em] text-[#192235]">Turn beta use into improvements</h2><p className="mt-2 max-w-2xl text-sm leading-6 text-[#68748a]">Capture a quick rating and note while the experience is fresh. Feedback stays in this browser session and is not sent anywhere automatically.</p></div><span className="inline-flex w-fit items-center gap-2 rounded-full border border-[#eadcf7] bg-[#fbf7ff] px-3 py-2 text-xs font-semibold text-[#8b5fb8]"><span className="h-2 w-2 rounded-full bg-[#a06bd8]" />Beta loop ready</span></div>
    <form onSubmit={submitFeedback} className="mt-6 rounded-xl border border-[#eadcf7] bg-[#fcfaff] p-4 sm:p-5"><div className="grid gap-4 lg:grid-cols-[180px_190px_minmax(0,1fr)]"><label htmlFor="feedback-area" className="grid gap-2 text-xs font-semibold text-[#526075]">Area<select id="feedback-area" value={area} onChange={(event) => setArea(event.target.value)} className="rounded-lg border border-[#d8dee8] bg-white px-3 py-3 text-sm font-normal text-[#192235] outline-none focus:border-[#a06bd8] focus:ring-2 focus:ring-[#eadcf7]">{areas.map((option) => <option key={option}>{option}</option>)}</select></label><label htmlFor="feedback-rating" className="grid gap-2 text-xs font-semibold text-[#526075]">Rating<select id="feedback-rating" value={rating} onChange={(event) => setRating(normalizeFeedbackRating(Number(event.target.value)))} className="rounded-lg border border-[#d8dee8] bg-white px-3 py-3 text-sm font-normal text-[#192235] outline-none focus:border-[#a06bd8] focus:ring-2 focus:ring-[#eadcf7]">{[1, 2, 3, 4, 5].map((value) => <option key={value} value={value}>{value} / 5 · {getFeedbackLabel(value as FeedbackRating)}</option>)}</select></label><label htmlFor="feedback-note" className="grid gap-2 text-xs font-semibold text-[#526075]">What should improve?<textarea id="feedback-note" maxLength={500} value={note} onChange={(event) => setNote(event.target.value)} placeholder="One thing that would make this more useful…" className="min-h-20 resize-y rounded-lg border border-[#d8dee8] bg-white px-3.5 py-3 text-sm font-normal text-[#192235] outline-none placeholder:text-[#a0a9b8] focus:border-[#a06bd8] focus:ring-2 focus:ring-[#eadcf7]" /></label></div><div className="mt-4 flex flex-wrap items-center justify-between gap-3"><p className="text-xs leading-5 text-[#8d98a9]">Local beta note · no account, email, or external service is contacted.</p><button type="submit" className="rounded-lg bg-[#8b5fb8] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#754d9e]">Save feedback</button></div>{message && <p role="status" className="mt-3 text-xs font-semibold text-[#4d8c65]">{message}</p>}</form>
    {entries.length > 0 && <div className="mt-4 rounded-xl border border-[#e3e7ee] bg-white p-4"><div className="flex items-center justify-between gap-3"><p className="text-xs font-bold uppercase tracking-[0.14em] text-[#8d98a9]">This session</p><span className="text-xs text-[#8d98a9]">{entries.length} note{entries.length === 1 ? "" : "s"}</span></div><div className="mt-3 space-y-2">{entries.slice(0, 3).map((entry) => <div key={entry.id} className="flex flex-wrap items-center justify-between gap-2 rounded-lg bg-[#fafbfc] px-3 py-2.5 text-xs"><span className="font-semibold text-[#526075]">{entry.area}</span><span className="text-[#8d98a9]">{entry.rating} / 5 · {getFeedbackLabel(entry.rating)}{entry.note ? ` · ${entry.note}` : ""}</span></div>)}</div></div>}
  </div>;
}
