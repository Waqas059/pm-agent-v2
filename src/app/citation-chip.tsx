"use client";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { trackClientProductEvent } from "@/lib/analytics-client";
import { formatSourceLocator } from "./workspace-primitives";
export default function CitationChip({citationKey}:{citationKey:string}){
 const [open,setOpen]=useState(false);const [source,setSource]=useState<{label:string;content:string;location:unknown}|null>(null);const [message,setMessage]=useState("");
 async function inspect(){setOpen(!open);if(open||source)return;setMessage("Loading source…");try{
 const db=createClient();const {data:c,error}=await db.from("evidence_citations").select("evidence_item_id,locator").eq("citation_key",citationKey).maybeSingle();if(error||!c)throw Error();
 const {data:e,error:err}=await db.from("evidence_items").select("source_label,content,source_locator").eq("id",c.evidence_item_id).single();if(err||!e)throw Error();
 setSource({label:e.source_label,content:e.content,location:c.locator??e.source_locator});setMessage("");trackClientProductEvent("evidence_citation_inspected", "citation");
 }catch{setMessage("Source could not be loaded. Check the evidence library.");}}
 const location = source ? formatSourceLocator(source.location) : "";
 return <span className="kit-citation"><button type="button" aria-expanded={open} onClick={()=>void inspect()}>◎ {citationKey}</button>{open&&<span className="kit-citation-body">{source?<><strong>{source.label}</strong><span>{source.content}</span>{location ? <small>Source location: {location}</small> : <small>No source location recorded</small>}</>:<span role="status">{message}</span>}<a href="#evidence">Open evidence library →</a></span>}</span>;
}
