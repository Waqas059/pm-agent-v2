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
import ActivationOnboardingPanel from "./activation-onboarding-panel";
import PmEntryPanel from "./pm-entry-panel";
import WorkspaceOverview from "./workspace-overview";
const views = [
["overview","Home","Workspace","⌂"],["pm-entry","Ask PM Agent","Workspace","✦"],
["context","Product context","Knowledge","◫"],["documents","Documents","Knowledge","▤"],["evidence","Evidence","Knowledge","◎"],
["discover","Discover","Think & decide","◈"],["decisions","Decisions & assumptions","Think & decide","◇"],
["planning","Priorities & planning","Build","≡"],["define","Define / PRDs","Build","▧"],["metrics","Metrics & experiments","Build","↗"],
["align","Communicate","Communicate","↗"],["artifacts","Artifacts","Communicate","▣"],
["activity","Recent work","Workspace controls","◷"],["usage","Usage","Workspace controls","◔"],["observability","AI performance","Workspace controls","⌁"],
["privacy","Privacy","Workspace controls","◉"],["integrations","Integrations","Workspace controls","⊞"],["feedback","Feedback","Workspace controls","◌"],
["launch","Launch readiness","Workspace controls","✓"],["settings","Account","Workspace controls","⚙"]
];
const panels = {context:ProductContextPanel,documents:DocumentLibraryPanel,evidence:EvidenceLibraryPanel,discover:DiscoverWorkflowPanel,define:DefineWorkflowPanel,align:AlignWorkflowPanel,artifacts:ArtifactLibraryPanel,decisions:DecisionAssumptionPanel,planning:PrioritizationPanel,metrics:MetricsExperimentPanel,usage:UsagePanel,observability:ObservabilityPanel,privacy:PrivacyPanel,integrations:IntegrationsPanel,feedback:FeedbackPanel,launch:LaunchReadinessPanel};
export default function Home() {
 const [view,setView]=useState("overview"); const [menu,setMenu]=useState(false);
 // Preserve local drafts and results when moving between visited views.
 const [visited,setVisited]=useState<string[]>([]);
 useEffect(()=>{const sync=()=>{const raw=window.location.hash.slice(1); const next=raw==="workflows"?"discover":views.some(([id])=>id===raw)?raw:"overview";setView(next);setVisited(current=>current.includes(next)?current:[...current,next]);setMenu(false);};sync();window.addEventListener("hashchange",sync);return()=>window.removeEventListener("hashchange",sync);},[]);
 useEffect(()=>{const close=(e:KeyboardEvent)=>{if(e.key==="Escape"){setMenu(false);document.getElementById("kit-menu")?.focus();}};window.addEventListener("keydown",close);return()=>window.removeEventListener("keydown",close);},[]);
 const current=views.find(([id])=>id===view)!;
 useEffect(()=>{document.documentElement.scrollTop=0;document.body.scrollTop=0;document.getElementById("kit-main")?.focus({preventScroll:true});},[view]);
 return <div className="kit">
 <a className="kit-skip" href="#kit-main" onClick={event=>{event.preventDefault();document.getElementById("kit-main")?.focus();}}>Skip to content</a>
 <aside className={`kit-sidebar ${menu?"is-open":""}`} id="kit-navigation">
 <a href="#overview" className="kit-brand"><span>p<span className="kit-brand-dot">·</span></span> PM Kit <small>BETA</small></a>
 <div className="kit-workspace-label">YOUR PRODUCT SPACE</div>
 <nav aria-label="Workspace navigation">{[...new Set(views.map(item=>item[2]))].map(group=><div className="kit-nav-group" key={group}><p>{group}</p>{views.filter(item=>item[2]===group).map(([id,label,,icon])=><a key={id} href={`#${id}`} aria-current={view===id?"page":undefined}><span aria-hidden>{icon}</span>{label}</a>)}</div>)}</nav>
 <div className="kit-sidebar-note">Context becomes clarity.<br/><strong>Keep the why with the work.</strong></div>
 </aside>
 <div className="kit-body"><header className="kit-header">
 <button id="kit-menu" className="kit-menu" aria-expanded={menu} aria-controls="kit-navigation" onClick={()=>setMenu(!menu)}>☰ Menu</button>
 <div className="kit-breadcrumb"><span>Workspace</span><span>/</span><strong>{current[1]}</strong></div>
 <div className="kit-header-actions"><WorkspaceSearchPanel/><AuthPanel/></div></header>
 <main id="kit-main" tabIndex={-1}>
 <div hidden={view!=="overview"&&view!=="pm-entry"}>
 <div className="kit-welcome"><p className="kit-eyebrow">A LITTLE CONTEXT. A CLEARER DIRECTION.</p><h1>What are you trying<br className="hidden sm:block"/> to figure out<span>?</span></h1><p>Bring the question. Build on what your product already knows.</p></div>
 <div className="kit-agent"><div className="kit-agent-mark" aria-hidden>✦</div><PmEntryPanel/></div>
 {view==="overview"&&<WorkspaceOverview/>}
 <details className="kit-onboarding"><summary>Getting started · your first useful outcome</summary><ActivationOnboardingPanel/></details>
 </div>
 {view!=="overview"&&view!=="pm-entry"&&<div className="kit-view-title"><p className="kit-eyebrow">{current[2]}</p><h1>{current[1]}</h1></div>}
 {["discover","define","align"].includes(view)&&<div className="kit-journey" aria-label="Connected workflow"><a href="#discover" aria-current={view==="discover"?"step":undefined}>01 Discover</a><span>PM review →</span><a href="#define" aria-current={view==="define"?"step":undefined}>02 Define</a><span>PM review →</span><a href="#align" aria-current={view==="align"?"step":undefined}>03 Align</a><p>Review the evidence and approve the direction before continuing. Each workflow runs only when you submit it.</p></div>}
 {Object.entries(panels).map(([id,Panel])=>visited.includes(id)&&<section className="kit-content" hidden={view!==id} key={id} aria-label={views.find(item=>item[0]===id)?.[1]}><Panel/></section>)}
 {view==="activity"&&<WorkspaceOverview/>}
 {view==="settings"&&<section className="kit-content"><h2>Your account</h2><p>Use the account control in the header to sign in or sign out.</p><a href="#privacy">Manage workspace privacy →</a></section>}
 <footer className="kit-footer"><span>PM Kit</span><span>Context → Evidence → Decision → Artifact → Memory</span></footer>
 </main></div></div>;
}
