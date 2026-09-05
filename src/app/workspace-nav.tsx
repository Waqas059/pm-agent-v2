"use client";

import { useEffect, useState } from "react";

const groups = [
  {
    label: "Workspace",
    items: [
      { label: "Home", href: "#overview", short: "H" },
      { label: "Ask PM Agent", href: "#pm-entry", short: "A" },
      { label: "Activity", href: "#activity", short: "A" },
    ],
  },
  {
    label: "Knowledge",
    items: [
      { label: "Product context", href: "#context", short: "C" },
      { label: "Documents", href: "#documents", short: "D" },
      { label: "Evidence", href: "#evidence", short: "E" },
    ],
  },
  {
    label: "Think & decide",
    items: [
      { label: "Discover", href: "#discover", short: "D" },
      { label: "Priorities", href: "#planning", short: "P" },
      { label: "Decisions & assumptions", href: "#decisions", short: "D" },
    ],
  },
  {
    label: "Build & communicate",
    items: [
      { label: "Define / PRDs", href: "#define", short: "D" },
      { label: "Metrics & experiments", href: "#metrics", short: "M" },
      { label: "Align", href: "#align", short: "A" },
      { label: "Artifacts", href: "#artifacts", short: "A" },
    ],
  },
  {
    label: "Workspace controls",
    items: [
      { label: "Usage", href: "#usage", short: "U" },
      { label: "AI observability", href: "#observability", short: "O" },
      { label: "Privacy", href: "#privacy", short: "P" },
      { label: "Integrations", href: "#integrations", short: "I" },
      { label: "Feedback", href: "#feedback", short: "F" },
      { label: "Launch readiness", href: "#launch", short: "L" },
    ],
  },
];

export default function WorkspaceNav() {
  const [active, setActive] = useState("#overview");
  useEffect(() => { const update = () => setActive(window.location.hash || "#overview"); update(); window.addEventListener("hashchange", update); return () => window.removeEventListener("hashchange", update); }, []);
  return <nav aria-label="Workspace navigation" className="mt-7 overflow-y-auto px-4 pb-4">{groups.map((group) => <div key={group.label} className="mb-6 last:mb-0"><p className="px-3 text-[10px] font-bold uppercase tracking-[0.18em] text-[#98a2b3]">{group.label}</p><div className="mt-2 space-y-1">{group.items.map((item) => <a key={`${group.label}-${item.label}`} href={item.href} aria-current={active === item.href ? "page" : undefined} className={`flex items-center gap-3 rounded-lg px-3 py-2 text-[13px] transition-colors ${active === item.href ? "bg-[#eef0ff] font-semibold text-[#4338a8]" : "text-[#667085] hover:bg-[#f5f7fa] hover:text-[#172033]"}`}><span aria-hidden className={`flex h-6 w-6 items-center justify-center rounded-md text-[10px] font-bold ${active === item.href ? "bg-[#dfe2ff] text-[#4f46c7]" : "bg-[#f2f4f7] text-[#98a2b3]"}`}>{item.short}</span>{item.label}</a>)}</div></div>)}</nav>;
}
