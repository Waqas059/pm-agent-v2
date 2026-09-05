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

export function MobileWorkspaceNav() {
  const [isOpen, setIsOpen] = useState(false);

  return <div className="relative lg:hidden">
    <button type="button" aria-expanded={isOpen} aria-controls="mobile-workspace-navigation" onClick={() => setIsOpen((current) => !current)} className="flex h-9 items-center gap-2 rounded-lg border border-[#e4e7ec] bg-white px-3 text-xs font-semibold text-[#667085] shadow-sm hover:bg-[#f8fafc]">
      <span className="flex h-5 w-5 items-center justify-center rounded-md bg-[#eef0ff] text-[10px] font-bold text-[#4f46c7]">M</span>
      Menu
      <span aria-hidden className="text-[#98a2b3]">{isOpen ? "×" : "⌄"}</span>
    </button>
    {isOpen && <div id="mobile-workspace-navigation" className="absolute left-0 top-11 z-50 max-h-[calc(100vh-5rem)] w-[min(21rem,calc(100vw-2rem))] overflow-y-auto rounded-2xl border border-[#e4e7ec] bg-white p-3 shadow-[0_18px_42px_rgba(23,32,51,0.16)]">
      {groups.map((group) => <div key={group.label} className="mb-4 last:mb-0"><p className="px-2 py-1 text-[10px] font-bold uppercase tracking-[0.16em] text-[#98a2b3]">{group.label}</p><div className="mt-1 space-y-1">{group.items.map((item) => <a key={`${group.label}-${item.label}`} href={item.href} onClick={() => setIsOpen(false)} className="flex items-center gap-3 rounded-lg px-2 py-2.5 text-sm text-[#667085] hover:bg-[#f5f7fa] hover:text-[#172033]"><span aria-hidden className="flex h-6 w-6 items-center justify-center rounded-md bg-[#f2f4f7] text-[10px] font-bold text-[#98a2b3]">{item.short}</span>{item.label}</a>)}</div></div>)}
    </div>}
  </div>;
}
