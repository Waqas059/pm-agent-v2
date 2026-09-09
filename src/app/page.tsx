"use client";

import { useEffect, useState } from "react";
import AuthPanel from "./auth-panel";
import WorkspaceSearchPanel from "./workspace-search-panel";
import ProductContextPanel from "./product-context-panel";
import DocumentLibraryPanel from "./document-library-panel";
import EvidenceLibraryPanel from "./evidence-library-panel";
import DiscoverWorkflowPanel from "./discover-workflow-panel";
import DefineWorkflowPanel from "./define-workflow-panel";
import AlignWorkflowPanel from "./align-workflow-panel";
import ArtifactLibraryPanel from "./artifact-library-panel";
import DecisionAssumptionPanel from "./decision-assumption-panel";
import PrioritizationPanel from "./prioritization-panel";
import MetricsExperimentPanel from "./metrics-experiment-panel";
import UsagePanel from "./usage-panel";
import ObservabilityPanel from "./observability-panel";
import PrivacyPanel from "./privacy-panel";
import IntegrationsPanel from "./integrations-panel";
import FeedbackPanel from "./feedback-panel";
import LaunchReadinessPanel from "./launch-readiness-panel";
import MarketResearchPanel from "./market-research-panel";
import ActivationOnboardingPanel from "./activation-onboarding-panel";
import PmEntryPanel from "./pm-entry-panel";
import WorkspaceOverview from "./workspace-overview";
import ProductWorkScreen from "./product-work-screen";
import UiIcon, { type IconName } from "./ui-icons";
import { PageHeader } from "./workspace-primitives";
import PublicLandingPage from "./public-landing-page";
import { createClient } from "@/lib/supabase/client";
import BetaAllowanceController from "./beta-allowance-controller";

type ViewDefinition = readonly [id: string, label: string, group: string, icon: IconName];

const views: ViewDefinition[] = [
  ["overview", "Home", "Workspace", "home"], ["pm-entry", "Ask PM Agent", "Workspace", "sparkle"], ["search", "Search", "Workspace", "search"],
  ["context", "Product context", "Knowledge", "layers"], ["documents", "Documents", "Knowledge", "files"], ["evidence", "Evidence", "Knowledge", "scan"],
  ["discover", "Discover", "Think & decide", "compass"], ["deliver", "Deliver", "Build", "archive"], ["decisions", "Decisions & assumptions", "Think & decide", "split"],
  ["research", "Market research", "Think & decide", "search"],
  ["planning", "Priorities & planning", "Build", "list"], ["define", "Define / PRDs", "Build", "file"], ["metrics", "Metrics & experiments", "Build", "chart"],
  ["align", "Communicate", "Communicate", "message"], ["artifacts", "Artifacts", "Communicate", "archive"],
  ["activity", "Recent work", "Workspace controls", "clock"], ["usage", "Usage", "Workspace controls", "gauge"], ["observability", "AI performance", "Workspace controls", "activity"],
  ["privacy", "Privacy", "Workspace controls", "shield"], ["integrations", "Integrations", "Workspace controls", "plug"], ["feedback", "Feedback", "Workspace controls", "message"],
  ["launch", "Launch readiness", "Workspace controls", "check"], ["settings", "Account", "Workspace controls", "user"],
];

const panels = {
  context: ProductContextPanel, documents: DocumentLibraryPanel, evidence: EvidenceLibraryPanel,
  discover: DiscoverWorkflowPanel, define: DefineWorkflowPanel, align: AlignWorkflowPanel,
  artifacts: ArtifactLibraryPanel, decisions: DecisionAssumptionPanel, planning: PrioritizationPanel,
  metrics: MetricsExperimentPanel, usage: UsagePanel, observability: ObservabilityPanel,
  privacy: PrivacyPanel, integrations: IntegrationsPanel, feedback: FeedbackPanel, launch: LaunchReadinessPanel, research: MarketResearchPanel,
};

const primaryNavigation: readonly [id: string, label: string, icon: IconName][] = [
  ["overview", "Home", "home"],
  ["discover", "Work", "compass"],
  ["evidence", "Evidence", "scan"],
  ["artifacts", "Artifacts", "archive"],
  ["metrics", "Experiments", "chart"],
  ["research", "Research", "search"],
  ["search", "Search", "search"],
];

function isWorkView(view: string) {
  return ["pm-entry", "discover", "define", "align", "deliver", "planning"].includes(view);
}

const productWorkViews = ["discover", "define", "align", "deliver"] as const;
type ProductWorkView = (typeof productWorkViews)[number];

function isProductWorkView(view: string): view is ProductWorkView {
  return productWorkViews.includes(view as ProductWorkView);
}

