import Link from "next/link";
import { ArrowRight, Brain, Compass, Network, ShieldCheck, Sparkles, Target } from "lucide-react";

const domains = [
  { name: "Mind", icon: Brain, text: "Understand cognitive patterns, strengths and constraints." },
  { name: "Goal", icon: Target, text: "Turn ambitions into evidence-informed action pathways." },
  { name: "Scenario", icon: Compass, text: "Compare possible futures before committing to a decision." },
  { name: "Global", icon: Network, text: "Connect personal development with projects and opportunities." },
];

export default function HomePage() {
  return (
    <main className="min-h-screen overflow-hidden bg-slate-950 text-white">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(99,102,241,0.22),transparent_35%),radial-gradient(circle_at_bottom_left,rgba(14,165,233,0.18),transparent_35%)]" />
      <div className="relative mx-auto max-w-7xl px-6 py-6 lg:px-8">
        <nav className="flex items-center justify-between border-b border-white/10 pb-5">
          <div>
            <p className="text-lg font-semibold tracking-tight">ICF AI Copilot</p>
            <p className="text-xs text-slate-400">Decision Intelligence for Human Development</p>
          </div>
          <Link href="/dashboard" className="rounded-full border border-white/15 px-4 py-2 text-sm font-medium hover:bg-white/10">
            Open demo
          </Link>
        </nav>

        <section className="grid min-h-[72vh] items-center gap-12 py-16 lg:grid-cols-[1.15fr_.85fr]">
          <div>
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-indigo-400/30 bg-indigo-400/10 px-3 py-1 text-sm text-indigo-200">
              <Sparkles className="h-4 w-4" /> IBM AI Builders Challenge prototype
            </div>
            <h1 className="max-w-4xl text-5xl font-semibold leading-tight tracking-tight sm:text-6xl lg:text-7xl">
              Understand yourself. Evaluate choices. Build a better future.
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-300">
              ICF AI Copilot transforms human-development signals into explainable decisions, risk awareness and practical next steps.
            </p>
            <div className="mt-9 flex flex-wrap gap-4">
              <Link href="/dashboard" className="inline-flex items-center gap-2 rounded-full bg-white px-6 py-3 font-medium text-slate-950 hover:bg-slate-200">
                Explore the prototype <ArrowRight className="h-4 w-4" />
              </Link>
              <a href="#framework" className="rounded-full border border-white/15 px-6 py-3 font-medium hover:bg-white/10">
                View framework
              </a>
            </div>
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/[0.06] p-5 backdrop-blur-xl">
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div>
                <p className="text-sm text-slate-400">Decision Twin</p>
                <p className="font-medium">Current development snapshot</p>
              </div>
              <span className="rounded-full bg-emerald-400/15 px-3 py-1 text-xs text-emerald-300">Demo mode</span>
            </div>
            <div className="mt-5 grid grid-cols-2 gap-3">
              {[['Focus index','78%'],['Readiness','High'],['Primary risk','Overload'],['Next action','Prioritize']].map(([label,value]) => (
                <div key={label} className="rounded-2xl border border-white/10 bg-slate-900/60 p-4">
                  <p className="text-xs uppercase tracking-wider text-slate-500">{label}</p>
                  <p className="mt-2 text-xl font-semibold">{value}</p>
                </div>
              ))}
            </div>
            <div className="mt-4 rounded-2xl border border-indigo-400/20 bg-indigo-400/10 p-4">
              <div className="flex gap-3">
                <ShieldCheck className="mt-0.5 h-5 w-5 text-indigo-300" />
                <div>
                  <p className="font-medium">Explainable recommendation</p>
                  <p className="mt-1 text-sm leading-6 text-slate-300">Reduce parallel commitments and complete one high-impact milestone before opening a new workstream.</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id="framework" className="border-t border-white/10 py-16">
          <div className="mb-8 max-w-2xl">
            <p className="text-sm font-medium uppercase tracking-[0.2em] text-indigo-300">ICF Framework</p>
            <h2 className="mt-3 text-3xl font-semibold">From signals to decisions</h2>
          </div>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {domains.map(({ name, icon: Icon, text }) => (
              <div key={name} className="rounded-2xl border border-white/10 bg-white/[0.04] p-5">
                <Icon className="h-6 w-6 text-indigo-300" />
                <h3 className="mt-5 text-lg font-medium">{name}</h3>
                <p className="mt-2 text-sm leading-6 text-slate-400">{text}</p>
              </div>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
