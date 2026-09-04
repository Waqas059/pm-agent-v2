"use client";

export default function GlobalError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <html lang="en"><body className="bg-[#f7f8fa] text-[#192235]"><main className="flex min-h-screen items-center justify-center px-6"><section className="max-w-lg rounded-2xl border border-[#e3e7ee] bg-white p-7 text-center shadow-sm"><p className="text-xs font-bold uppercase tracking-[0.18em] text-[#b45f40]">PM Agent</p><h1 className="mt-3 text-2xl font-semibold">The application needs to restart</h1><p className="mt-3 text-sm leading-6 text-[#68748a]">No product data was changed. Reload the workspace to continue.</p><button type="button" onClick={() => reset()} className="mt-6 rounded-lg bg-[#192235] px-4 py-2.5 text-sm font-semibold text-white">Reload workspace</button></section></main></body></html>;
}
