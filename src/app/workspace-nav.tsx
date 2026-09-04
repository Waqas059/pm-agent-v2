"use client";

import { useEffect, useState } from "react";

const items = [
  { label: "Overview", href: "#overview" },
  { label: "Product context", href: "#context" },
  { label: "Documents", href: "#documents" },
  { label: "Evidence", href: "#evidence" },
  { label: "Workflows", href: "#workflows" },
  { label: "Priorities", href: "#planning" },
  { label: "Metrics", href: "#metrics" },
  { label: "Usage & plan", href: "#usage" },
  { label: "Privacy", href: "#privacy" },
  { label: "Integrations", href: "#integrations" },
  { label: "Feedback", href: "#feedback" },
  { label: "Decisions", href: "#decisions" },
  { label: "Launch readiness", href: "#launch" },
  { label: "Activity", href: "#activity" },
];

export default function WorkspaceNav() {
  const [active, setActive] = useState("#overview");
  useEffect(() => { const update = () => setActive(window.location.hash || "#overview"); update(); window.addEventListener("hashchange", update); return () => window.removeEventListener("hashchange", update); }, []);
  return <nav aria-label="Workspace navigation" className="mt-7 px-4"><p className="px-3 text-[10px] font-bold uppercase tracking-[0.18em] text-[#a0a9b8]">Workspace</p><div className="mt-2 space-y-1">{items.map((item) => <a key={item.href} href={item.href} className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors ${active === item.href ? "bg-[#eef1ff] font-semibold text-[#435ac6]" : "text-[#68748a] hover:bg-[#f5f7fa] hover:text-[#192235]"}`}><span className={`flex h-[18px] w-[18px] items-center justify-center rounded text-[9px] font-bold ${active === item.href ? "bg-[#dfe4ff]" : "bg-[#f3f5f8]"}`}>{item.label.slice(0, 1)}</span>{item.label}</a>)}</div></nav>;
}
