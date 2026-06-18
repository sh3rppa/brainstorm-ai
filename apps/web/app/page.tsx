export default function Home() {
  return (
    <main className="min-h-screen bg-[#09090b] text-white">
      <section className="mx-auto flex min-h-screen max-w-6xl flex-col justify-center px-6 py-20">
        <div className="max-w-3xl">
          <p className="mb-4 text-sm font-semibold uppercase tracking-[0.35em] text-[#8b5cf6]">
            Brainstorm AI
          </p>

          <h1 className="text-5xl font-black tracking-tight sm:text-7xl">
            From idea to prototype — in one session.
          </h1>

          <p className="mt-8 max-w-2xl text-lg leading-8 text-zinc-300">
            Capture voice, notes, sketches, and messy thinking in one place.
            Brainstorm AI turns raw sessions into summaries, diagrams, briefs,
            code, and clear next steps.
          </p>

          <div className="mt-10 flex flex-col gap-4 sm:flex-row">
            <a
              href="#demo"
              className="rounded-xl bg-[#8b5cf6] px-6 py-4 text-center text-sm font-bold text-white transition hover:bg-[#7c3aed]"
            >
              View product flow
            </a>

            <a
              href="#positioning"
              className="rounded-xl border border-zinc-700 px-6 py-4 text-center text-sm font-bold text-zinc-200 transition hover:border-zinc-400"
            >
              See positioning
            </a>
          </div>
        </div>

        <div
          id="positioning"
          className="mt-20 grid gap-4 border-t border-zinc-800 pt-10 sm:grid-cols-3"
        >
          <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-6">
            <p className="text-3xl font-black text-[#8b5cf6]">01</p>
            <h2 className="mt-4 text-xl font-bold">Capture everything</h2>
            <p className="mt-3 text-sm leading-6 text-zinc-400">
              Voice, notes, canvas sketches, diagrams, and raw ideas stay in one
              session.
            </p>
          </div>

          <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-6">
            <p className="text-3xl font-black text-[#8b5cf6]">02</p>
            <h2 className="mt-4 text-xl font-bold">Process with AI</h2>
            <p className="mt-3 text-sm leading-6 text-zinc-400">
              The session is converted into structured outputs instead of
              disappearing into scattered notes.
            </p>
          </div>

          <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-6">
            <p className="text-3xl font-black text-[#8b5cf6]">03</p>
            <h2 className="mt-4 text-xl font-bold">Deliver action</h2>
            <p className="mt-3 text-sm leading-6 text-zinc-400">
              Summaries, diagrams, project briefs, code blocks, and next steps
              become ready to use.
            </p>
          </div>
        </div>

        <div
          id="demo"
          className="mt-16 rounded-3xl border border-zinc-800 bg-zinc-950 p-6 sm:p-8"
        >
          <p className="text-sm font-semibold uppercase tracking-[0.25em] text-[#8b5cf6]">
            MVP flow
          </p>
          <h2 className="mt-4 text-3xl font-black tracking-tight">
            Record → draw → process → review results
          </h2>
          <p className="mt-4 max-w-2xl text-zinc-400">
            The current local MVP already proves the core flow. This Next.js app
            will become the production web interface without destroying the
            working prototype.
          </p>
        </div>
      </section>
    </main>
  );
}