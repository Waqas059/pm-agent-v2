"use client";

import { useEffect, useMemo, useState } from "react";

type OnboardingStep = {
  id: string;
  label: string;
  description: string;
  href: string;
  action: string;
};

const STORAGE_KEY = "pm-agent.activation-onboarding.v1";

const steps: OnboardingStep[] = [
  {
    id: "context",
    label: "Describe the product",
    description: "Add one durable fact about the product, customer, goal, or current priority.",
    href: "#context",
    action: "Add context",
  },
  {
    id: "source",
    label: "Add source material",
    description: "Upload a product document or record a source-backed observation for the workspace.",
    href: "#documents",
    action: "Open documents",
  },
  {
    id: "investigate",
    label: "Run the first investigation",
    description: "Use Discover to turn the stored context and evidence into a grounded opportunity.",
    href: "#discover",
    action: "Open Discover",
  },
  {
    id: "outcome",
    label: "Capture the outcome",
    description: "Review the result, then save the decision or artifact that your team can act on.",
    href: "#decisions",
    action: "Open decisions",
  },
];

function readProgress(): string[] {
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    const parsed = stored ? JSON.parse(stored) as unknown : [];
    return Array.isArray(parsed) && parsed.every((value) => typeof value === "string") ? parsed : [];
  } catch {
    return [];
  }
}

export default function ActivationOnboardingPanel() {
  const [completed, setCompleted] = useState<string[]>(() => typeof window === "undefined" ? [] : readProgress());
  const [isDismissed, setIsDismissed] = useState(false);

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(completed));
  }, [completed]);

  const completedCount = useMemo(() => steps.filter((step) => completed.includes(step.id)).length, [completed]);
  const progressLabel = `${completedCount} of ${steps.length} complete`;

  if (isDismissed) {
    return (
      <button type="button" onClick={() => setIsDismissed(false)} className="mb-8 text-xs font-semibold text-[#5269d8] hover:text-[#435ac6]">
        Show getting-started guide
      </button>
    );
  }

  function toggleStep(id: string) {
    setCompleted((current) => current.includes(id) ? current.filter((item) => item !== id) : [...current, id]);
  }

  function resetProgress() {
    setCompleted([]);
  }

  return (
    <section aria-labelledby="activation-heading" className="pm-panel-soft mb-8 p-5 sm:p-7">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#5269d8]">Getting started</p>
          <h2 id="activation-heading" className="mt-2 text-2xl font-semibold tracking-[-0.04em] text-[#192235]">Reach your first useful PM outcome</h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-[#68748a]">Follow the shortest path from product context to a reviewable, evidence-backed investigation. This checklist only saves your local progress; it does not create or delete workspace data.</p>
        </div>
        <div className="flex shrink-0 items-center gap-3">
          <span className="rounded-full border border-[#cdd6f6] bg-white px-3 py-2 text-xs font-semibold text-[#5269d8]">{progressLabel}</span>
          <button type="button" onClick={() => setIsDismissed(true)} className="text-xs font-semibold text-[#68748a] hover:text-[#192235]">Hide</button>
        </div>
      </div>

      <div className="mt-6 grid gap-3 lg:grid-cols-4">
        {steps.map((step, index) => {
          const isComplete = completed.includes(step.id);
          return (
            <article key={step.id} className={`pm-card p-4 ${isComplete ? "border-[#bfe0c8] bg-[#f5fbf6]" : ""}`}>
              <div className="flex items-center justify-between gap-3">
                <span className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold ${isComplete ? "bg-[#d9f0df] text-[#3c8752]" : "bg-[#eef1ff] text-[#5269d8]"}`}>{isComplete ? "✓" : index + 1}</span>
                <button type="button" onClick={() => toggleStep(step.id)} className="text-[11px] font-semibold text-[#68748a] hover:text-[#192235]">{isComplete ? "Undo" : "Mark done"}</button>
              </div>
              <h3 className="mt-4 text-sm font-semibold text-[#192235]">{step.label}</h3>
              <p className="mt-2 min-h-16 text-xs leading-5 text-[#68748a]">{step.description}</p>
              <a href={step.href} className="mt-4 inline-flex items-center gap-2 text-xs font-semibold text-[#5269d8] hover:text-[#435ac6]">{step.action} <span aria-hidden>→</span></a>
            </article>
          );
        })}
      </div>

      <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-[#dfe4ff] pt-4">
        <p className="text-xs text-[#7d88a2]">Start with context and one trustworthy source. You can come back to this guide anytime.</p>
        <button type="button" onClick={resetProgress} disabled={completed.length === 0} className="text-xs font-semibold text-[#8d98a9] hover:text-[#b4534b] disabled:cursor-not-allowed disabled:opacity-50">Reset checklist</button>
      </div>
    </section>
  );
}
