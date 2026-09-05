"use client";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
type Snapshot={name:string;context:number;documents:number;evidence:number;decisions:{id:string;title:string;status:string}[];assumptions:{id:string;statement:string;impact:string;status:string}[];artifacts:{id:string;title:string;kind:string}[];runs:{id:string;workflow_name:string;status:string}[]};
export default function WorkspaceOverview(){
 const [data,setData]=useState<Snapshot|null>(null);const [message,setMessage]=useState("Loading your workspace…");const [revision,setRevision]=useState(0);
 useEffect(()=>{
  try {
   const {data:subscription}=createClient().auth.onAuthStateChange(event=>{
    if(event==="SIGNED_IN"||event==="SIGNED_OUT"){setData(null);setRevision(value=>value+1);}
   });
   return ()=>subscription.subscription.unsubscribe();
  } catch { /* The summary below explains missing configuration. */ }
 },[]);
 useEffect(()=>{let active=true;void(async()=>{try{
 const db=createClient();const {data:auth,error:authError}=await db.auth.getUser();if(authError||!auth.user){if(active)setMessage("Sign in to see your product knowledge and recent work.");return;}
 const {data:w,error}=await db.from("workspaces").select("id,name").order("created_at",{ascending:true}).limit(1).maybeSingle();if(error)throw error;if(!w){if(active)setMessage("Create your workspace in Product context to get started.");return;}
 const [c,d,e,dec,a,art,r]=await Promise.all([
 db.from("context_items").select("id",{count:"exact",head:true}).eq("workspace_id",w.id),
 db.from("documents").select("id",{count:"exact",head:true}).eq("workspace_id",w.id),
 db.from("evidence_items").select("id",{count:"exact",head:true}).eq("workspace_id",w.id),
 db.from("decision_records").select("id,title,status").eq("workspace_id",w.id).order("updated_at",{ascending:false}).limit(3),
 db.from("assumptions").select("id,statement,impact,status").eq("workspace_id",w.id).order("updated_at",{ascending:false}),
 db.from("artifacts").select("id,title,kind").eq("workspace_id",w.id).order("updated_at",{ascending:false}).limit(3),
 db.from("workflow_runs").select("id,workflow_name,status").eq("workspace_id",w.id).order("created_at",{ascending:false}).limit(3)]);
 if([c,d,e,dec,a,art,r].some(item=>item.error))throw Error("load");
 if(active){setData({name:w.name,context:c.count??0,documents:d.count??0,evidence:e.count??0,decisions:dec.data??[],assumptions:a.data??[],artifacts:art.data??[],runs:r.data??[]});setMessage("");}
 }catch{if(active)setMessage("Workspace summary could not be loaded. Open a library or refresh to retry.");}})();return()=>{active=false;};},[revision]);
 return <section className="kit-overview" aria-label="Workspace overview">
 <div className="kit-section-line"><div><p className="kit-eyebrow">THE BIG PICTURE</p><h2>{data?.name??"Your product, in focus"}</h2></div><button onClick={()=>setRevision(v=>v+1)}>Refresh ↻</button></div>
 {message&&<p role="status" className="kit-notice">{message}</p>}
 <div className="kit-bento">
 <a className="kit-summary kit-context-card" href="#context"><span className="kit-eyebrow">01 / CONTEXT</span><strong>{data?data.context:"—"}<small> saved context items</small></strong><p>Goals, customers, constraints.<br/>The foundation for every good question.</p><span className="kit-card-action">Explore product context ↗</span></a>
 <a className="kit-summary kit-evidence-card" href="#evidence"><span className="kit-eyebrow">02 / EVIDENCE</span><strong>{data?data.evidence:"—"}<small> source-backed items</small></strong><p>{data?data.documents:"—"} private documents in your library</p><span className="kit-card-action">Follow the evidence ↗</span></a>
 <article className="kit-summary kit-wide"><div className="kit-section-line"><h3>Recent PM work</h3><a href="#discover">Start investigation ↗</a></div>{data?.runs.length?data.runs.map(r=><a className="kit-record" key={r.id} href={r.workflow_name==="define_specify"?"#define":r.workflow_name==="align_communicate"?"#align":"#discover"}><span>◈ {r.workflow_name.replaceAll("_"," ")}</span><span className="kit-badge">{r.status}</span></a>):<p>Completed investigations will appear here. Start with a question and one trustworthy source.</p>}</article>
 <article className="kit-summary"><div className="kit-section-line"><h3>Decisions</h3><a href="#decisions">View →</a></div>{data?.decisions.length?data.decisions.map(d=><div className="kit-record" key={d.id}><span>{d.title}</span><span className="kit-badge">{d.status}</span></div>):<p>No decisions to show. Keep the direction and its rationale together.</p>}</article>
 <article className="kit-summary kit-risk-card"><div className="kit-section-line"><h3>Assumptions to watch</h3><a href="#decisions">Review →</a></div>{data?.assumptions.filter(a=>a.status==="unvalidated").length?data.assumptions.filter(a=>a.status==="unvalidated").sort((a,b)=>Number(b.impact==="high")-Number(a.impact==="high")).slice(0,3).map(a=><div className="kit-record" key={a.id}><span>{a.statement}</span><span className="kit-badge">{a.impact} impact · {a.status}</span></div>):<p>No unvalidated assumptions to show. Record what needs to be tested.</p>}</article>
 <article className="kit-summary"><div className="kit-section-line"><h3>Recent artifacts</h3><a href="#artifacts">Library →</a></div>{data?.artifacts.length?data.artifacts.map(a=><a className="kit-record" key={a.id} href="#artifacts"><span>▤ {a.title}</span><span>↗</span></a>):<p>Your reviewed briefs and messages will appear here once saved.</p>}</article>
 <a className="kit-summary kit-metrics-card" href="#metrics"><span className="kit-eyebrow">MAKE THE NEXT BET TESTABLE</span><h3>Define success.<br/>Learn with intent.</h3><p>Open your metrics and experiment drafts. Calculations stay transparent.</p><span className="kit-card-action">Metrics & experiments ↗</span></a>
 </div></section>;
}