function WorkspaceShell() {
  const [view, setView] = useState("overview");
  const [focusTarget, setFocusTarget] = useState<"discover-question" | null>(null);
  const [menu, setMenu] = useState(false);
  // Preserve local drafts and results when moving between visited views.
  const [visited, setVisited] = useState<string[]>([]);

  useEffect(() => {
    const previousScrollRestoration = window.history.scrollRestoration;
    window.history.scrollRestoration = "manual";
    return () => { window.history.scrollRestoration = previousScrollRestoration; };
  }, []);

  useEffect(() => {
    const sync = () => {
      const raw = window.location.hash.slice(1);
      const next = raw === "workflows" || raw === "discover-question" ? "discover" : views.some(([id]) => id === raw) ? raw : "overview";
      setView(next);
      setFocusTarget(raw === "discover-question" ? "discover-question" : null);
      setVisited((current) => current.includes(next) ? current : [...current, next]);
      setMenu(false);
    };
    sync();
    window.addEventListener("hashchange", sync);
    return () => window.removeEventListener("hashchange", sync);
  }, []);

  useEffect(() => {
    const close = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setMenu(false);
        document.getElementById("kit-menu")?.focus();
      }
    };
    window.addEventListener("keydown", close);
    return () => window.removeEventListener("keydown", close);
  }, []);

  useEffect(() => {
    if (menu) document.querySelector<HTMLAnchorElement>("#kit-navigation a")?.focus();
  }, [menu]);

  const current = views.find(([id]) => id === view) ?? views[0];
  const activeProductWorkView = isProductWorkView(view) ? view : "discover";
  const hasVisitedProductWork = visited.some((id) => isProductWorkView(id));
  const hasOwnPageHeader = ["evidence", "artifacts", "metrics", "research", "search", "settings"].includes(view);

  useEffect(() => {
    const resetRoutePosition = () => {
      if (!window.navigator.userAgent.toLowerCase().includes("jsdom")) {
        window.scrollTo({ top: 0, left: 0, behavior: "auto" });
      }
      document.documentElement.scrollTop = 0;
      document.body.scrollTop = 0;
      document.getElementById("kit-main")?.focus({ preventScroll: true });
    };
    resetRoutePosition();
    const frame = window.requestAnimationFrame(resetRoutePosition);
    const timeout = window.setTimeout(resetRoutePosition, 0);
    return () => { window.cancelAnimationFrame(frame); window.clearTimeout(timeout); };
  }, [view]);

  return (
    <div className="kit">
      <BetaAllowanceController />
      <a className="kit-skip" href="#kit-main" onClick={(event) => { event.preventDefault(); document.getElementById("kit-main")?.focus(); }}>Skip to content</a>

      <aside className={`kit-sidebar ${menu ? "is-open" : ""}`} id="kit-navigation" aria-label="Primary workspace navigation">
        <a href="#overview" className="kit-brand">
          <span className="kit-brand-mark"><UiIcon name="sparkle" size={20} /></span>
          <span className="kit-brand-copy"><strong>Bootstrap PM</strong><small>From questions to impact</small></span>
        </a>
        <nav aria-label="Workspace navigation">
          <div className="kit-nav-group kit-nav-primary">
            {primaryNavigation.map(([id, label, icon]) => <a key={id} href={`#${id}`} aria-current={(id === "overview" ? view === "overview" : id === "discover" ? isWorkView(view) : view === id) ? "page" : undefined}><span className="kit-nav-icon"><UiIcon name={icon} size={17} /></span><span>{label}</span></a>)}
          </div>
          <div className="kit-nav-group kit-nav-secondary"><a href="#settings" aria-current={view === "settings" ? "page" : undefined}><span className="kit-nav-icon"><UiIcon name="gauge" size={17} /></span><span>Settings</span></a></div>
        </nav>
        <div className="kit-nav-search"><WorkspaceSearchPanel /></div>
        <div className="kit-workspace-selector" aria-label="Current workspace"><span className="kit-workspace-avatar">N</span><span><strong>Workspace</strong><small>Product space</small></span><UiIcon name="chevron-down" size={14} /></div>
        <div className="kit-sidebar-note">Context becomes clarity.<br /><strong>Keep the why with the work.</strong></div>
      </aside>

      {menu && <button type="button" className="kit-sidebar-scrim" aria-label="Close workspace navigation" onClick={() => setMenu(false)} />}

      <div className="kit-body">
        <header className="kit-header">
          <button id="kit-menu" className="kit-menu" aria-expanded={menu} aria-controls="kit-navigation" aria-label="Toggle workspace navigation" onClick={() => setMenu(!menu)}>
            <UiIcon name={menu ? "x" : "menu"} size={18} /><span>Menu</span>
          </button>
          <div className="kit-breadcrumb"><span>Workspace</span><span>/</span><strong>{current[1]}</strong></div>
          <div className="kit-header-actions"><span className="kit-notification-status" aria-label="No new notifications"><UiIcon name="bell" size={18} /></span><AuthPanel /></div>
        </header>

        <main id="kit-main" tabIndex={-1}>
          <div hidden={view !== "overview" && view !== "pm-entry"}>
            {view === "overview" && <WorkspaceOverview />}
            {view === "pm-entry" && <section className="signal-pm-entry"><p className="signal-overline">WORKSPACE / ASK PM AGENT</p><h1>Turn a messy question into a clear next step.</h1><PmEntryPanel /></section>}
            <details className="kit-onboarding"><summary>Getting started · your first useful outcome</summary><ActivationOnboardingPanel /></details>
          </div>

          {view === "search" && <section className="pm-page pm-search-page"><PageHeader eyebrow="WORKSPACE SEARCH" title="Search" description="Find product context, evidence, decisions, assumptions, artifacts, and workflow output without losing your place." /><WorkspaceSearchPanel full /></section>}

          {view !== "overview" && view !== "pm-entry" && !isProductWorkView(view) && !hasOwnPageHeader && <div className="kit-view-title"><p className="kit-eyebrow">{current[2]}</p><h1>{current[1]}</h1></div>}

          {hasVisitedProductWork && (
            <section className="product-work-route" hidden={!isProductWorkView(view)} aria-label="Product Work">
              <ProductWorkScreen activeStage={activeProductWorkView} focusTarget={focusTarget} />
            </section>
          )}

          {Object.entries(panels).filter(([id]) => !isProductWorkView(id)).map(([id, Panel]) => visited.includes(id) && (
            <section className="kit-content" hidden={view !== id} key={id} aria-label={views.find((item) => item[0] === id)?.[1]}><Panel /></section>
          ))}
          {view === "activity" && <WorkspaceOverview />}
          {view === "settings" && <section className="pm-page pm-settings-page"><PageHeader eyebrow="WORKSPACE SETTINGS" title="Settings" description="Manage account access, workspace controls, and product operations." /><div className="pm-settings-account"><div><p className="pm-eyebrow">ACCOUNT</p><h2>Authentication and access</h2><p>Use the account control in the header to sign in or sign out. Workspace data remains protected by Supabase.</p></div><UiIcon name="user" size={22} /></div><div className="pm-settings-links"><a href="#privacy"><span><UiIcon name="shield" size={17} /></span><strong>Privacy and deletion</strong><small>Review workspace privacy and deletion controls.</small><UiIcon name="chevron-right" size={15} /></a><a href="#integrations"><span><UiIcon name="plug" size={17} /></span><strong>Integrations</strong><small>Review connected product systems and future connections.</small><UiIcon name="chevron-right" size={15} /></a><a href="#usage"><span><UiIcon name="gauge" size={17} /></span><strong>Usage</strong><small>Inspect current workspace usage instrumentation.</small><UiIcon name="chevron-right" size={15} /></a><a href="#observability"><span><UiIcon name="activity" size={17} /></span><strong>AI performance</strong><small>Review operational AI metadata and run health.</small><UiIcon name="chevron-right" size={15} /></a><a href="#feedback"><span><UiIcon name="message" size={17} /></span><strong>Feedback</strong><small>Share what would make this workspace more useful.</small><UiIcon name="chevron-right" size={15} /></a></div></section>}
          <footer className="kit-footer"><span>PM Kit</span><span>Context → Evidence → Decision → Artifact → Memory</span></footer>
        </main>
      </div>
    </div>
  );
}

export default function Home() {
  const [authReady, setAuthReady] = useState(false);
  const [signedIn, setSignedIn] = useState(false);

  useEffect(() => {
    let active = true;
    try {
      const supabase = createClient();
      void supabase.auth.getSession().then(({ data }) => { if (active) { setSignedIn(Boolean(data.session)); setAuthReady(true); } });
      const { data: subscription } = supabase.auth.onAuthStateChange((_event, session) => { if (active) { setSignedIn(Boolean(session)); setAuthReady(true); } });
      return () => { active = false; subscription.subscription.unsubscribe(); };
    } catch {
      window.setTimeout(() => setAuthReady(true), 0);
      return () => { active = false; };
    }
  }, []);

  if (!authReady) return <main className="public-landing-loading" aria-busy="true"><span className="pm-loading-line pm-loading-line-wide" /><span className="pm-loading-line" /><p>Loading Bootstrap PM…</p></main>;
  return signedIn ? <WorkspaceShell /> : <PublicLandingPage />;
}
