import Link from "next/link";
import {
  ArrowRight, Brain, Compass, Network, ShieldCheck,
  Target, Zap, Layers, GitBranch, BarChart3, PlayCircle,
} from "lucide-react";

const domains = [
  {
    name: "Mind",
    icon: Brain,
    text: "Mental clarity, concentration, cognitive load and emotional regulation signals.",
    available: true,
  },
  {
    name: "Goal",
    icon: Target,
    text: "Goal clarity, personal importance, confidence and next-step readiness.",
    available: true,
  },
  {
    name: "Body / Capacity",
    icon: Zap,
    text: "Energy, recovery, workload tolerance and sustained focus capacity.",
    available: true,
  },
  {
    name: "Scenario",
    icon: Compass,
    text: "Model possible futures before committing to a major decision.",
    available: false,
  },
  {
    name: "Language",
    icon: ShieldCheck,
    text: "Communication patterns, framing and narrative coherence signals.",
    available: false,
  },
  {
    name: "Global",
    icon: Network,
    text: "Connect personal development with external projects and opportunities.",
    available: false,
  },
];

const capabilities = [
  {
    icon: Brain,
    label: "Decision Intelligence",
    desc: "Structured reasoning across cognitive, goal and capacity domains.",
  },
  {
    icon: GitBranch,
    label: "Human Development Graph",
    desc: "Six-domain radial model visualising your development profile.",
  },
  {
    icon: Layers,
    label: "Transparent Recommendations",
    desc: "Every recommendation includes its reasoning, evidence and limitations.",
  },
  {
    icon: BarChart3,
    label: "Decision Twin Simulator",
    desc: "Explore how changes in signals shift decision readiness — before acting.",
  },
];

