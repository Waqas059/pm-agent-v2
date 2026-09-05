"use client";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
export default function CitationChip({citationKey}:{citationKey:string}){
 const [open,setOpen]=useState(false);const [source,setSource]=useState<{label:string;content:string;location:unknown}|null>(null);const [message,setMessage]=useState("");
 async function inspect(){setOpen(!open);if(open||source)return;setMessage("Loading source…");try{
 const db=createClient();const {data:c,error}=await db.from("evidence_citations").select("evidence_item_id,locator").eq("citation_key",citationKey).maybeSingle();if(error||!c)throw Error();
 const {data:e,error:err}=await db.from("evidence_items").select("source_label,content,source_locator").eq("id",c.evidence_item_id).single();if(err||!e)throw Error();
 setSource({label:e.source_label,content:e.content,location:c.locator??e.source_locator});setMessage("");
 }catch{setMessage("Source could not be loaded. Check the evidence library.");}}
 return <span className="kit-citation"><button type="button" aria-expanded={open} onClick={()=>void inspect()}>◎ {citationKey}</button>{open&&<span className="kit-citation-body">{source?<><strong>{source.label}</strong><span>{source.content}</span><small>Source location: {JSON.stringify(source.location)}</small></>:<span role="status">{message}</span>}<a href="#evidence">Open evidence library →</a></span>}</span>;
}
