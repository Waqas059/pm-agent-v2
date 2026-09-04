const checks = [
  { label: "Local verification", detail: "Tests, lint, type-check, and production build completed in the local repository.", status: "Ready" },
  { label: "Application health", detail: "The internal health endpoint responds successfully without exposing configuration details.", status: "Ready" },
  { label: "Source control", detail: "The repository is local and changes have not been pushed to GitHub.", status: "Pending" },
  { label: "Production deployment", detail: "A hosting project, production environment variables, and a deployment review are still required.", status: "Pending" },
];

export default function LaunchReadinessPanel() {
  return <div>
    <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start"><div><p className="text-xs font-bold uppercase tracking-[0.18em] text-[#4d8c65]">T23 · LAUNCH READINESS</p><h2 id="launch-heading" className="mt-2 text-2xl font-semibold tracking-[-0.04em] text-[#192235]">Know what is ready to ship</h2><p className="mt-2 max-w-2xl text-sm leading-6 text-[#68748a]">This checklist separates verified local readiness from production actions that still need an explicit owner and deployment decision.</p></div><span className="inline-flex w-fit items-center gap-2 rounded-full border border-[#f5dfbd] bg-[#fffaf0] px-3 py-2 text-xs font-semibold text-[#aa7625]"><span className="h-2 w-2 rounded-full bg-[#d6a453]" />Review required</span></div>
    <div className="mt-6 grid gap-3 md:grid-cols-2">{checks.map((check) => <article key={check.label} className="rounded-xl border border-[#e3e7ee] bg-white p-4"><div className="flex items-start justify-between gap-3"><h3 className="text-sm font-semibold text-[#192235]">{check.label}</h3><span className={`rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.1em] ${check.status === "Ready" ? "bg-[#e4f3e8] text-[#4d8c65]" : "bg-[#fff6e6] text-[#aa7625]"}`}>{check.status}</span></div><p className="mt-2 text-xs leading-5 text-[#68748a]">{check.detail}</p></article>)}</div>
    <div className="mt-4 rounded-xl border border-[#e3e7ee] bg-[#fafbfc] p-4 sm:p-5"><p className="text-xs font-bold uppercase tracking-[0.14em] text-[#8d98a9]">Before public launch</p><p className="mt-3 text-sm leading-6 text-[#526075]">Confirm the production host, configure server-only secrets there, review Supabase policies and storage, push the reviewed branch, and complete a final authenticated UAT. This panel does not deploy, push, or change accounts.</p></div>
  </div>;
}