export default function HomePage() {
  return (
    <main className="min-h-screen overflow-hidden bg-slate-950 text-white">
      {/* Background gradients */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(99,102,241,0.22),transparent_35%),radial-gradient(circle_at_bottom_left,rgba(14,165,233,0.18),transparent_35%)]"
      />

      <div className="relative mx-auto max-w-7xl px-6 py-6 lg:px-8">

        {/* Navigation */}
        <nav
          className="flex items-center justify-between border-b border-white/10 pb-5"
          aria-label="Main navigation"
        >
          <div>
            <p className="text-lg font-semibold tracking-tight">ICF AI Copilot</p>
            <p className="text-xs text-slate-400">
              Integrative Cognitive Framework — Decision Intelligence
            </p>
          </div>
          <div className="flex items-center gap-3">
            <span className="hidden rounded-full border border-amber-400/40 bg-amber-400/10 px-3 py-1 text-xs text-amber-300 sm:inline-flex">
              Release Candidate 1
            </span>
            {/* Demo Mode — prominent nav button */}
            <Link
              href="/demo?mode=demo"
              className="flex items-center gap-1.5 rounded-full border border-indigo-400/40 bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-500"
              aria-label="Launch Demo Mode with a pre-loaded sample assessment"
            >
              <PlayCircle className="h-4 w-4" aria-hidden="true" />
              Demo Mode
            </Link>
          </div>
        </nav>

        {/* Hero */}
        <section
          className="grid min-h-[72vh] items-center gap-12 py-16 lg:grid-cols-[1.15fr_.85fr]"
          aria-labelledby="hero-heading"
        >
          <div>
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-indigo-400/30 bg-indigo-400/10 px-3 py-1 text-sm text-indigo-200">
              <ShieldCheck className="h-4 w-4" aria-hidden="true" />
              IBM AI Builders Challenge — RC1
            </div>

            <h1
              id="hero-heading"
              className="max-w-4xl text-5xl font-semibold leading-tight tracking-tight sm:text-6xl lg:text-7xl"
            >
              Understand yourself.<br />
              Evaluate choices.<br />
              Build a better future.
            </h1>

            <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-300">
              ICF — Integrative Cognitive Framework — transforms cognitive, goal and
              capacity signals into explainable, structured decision support.
            </p>
            <p className="mt-3 max-w-xl text-sm leading-7 text-slate-400">
              Designed for integration with IBM watsonx.ai, Granite and enterprise AI
              governance. This demo uses deterministic local logic — no external API
              calls are made.
            </p>

            <div className="mt-9 flex flex-wrap gap-4">
              {/* Primary CTA */}
              <Link
                href="/demo"
                className="inline-flex items-center gap-2 rounded-full bg-white px-6 py-3 font-semibold text-slate-950 hover:bg-slate-200"
              >
                Start assessment <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Link>
              {/* Demo Mode CTA */}
              <Link
                href="/demo?mode=demo"
                className="inline-flex items-center gap-2 rounded-full border border-indigo-400/40 bg-indigo-600 px-6 py-3 font-semibold text-white hover:bg-indigo-500"
                aria-label="Load a pre-filled sample profile and see all features instantly"
              >
                <PlayCircle className="h-4 w-4" aria-hidden="true" />
                Demo Mode
              </Link>
              <a
                href="#framework"
                className="rounded-full border border-white/15 px-6 py-3 font-medium hover:bg-white/10"
              >
                View framework
              </a>
            </div>
          </div>

          {/* Hero preview card */}
          <div
            className="rounded-3xl border border-white/10 bg-white/[0.06] p-5 backdrop-blur-xl"
            aria-label="Sample assessment result preview"
          >
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
              {[
                ["Focus Index", "74 / 100"],
                ["Decision Readiness", "68 / 100"],
                ["Primary constraint", "Capacity gap"],
                ["Recommended action", "Reduce scope"],
              ].map(([label, value]) => (
                <div
                  key={label}
                  className="rounded-2xl border border-white/10 bg-slate-900/60 p-4"
                >
                  <p className="text-xs uppercase tracking-wider text-slate-500">{label}</p>
                  <p className="mt-2 text-lg font-semibold">{value}</p>
                </div>
              ))}
            </div>
            <div className="mt-4 rounded-2xl border border-indigo-400/20 bg-indigo-400/10 p-4">
              <div className="flex gap-3">
                <ShieldCheck
                  className="mt-0.5 h-5 w-5 flex-shrink-0 text-indigo-300"
                  aria-hidden="true"
                />
                <div>
                  <p className="text-sm font-medium">Why this recommendation?</p>
                  <p className="mt-1 text-sm leading-6 text-slate-300">
                    Goal clarity is high but current capacity is low. The system
                    recommends protecting the goal and reducing scope rather than
                    adding new commitments.
                  </p>
                </div>
              </div>
            </div>
            <Link
              href="/demo?mode=demo"
              className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold hover:bg-indigo-500"
            >
              <PlayCircle className="h-4 w-4" aria-hidden="true" />
              Explore full demo →
            </Link>
          </div>
        </section>

        {/* Capabilities strip */}
        <section
          className="border-t border-white/10 py-12"
          aria-labelledby="capabilities-heading"
        >
          <h2 id="capabilities-heading" className="sr-only">Platform capabilities</h2>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {capabilities.map(({ icon: Icon, label, desc }) => (
              <div
                key={label}
                className="flex gap-3 rounded-2xl border border-white/10 bg-white/[0.03] p-4"
              >
                <Icon
                  className="mt-0.5 h-5 w-5 flex-shrink-0 text-indigo-400"
                  aria-hidden="true"
                />
                <div>
                  <p className="text-sm font-semibold text-white">{label}</p>
                  <p className="mt-1 text-xs leading-5 text-slate-400">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Framework section */}
        <section
          id="framework"
          className="border-t border-white/10 py-16"
          aria-labelledby="framework-heading"
        >
          <div className="mb-10 max-w-2xl">
            <p className="text-sm font-medium uppercase tracking-[0.2em] text-indigo-300">
              ICF Framework
            </p>
            <h2
              id="framework-heading"
              className="mt-3 text-3xl font-semibold"
            >
              Six domains of human development
            </h2>
            <p className="mt-3 text-sm leading-7 text-slate-400">
              This release assesses{" "}
              <strong className="text-white">Mind</strong>,{" "}
              <strong className="text-white">Goal</strong> and{" "}
              <strong className="text-white">Body / Capacity</strong>.
              Scenario, Language and Global domains are on the product roadmap.
            </p>
          </div>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {domains.map(({ name, icon: Icon, text, available }) => (
              <div
                key={name}
                className={`rounded-2xl border p-5 ${
                  available
                    ? "border-indigo-400/30 bg-indigo-400/5"
                    : "border-white/10 bg-white/[0.04] opacity-60"
                }`}
              >
                <div className="flex items-center justify-between">
                  <Icon
                    className={`h-6 w-6 ${available ? "text-indigo-300" : "text-slate-500"}`}
                    aria-hidden="true"
                  />
                  {available ? (
                    <span className="text-xs text-indigo-400">Available</span>
                  ) : (
                    <span className="text-xs text-slate-600">Roadmap</span>
                  )}
                </div>
                <h3 className="mt-5 text-lg font-medium">{name}</h3>
                <p className="mt-2 text-sm leading-6 text-slate-400">{text}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Trust & Safety notice */}
        <section className="border-t border-white/10 py-10">
          <div className="mx-auto max-w-2xl text-center text-xs leading-6 text-slate-500">
            <p className="font-medium text-slate-400">Decision Support — Not a Diagnosis</p>
            <p className="mt-2">
              ICF AI Copilot is intended to support human decision-making and
              should not be interpreted as a medical or psychological diagnosis.
              It does not provide treatment, therapy or emergency mental-health
              services. Always apply professional judgement when making significant
              decisions.
            </p>
          </div>
        </section>

      </div>

      {/* Footer */}
      <footer className="border-t border-white/10 py-8 text-center text-xs text-slate-600">
        <p>
          ICF AI Copilot — Integrative Cognitive Framework · Explainable Decision
          Intelligence
        </p>
        <p className="mt-1">
          Designed for integration with IBM watsonx.ai, Granite and enterprise AI
          governance.
        </p>
        <p className="mt-2">
          © {new Date().getFullYear()} ICF AI Copilot
        </p>
      </footer>
    </main>
  );
}
