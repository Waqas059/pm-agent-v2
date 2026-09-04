"use client";

import Link from "next/link";
import { useEffect } from "react";

export default function Error({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    // Keep the browser console free of product data; the digest is safe to share with support.
    console.error("PM Agent workspace error", { digest: "error" });
  }, []);

  return <main className="flex min-h-screen items-center justify-center bg-[#f7f8fa] px-6 text-[#192235]"><section className="w-full max-w-lg rounded-2xl border border-[#e3e7ee] bg-white p-7 text-center shadow-sm"><p className="text-xs font-bold uppercase tracking-[0.18em] text-[#b45f40]">T19 · RECOVERABLE ERROR</p><h1 className="mt-3 text-2xl font-semibold tracking-[-0.04em]">The workspace needs a reset</h1><p className="mt-3 text-sm leading-6 text-[#68748a]">Your data was not changed. Try loading this view again, or return to the workspace overview.</p><div className="mt-6 flex flex-wrap justify-center gap-3"><button type="button" onClick={() => reset()} className="rounded-lg bg-[#192235] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#303d59]">Try again</button><Link href="#overview" className="rounded-lg border border-[#d8dee8] bg-white px-4 py-2.5 text-sm font-semibold text-[#526075] hover:border-[#bfc8d6]">Go to overview</Link></div></section></main>;
}
