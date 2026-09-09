const checks = [
  { label: "Local verification", detail: "Tests, lint, type-check, and production build completed in the local repository.", status: "Ready", tone: "ready" },
  { label: "Application health", detail: "The internal health endpoint responds successfully without exposing configuration details.", status: "Ready", tone: "ready" },
  { label: "Source control", detail: "The reviewed application is pushed to the GitHub main branch.", status: "Ready", tone: "ready" },
  { label: "Production deployment", detail: "The production application is deployed on Vercel and available for authenticated UAT.", status: "Ready", tone: "ready" },
  { label: "Authenticated production UAT", detail: "Signup, sign-in, sign-out, and the full connected PM workflow still need a deliberate production run.", status: "Review required", tone: "review" },
  { label: "Deletion verification", detail: "The guarded owner flow is implemented; destructive testing must use a disposable workspace.", status: "Review required", tone: "review" },
  { label: "Leaked-password protection", detail: "The beta accepts the current Free-plan limitation; enabling protection requires a plan decision.", status: "Beta accepted", tone: "accepted" },
  { label: "Retention automation", detail: "Manual-delete policy is active; automatic purge remains disabled until the retention policy is approved.", status: "Product decision", tone: "decision" },
];

const statusClass: Record<string, string> = {
  ready: "bg-[#e4f3e8] text-[#4d8c65]",
  review: "bg-[#fff6e6] text-[#aa7625]",
  accepted: "bg-[#eef1ff] text-[#5269d8]",
  decision: "bg-[#f3f5f8] text-[#68748a]",
};

export default function LaunchReadinessPanel() {
  return <div>
    <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start"><div><p className="text-xs font-bold uppercase tracking-[0.18em] text-[#4d8c65]">LAUNCH READINESS</p><h2 id="launch-heading" className="mt-2 text-2xl font-semibold tracking-[-0.04em] text-[#192235]">Know what is verified</h2><p className="mt-2 max-w-2xl text-sm leading-6 text-[#68748a]">A truthful release checklist: local evidence, production trust gates, and decisions that still need an owner.</p></div><span className="inline-flex w-fit items-center gap-2 rounded-full border border-[#f5dfbd] bg-[#fffaf0] px-3 py-2 text-xs font-semibold text-[#aa7625]"><span className="h-2 w-2 rounded-full bg-[#d6a453]" />4 ready · 4 open gates</span></div>
    <div className="mt-6 grid gap-3 md:grid-cols-2">{checks.map((check) => <article key={check.label} className="rounded-xl border border-[#e3e7ee] bg-white p-4"><div className="flex items-start justify-between gap-3"><h3 className="text-sm font-semibold text-[#192235]">{check.label}</h3><span className={`rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.1em] ${statusClass[check.tone]}`}>{check.status}</span></div><p className="mt-2 text-xs leading-5 text-[#68748a]">{check.detail}</p></article>)}</div>
    <div className="mt-4 rounded-xl border border-[#e3e7ee] bg-[#fafbfc] p-4 sm:p-5"><p className="text-xs font-bold uppercase tracking-[0.14em] text-[#8d98a9]">Next release gate</p><p className="mt-3 text-sm leading-6 text-[#526075]">Run the deliberate production auth/workflow UAT and deletion test against a disposable workspace. This panel reports readiness; it does not deploy, push, delete, or change accounts.</p></div>
  </div>;
}
