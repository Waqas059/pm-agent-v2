import Link from "next/link";

import AlignWorkflowPanel from "./align-workflow-panel";
import ArtifactLibraryPanel from "./artifact-library-panel";
import AuthPanel from "./auth-panel";
import DefineWorkflowPanel from "./define-workflow-panel";
import DocumentLibraryPanel from "./document-library-panel";
import DiscoverWorkflowPanel from "./discover-workflow-panel";
import EvidenceLibraryPanel from "./evidence-library-panel";
import ProductContextPanel from "./product-context-panel";
import PrioritizationPanel from "./prioritization-panel";
import MetricsExperimentPanel from "./metrics-experiment-panel";
import WorkspaceNav from "./workspace-nav";
import WorkspaceSearchPanel from "./workspace-search-panel";
import UsagePanel from "./usage-panel";
import PrivacyPanel from "./privacy-panel";
import IntegrationsPanel from "./integrations-panel";
import FeedbackPanel from "./feedback-panel";
import LaunchReadinessPanel from "./launch-readiness-panel";
import DecisionAssumptionPanel from "./decision-assumption-panel";
import PmEntryPanel from "./pm-entry-panel";
import ObservabilityPanel from "./observability-panel";

type IconName =
  | "activity"
  | "arrow"
  | "book"
  | "check"
  | "chevron"
  | "context"
  | "home"
  | "plus"
  | "search"
  | "settings"
  | "sparkle"
  | "users";

function Icon({ name, className = "h-5 w-5" }: { name: IconName; className?: string }) {
  const common = {
    className,
    fill: "none",
    stroke: "currentColor",
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    strokeWidth: 1.8,
    viewBox: "0 0 24 24",
    "aria-hidden": true,
  };

  switch (name) {
    case "activity":
      return <svg {...common}><path d="M3 12h4l2.2-7 4.1 14 2.2-7H21" /></svg>;
    case "arrow":
      return <svg {...common}><path d="M5 12h13M13 6l6 6-6 6" /></svg>;
    case "book":
      return <svg {...common}><path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H20v16H6.5A2.5 2.5 0 0 0 4 21.5v-16Z" /><path d="M4 5.5v16M8 7h8M8 11h6" /></svg>;
    case "check":
      return <svg {...common}><path d="m5 12 4 4L19 6" /></svg>;
    case "chevron":
      return <svg {...common}><path d="m7 9 5 5 5-5" /></svg>;
    case "context":
      return <svg {...common}><path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H20v16H6.5A2.5 2.5 0 0 0 4 21.5v-16Z" /><path d="M4 5.5v16M8 8h8M8 12h6M8 16h4" /></svg>;
    case "home":
      return <svg {...common}><path d="m4 10 8-7 8 7v10a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V10Z" /><path d="M9 21v-6h6v6" /></svg>;
    case "plus":
      return <svg {...common}><path d="M12 5v14M5 12h14" /></svg>;
    case "search":
      return <svg {...common}><circle cx="10.8" cy="10.8" r="6.8" /><path d="m16 16 4.5 4.5" /></svg>;
    case "settings":
      return <svg {...common}><path d="M12 15.2a3.2 3.2 0 1 0 0-6.4 3.2 3.2 0 0 0 0 6.4Z" /><path d="m19.4 15 .1.1a1.8 1.8 0 0 1-2.5 2.5l-.1-.1a1.8 1.8 0 0 0-3.1 1.3v.2a1.8 1.8 0 0 1-3.6 0v-.2a1.8 1.8 0 0 0-3.1-1.3l-.1.1a1.8 1.8 0 0 1-2.5-2.5l.1-.1a1.8 1.8 0 0 0-1.3-3.1h-.2a1.8 1.8 0 0 1 0-3.6h.2a1.8 1.8 0 0 0 1.3-3.1l-.1-.1a1.8 1.8 0 0 1 2.5-2.5l.1.1a1.8 1.8 0 0 0 3.1-1.3V1.2a1.8 1.8 0 0 1 3.6 0v.2a1.8 1.8 0 0 0 3.1 1.3l.1-.1a1.8 1.8 0 0 1 2.5 2.5l-.1.1a1.8 1.8 0 0 0 1.3 3.1h.2a1.8 1.8 0 0 1 0 3.6h-.2a1.8 1.8 0 0 0-1.3 3.1Z" /></svg>;
    case "sparkle":
      return <svg {...common}><path d="m12 3 1.4 5.6L19 10l-5.6 1.4L12 17l-1.4-5.6L5 10l5.6-1.4L12 3ZM19 16l.6 2.4L22 19l-2.4.6L19 22l-.6-2.4L16 19l2.4-.6L19 16Z" /></svg>;
    case "users":
      return <svg {...common}><path d="M16 20v-1.5a4 4 0 0 0-4-4H7a4 4 0 0 0-4 4V20M9.5 10.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7ZM17 11a3 3 0 1 0 0-6M17 14.5a4 4 0 0 1 4 4V20" /></svg>;
  }
}

