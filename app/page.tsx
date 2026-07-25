import Link from "next/link";
import { ArrowRight, Brain, Compass, Network, ShieldCheck, Sparkles, Target, Zap } from "lucide-react";

const domains = [
  { name: "Mind", icon: Brain, text: "Mental clarity, concentration, cognitive load and emotional regulation signals." },
  { name: "Goal", icon: Target, text: "Goal clarity, personal importance, confidence and next-step readiness." },
  { name: "Body / Capacity", icon: Zap, text: "Energy, recovery, workload tolerance and sustained focus capacity." },
  { name: "Scenario", icon: Compass, text: "Compare possible futures before committing to a major decision." },
  { name: "Language", icon: ShieldCheck, text: "Communication patterns, framing and narrative coherence signals." },
  { name: "Global", icon: Network, text: "Connect personal development with external projects and opportunities." },
];

export default function HomePage() {
  return (
    <main className="min-h-screen overflow-hidden bg-slate-950 text-white">
      {/* Background gradients */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(99,102,241,0.22),transparent_35%),radial-gradient(circle_at_bottom_left,rgba(14,165,233,0.18),transparent_35%)]" />

      <div className="relative mx-auto max-w-7xl px-6 py-6 lg:px-8">

        {/* Nav */}
        <nav className="flex items-center justify-between border-b border-white/10 pb-5">
          <div>
            <p className="text-lg font-semibold tracking-tight">ICF AI Copilot</p>
            <p className="text-xs text-slate-400">Decision Intelligence for Human Development</p>
          </div>
          <div className="flex items-center gap-3">
            <span className="hidden rounded-full border border-amber-400/40 bg-amber-400/10 px-3 py-1 text-xs text-amber-300 sm:inline-flex">
              Demo prototype
            </span>
            <Link
              href="/demo"
              className="rounded-full border border-white/15 px-4 py-2 text-sm font-medium hover:bg-white/10"
            >
              Open demo
            </Link>
          </div>
        </nav>

        {/* Hero */}
        <section className="grid min-h-[72vh] items-center gap-12 py-16 lg:grid-cols-[1.15fr_.85fr]">
          <div>
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-indigo-400/30 bg-indigo-400/10 px-3 py-1 text-sm text-indigo-200">
              <Sparkles className="h-4 w-4" /> IBM AI Builders Challenge — Demo Prototype
            </div>

            <h1 className="max-w-4xl text-5xl font-semibold leading-tight tracking-tight sm:text-6xl lg:text-7xl">
              Understand yourself.<br />Evaluate choices.<br />Build a better future.
            </h1>

            <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-300">
              ICF — Integrative Cognitive Framework — transforms psychological, cognitive,
              behavioural and capacity signals into explainable decisions.
            </p>
            <p className="mt-3 max-w-xl text-sm leading-7 text-slate-400">
              Designed for integration with IBM watsonx.ai, Granite and enterprise AI governance.
              This demo uses deterministic local logic — no external API calls are made.
            </p>

            <div className="mt-9 flex flex-wrap gap-4">
              <Link
                href="/demo"
                className="inline-flex items-center gap-2 rounded-full bg-white px-6 py-3 font-medium text-slate-950 hover:bg-slate-200"
              >
                Start the assessment <ArrowRight className="h-4 w-4" />
              </Link>
              <a
                href="#framework"
                className="rounded-full border border-white/15 px-6 py-3 font-medium hover:bg-white/10"
              >
                View framework
              </a>
            </div>
          </div>

          {/* Hero card */}
          <div className="rounded-3xl border border-white/10 bg-white/[0.06] p-5 backdrop-blur-xl">
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div>
                <p className="text-sm text-slate-400">Decision Intelligence</p>
                <p className="font-medium">Sample assessment result</p>
              </div>
              <span className="rounded-full bg-amber-400/15 px-3 py-1 text-xs text-amber-300">
                Sample data
              </span>
            </div>
            <div className="mt-5 grid grid-cols-2 gap-3">
              {[["Focus Index","74/100"],["Decision Readiness","68/100"],["Primary risk","Capacity gap"],["Recommended action","Reduce scope"]].map(([label,value]) => (
                <div key={label} className="rounded-2xl border border-white/10 bg-slate-900/60 p-4">
                  <p className="text-xs uppercase tracking-wider text-slate-500">{label}</p>
                  <p className="mt-2 text-lg font-semibold">{value}</p>
                </div>
              ))}
            </div>
            <div className="mt-4 rounded-2xl border border-indigo-400/20 bg-indigo-400/10 p-4">
              <div className="flex gap-3">
                <ShieldCheck className="mt-0.5 h-5 w-5 flex-shrink-0 text-indigo-300" />
                <div>
                  <p className="font-medium text-sm">Why this recommendation?</p>
                  <p className="mt-1 text-sm leading-6 text-slate-300">
                    Goal clarity is high, but current capacity is low. The system recommends protecting the goal and reducing scope rather than adding new commitments.
                  </p>
                </div>
              </div>
            </div>
            <Link
              href="/demo"
              className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold hover:bg-indigo-500"
            >
              Run your own assessment <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </section>

        {/* Framework section */}
        <section id="framework" className="border-t border-white/10 py-16">
          <div className="mb-8 max-w-2xl">
            <p className="text-sm font-medium uppercase tracking-[0.2em] text-indigo-300">ICF Framework</p>
            <h2 className="mt-3 text-3xl font-semibold">Six domains of human development</h2>
            <p className="mt-3 text-slate-400 text-sm leading-7">
              This MVP assesses <strong className="text-white">Mind</strong>, <strong className="text-white">Goal</strong> and <strong className="text-white">Body / Capacity</strong>.
              Language, Scenario and Global are on the roadmap.
            </p>
          </div>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {domains.map(({ name, icon: Icon, text }, i) => (
              <div key={name} className={`rounded-2xl border p-5 ${i < 3 ? "border-indigo-400/30 bg-indigo-400/5" : "border-white/10 bg-white/[0.04] opacity-60"}`}>
                <div className="flex items-center justify-between">
                  <Icon className={`h-6 w-6 ${i < 3 ? "text-indigo-300" : "text-slate-500"}`} />
                  {i >= 3 && <span className="text-xs text-slate-600">Roadmap</span>}
                  {i < 3 && <span className="text-xs text-indigo-400">MVP</span>}
                </div>
                <h3 className="mt-5 text-lg font-medium">{name}</h3>
                <p className="mt-2 text-sm leading-6 text-slate-400">{text}</p>
              </div>
            ))}
          </div>
        </section>

      </div>

      {/* Footer */}
      <footer className="border-t border-white/10 py-8 text-center text-xs text-slate-500">
        <p>ICF AI Copilot is a decision-support and human-development tool.</p>
        <p className="mt-1">It does not provide medical diagnosis, treatment or emergency mental-health services.</p>
        <p className="mt-2 text-slate-600">© {new Date().getFullYear()} ICF AI Copilot — Demo Prototype</p>
      </footer>
    </main>
  );
}
