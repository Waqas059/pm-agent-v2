import Link from "next/link";

const workflows = [
  {
    eyebrow: "01",
    title: "Discover & synthesize",
    description: "Find the signal in interviews, feedback, and product evidence.",
    status: "Coming next",
  },
  {
    eyebrow: "02",
    title: "Define & specify",
    description: "Turn a validated opportunity into a clear, buildable product brief.",
    status: "Planned",
  },
  {
    eyebrow: "03",
    title: "Align & communicate",
    description: "Create the right update for every stakeholder from the same context.",
    status: "Planned",
  },
];

export default function Home() {
  return (
    <main className="min-h-screen bg-[#f6f8fb] text-[#172033]">
      <div className="mx-auto flex min-h-screen max-w-[1440px] flex-col px-5 py-5 sm:px-8 lg:px-10">
        <header className="flex items-center justify-between border-b border-[#dfe5ee] pb-5">
          <Link className="flex items-center gap-3" href="/" aria-label="PM Agent home">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#172033] text-sm font-bold text-white">
              PM
            </span>
            <span className="text-base font-semibold tracking-[-0.02em]">PM Agent</span>
          </Link>
          <div className="flex items-center gap-3 text-sm text-[#68748a]">
            <span className="hidden sm:inline">Product workspace</span>
            <span className="h-2 w-2 rounded-full bg-[#42b883]" aria-label="System ready" />
          </div>
        </header>

        <div className="grid flex-1 gap-8 py-10 lg:grid-cols-[220px_1fr] lg:gap-14 lg:py-14">
          <aside className="flex flex-row gap-2 lg:flex-col lg:pt-2">
            <nav aria-label="Workspace navigation" className="flex flex-row gap-2 lg:flex-col">
              <a
                href="#overview"
                className="rounded-lg bg-white px-3 py-2 text-sm font-semibold text-[#172033] shadow-sm ring-1 ring-[#dfe5ee]"
              >
                Overview
              </a>
              <a
                href="#workflows"
                className="rounded-lg px-3 py-2 text-sm text-[#68748a] transition-colors hover:bg-white hover:text-[#172033]"
              >
                Workflows
              </a>
              <a
                href="#principles"
                className="rounded-lg px-3 py-2 text-sm text-[#68748a] transition-colors hover:bg-white hover:text-[#172033]"
              >
                Principles
              </a>
            </nav>
          </aside>

          <section id="overview" className="max-w-5xl">
            <div className="max-w-3xl">
              <p className="mb-4 text-xs font-bold uppercase tracking-[0.2em] text-[#4968d8]">
                Your product, understood
              </p>
              <h1 className="max-w-3xl text-4xl font-semibold leading-[1.08] tracking-[-0.05em] text-[#172033] sm:text-6xl">
                Make better product decisions from the context you already have.
              </h1>
              <p className="mt-6 max-w-2xl text-base leading-7 text-[#68748a] sm:text-lg">
                PM Agent is an AI workspace for turning customer evidence, product context, and
                team decisions into useful PM artifacts.
              </p>
            </div>

            <div className="mt-12 grid gap-4 sm:grid-cols-3">
              {[
                ["One workspace", "Your product context stays connected."],
                ["Evidence first", "Separate what is known from what is assumed."],
                ["Built for decisions", "Move from insight to action with clarity."],
              ].map(([title, description]) => (
                <div key={title} className="rounded-2xl border border-[#dfe5ee] bg-white p-5">
                  <p className="text-sm font-semibold text-[#172033]">{title}</p>
                  <p className="mt-2 text-sm leading-6 text-[#68748a]">{description}</p>
                </div>
              ))}
            </div>

            <div id="workflows" className="mt-16">
              <div className="flex items-end justify-between gap-4 border-b border-[#dfe5ee] pb-4">
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#8a95a8]">
                    The connected path
                  </p>
                  <h2 className="mt-2 text-2xl font-semibold tracking-[-0.03em]">Start with the work that matters</h2>
                </div>
                <span className="hidden text-sm text-[#8a95a8] sm:inline">T01 · Foundation</span>
              </div>

              <div className="mt-4 divide-y divide-[#dfe5ee]">
                {workflows.map((workflow) => (
                  <article key={workflow.eyebrow} className="grid gap-3 py-6 sm:grid-cols-[64px_1fr_auto] sm:items-center">
                    <span className="text-sm font-semibold text-[#4968d8]">{workflow.eyebrow}</span>
                    <div>
                      <h3 className="font-semibold text-[#172033]">{workflow.title}</h3>
                      <p className="mt-1 text-sm leading-6 text-[#68748a]">{workflow.description}</p>
                    </div>
                    <span className="w-fit rounded-full bg-[#eef1f8] px-3 py-1 text-xs font-semibold text-[#68748a]">
                      {workflow.status}
                    </span>
                  </article>
                ))}
              </div>
            </div>

            <div id="principles" className="mt-10 rounded-2xl bg-[#172033] p-6 text-white sm:p-8">
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#a8baff]">North star</p>
              <p className="mt-4 max-w-2xl text-xl leading-8 tracking-[-0.02em] text-[#f4f6fb]">
                PM Agent should know your product—not just answer a prompt.
              </p>
              <p className="mt-4 max-w-2xl text-sm leading-6 text-[#b9c2d2]">
                This foundation keeps the product focused on connected workflows, grounded evidence,
                and decisions that teams can explain.
              </p>
            </div>
          </section>
        </div>

        <footer className="border-t border-[#dfe5ee] pt-5 text-xs text-[#8a95a8]">
          PM Agent V2 · Foundation in progress
        </footer>
      </div>
    </main>
  );
}