const workflows = [
  {
    number: "01",
    title: "Discover & synthesize",
    description: "Turn customer evidence into grounded themes and opportunities.",
    status: "Ready",
    available: true,
    accent: "#5269d8",
  },
  {
    number: "02",
    title: "Define & specify",
    description: "Shape a clear, buildable brief from an agreed opportunity.",
    status: "Ready",
    available: true,
    accent: "#a06bd8",
  },
  {
    number: "03",
    title: "Align & communicate",
    description: "Create useful updates from the same product context.",
    status: "Ready",
    available: true,
    accent: "#d17b54",
  },
];

export default function Home() {
  return (
    <main className="min-h-screen bg-[#f7f8fa] text-[#192235]">
      <div className="flex min-h-screen">
        <aside className="hidden w-64 shrink-0 flex-col border-r border-[#e3e7ee] bg-white lg:flex">
          <div className="flex h-20 items-center border-b border-[#e3e7ee] px-6">
            <Link className="flex items-center gap-3" href="#overview" aria-label="PM Agent overview">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#192235] text-xs font-bold tracking-tight text-white">PM</span>
              <span className="text-[15px] font-semibold tracking-[-0.02em]">PM Agent</span>
            </Link>
          </div>

          <div className="px-4 pt-5">
            <div className="rounded-xl border border-[#e3e7ee] bg-[#fafbfc] p-3">
              <p className="px-1 text-[10px] font-bold uppercase tracking-[0.18em] text-[#8d98a9]">Workspace</p>
              <div className="mt-2 flex items-center justify-between gap-2">
                <div className="flex min-w-0 items-center gap-2">
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[#e9edff] text-xs font-bold text-[#5269d8]">P</span>
                  <span className="truncate text-sm font-semibold">Product workspace</span>
                </div>
                <Icon name="chevron" className="h-4 w-4 shrink-0 text-[#8d98a9]" />
              </div>
              <p className="mt-2 px-1 text-xs text-[#8d98a9]">Preview · not connected</p>
            </div>
          </div>

          <WorkspaceNav />

          <div className="mt-auto px-4 pb-5">
            <div className="mb-4 rounded-xl bg-[#192235] p-4 text-white">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#303d59] text-xs font-bold">AI</div>
              <p className="mt-3 text-sm font-semibold">Your product, understood.</p>
              <p className="mt-1 text-xs leading-5 text-[#b9c3d3]">Build context once. Use it across every PM workflow.</p>
            </div>
            <Link href="#settings" className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-[#68748a] hover:bg-[#f5f7fa] hover:text-[#192235]">
              <Icon name="settings" className="h-[18px] w-[18px]" />
              Settings
            </Link>
            <div className="mt-3 flex items-center gap-3 border-t border-[#e3e7ee] px-3 pt-4">
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#dfe7ff] text-xs font-bold text-[#435ac6]">W</span>
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold">Waqas</p>
                <p className="truncate text-xs text-[#8d98a9]">Product manager</p>
              </div>
            </div>
          </div>
        </aside>

        <div className="min-w-0 flex-1">
          <header className="flex h-20 items-center justify-between border-b border-[#e3e7ee] bg-white px-5 sm:px-8 lg:px-10">
            <div className="flex items-center gap-3 lg:hidden">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#192235] text-[10px] font-bold text-white">PM</span>
              <span className="text-sm font-semibold">PM Agent</span>
            </div>
            <div className="hidden items-center gap-2 text-sm text-[#8d98a9] lg:flex">
              <span>Product workspace</span>
              <span className="text-[#c5cbd5]">/</span>
              <span className="font-medium text-[#192235]">Overview</span>
            </div>
            <div className="flex items-center gap-2 sm:gap-4">
              <span className="hidden items-center gap-2 text-xs font-medium text-[#68806f] sm:flex">
                <span className="h-2 w-2 rounded-full bg-[#53b67b]" />
                System ready
              </span>
              <AuthPanel />
              <WorkspaceSearchPanel />
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#dfe7ff] text-xs font-bold text-[#435ac6] lg:hidden">W</span>
            </div>
          </header>

          <div className="mx-auto max-w-[1440px] px-5 py-8 sm:px-8 sm:py-10 lg:px-10 lg:py-12">
            <section id="overview" aria-labelledby="overview-heading" className="flex flex-col justify-between gap-6 border-b border-[#e3e7ee] pb-8 sm:flex-row sm:items-end">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#5269d8]">Workspace overview</p>
                <h1 id="overview-heading" className="mt-3 text-3xl font-semibold tracking-[-0.05em] text-[#192235] sm:text-4xl">Make your product easier to understand.</h1>
                <p className="mt-3 max-w-2xl text-sm leading-6 text-[#68748a] sm:text-base">Welcome back, Waqas. This is the shared space for your product context, evidence, and decisions.</p>
              </div>
              <span className="inline-flex w-fit items-center gap-2 rounded-full border border-[#e3e7ee] bg-white px-3 py-2 text-xs font-semibold text-[#68748a]">
                <span className="h-2 w-2 rounded-full bg-[#d6a453]" />
                Preview workspace
              </span>
            </section>

            <section aria-label="Workspace status" className="grid gap-3 py-7 sm:grid-cols-2 xl:grid-cols-4">
              {[
                { label: "Product context", value: "Not added yet", detail: "Start with the essentials", icon: "context" as IconName },
                { label: "Documents", value: "Secure library", detail: "Upload source files below", icon: "book" as IconName },
                { label: "Evidence", value: "Traceable only", detail: "Record source-backed items", icon: "check" as IconName },
                { label: "Workflows", value: "3 connected paths", detail: "Ready to be built", icon: "sparkle" as IconName },
              ].map((item) => (
                <div key={item.label} className="rounded-xl border border-[#e3e7ee] bg-white p-4 sm:p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-xs font-semibold text-[#8d98a9]">{item.label}</p>
                      <p className="mt-2 text-lg font-semibold tracking-[-0.02em] text-[#192235]">{item.value}</p>
                      <p className="mt-1 text-xs text-[#8d98a9]">{item.detail}</p>
                    </div>
                    <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#f1f3ff] text-[#5269d8]"><Icon name={item.icon} className="h-[18px] w-[18px]" /></span>
                  </div>
                </div>
              ))}
            </section>

            <section id="pm-entry" aria-labelledby="pm-entry-heading" className="mt-8 rounded-2xl border border-[#e3e7ee] bg-white p-5 sm:p-7">
              <PmEntryPanel />
            </section>

            <div className="grid gap-6 xl:grid-cols-[minmax(0,1.45fr)_minmax(300px,0.8fr)]">
              <section id="context" aria-labelledby="context-heading" className="rounded-2xl border border-[#e3e7ee] bg-white p-5 sm:p-7">
                <ProductContextPanel />
              </section>

              <section id="activity" aria-labelledby="activity-heading" className="rounded-2xl border border-[#e3e7ee] bg-white p-5 sm:p-7">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#8d98a9]">Workspace pulse</p>
                    <h2 id="activity-heading" className="mt-2 text-xl font-semibold tracking-[-0.03em] text-[#192235]">Recent activity</h2>
                  </div>
                  <Icon name="activity" className="h-5 w-5 text-[#a5afbe]" />
                </div>
                <div className="mt-8 flex min-h-40 flex-col items-center justify-center rounded-xl border border-dashed border-[#d8dee8] px-5 text-center">
                  <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[#f3f5fb] text-[#8692a6]"><Icon name="activity" className="h-[18px] w-[18px]" /></span>
                  <p className="mt-3 text-sm font-semibold text-[#526075]">Your workspace is ready.</p>
                  <p className="mt-1 max-w-xs text-xs leading-5 text-[#9aa4b3]">Activity will appear here as context and decisions are added.</p>
                </div>
              </section>
            </div>

            <section id="documents" aria-labelledby="documents-heading" className="mt-6 rounded-2xl border border-[#e3e7ee] bg-white p-5 sm:p-7">
              <DocumentLibraryPanel />
            </section>

            <section id="evidence" aria-labelledby="evidence-heading" className="mt-6 rounded-2xl border border-[#e3e7ee] bg-white p-5 sm:p-7">
              <EvidenceLibraryPanel />
            </section>

            <section id="discover" aria-labelledby="discover-heading" className="mt-8 rounded-2xl border border-[#e3e7ee] bg-white p-5 sm:p-7">
              <DiscoverWorkflowPanel />
            </section>

            <section id="define" aria-labelledby="define-heading" className="mt-8 rounded-2xl border border-[#e3e7ee] bg-white p-5 sm:p-7">
              <DefineWorkflowPanel />
            </section>

            <section id="align" aria-labelledby="align-heading" className="mt-8 rounded-2xl border border-[#e3e7ee] bg-white p-5 sm:p-7">
              <AlignWorkflowPanel />
            </section>

            <section id="artifacts" aria-labelledby="artifacts-heading" className="mt-8 rounded-2xl border border-[#e3e7ee] bg-white p-5 sm:p-7">
              <ArtifactLibraryPanel />
            </section>

            <section id="planning" aria-labelledby="planning-heading" className="mt-8 rounded-2xl border border-[#e3e7ee] bg-white p-5 sm:p-7">
              <PrioritizationPanel />
            </section>

            <section id="metrics" aria-labelledby="metrics-heading" className="mt-8 rounded-2xl border border-[#e3e7ee] bg-white p-5 sm:p-7">
              <MetricsExperimentPanel />
            </section>

            <section id="usage" aria-labelledby="usage-heading" className="mt-8 rounded-2xl border border-[#e3e7ee] bg-white p-5 sm:p-7">
              <UsagePanel />
            </section>

            <section id="observability" aria-labelledby="observability-heading" className="mt-8 rounded-2xl border border-[#e3e7ee] bg-white p-5 sm:p-7">
              <ObservabilityPanel />
            </section>

            <section id="privacy" aria-labelledby="privacy-heading" className="mt-8 rounded-2xl border border-[#e3e7ee] bg-white p-5 sm:p-7">
              <PrivacyPanel />
            </section>

            <section id="integrations" aria-labelledby="integrations-heading" className="mt-8 rounded-2xl border border-[#e3e7ee] bg-white p-5 sm:p-7">
              <IntegrationsPanel />
            </section>

            <section id="feedback" aria-labelledby="feedback-heading" className="mt-8 rounded-2xl border border-[#e3e7ee] bg-white p-5 sm:p-7">
              <FeedbackPanel />
            </section>

            <section id="decisions" aria-labelledby="decision-assumption-heading" className="mt-8 rounded-2xl border border-[#e3e7ee] bg-white p-5 sm:p-7">
              <DecisionAssumptionPanel />
            </section>

            <section id="launch" aria-labelledby="launch-heading" className="mt-8 rounded-2xl border border-[#e3e7ee] bg-white p-5 sm:p-7">
              <LaunchReadinessPanel />
            </section>

            <section id="workflows" aria-labelledby="workflows-heading" className="mt-8">
              <div className="flex items-end justify-between gap-4 border-b border-[#e3e7ee] pb-4">
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#8d98a9]">The connected path</p>
                  <h2 id="workflows-heading" className="mt-2 text-2xl font-semibold tracking-[-0.04em] text-[#192235]">Workflows built on your context</h2>
                </div>
                <span className="hidden text-xs font-semibold text-[#a0a9b8] sm:inline">Connected path · T23</span>
              </div>
              <div className="mt-4 grid gap-3 lg:grid-cols-3">
                {workflows.map((workflow) => (
                  <article key={workflow.number} className="group rounded-2xl border border-[#e3e7ee] bg-white p-5 transition-shadow hover:shadow-[0_8px_24px_rgba(25,34,53,0.06)]">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold" style={{ color: workflow.accent }}>{workflow.number}</span>
                      <span className="rounded-full bg-[#f3f5f8] px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.12em] text-[#8d98a9]">{workflow.status}</span>
                    </div>
                    <h3 className="mt-7 text-base font-semibold text-[#192235]">{workflow.title}</h3>
                    <p className="mt-2 min-h-12 text-sm leading-6 text-[#68748a]">{workflow.description}</p>
                    <div className="mt-5 flex items-center gap-2 text-xs font-semibold text-[#a0a9b8]">{workflow.available ? "Open workflow below" : "Available in a later task"} <Icon name="arrow" className="h-3.5 w-3.5" /></div>
                  </article>
                ))}
              </div>
            </section>

            <footer className="mt-10 flex flex-col justify-between gap-2 border-t border-[#e3e7ee] pt-5 text-xs text-[#a0a9b8] sm:flex-row">
              <span>PM Agent V2 · Product workspace preview</span>
              <span>Context first. Evidence grounded. Decisions clearer.</span>
            </footer>
          </div>
        </div>
      </div>
    </main>
  );
}
