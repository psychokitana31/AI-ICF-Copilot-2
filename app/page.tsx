import Link from "next/link";
import {
  ArrowRight, Brain, Compass, Network, ShieldCheck,
  Target, Zap, Layers, GitBranch, BarChart3, PlayCircle,
} from "lucide-react";

const domains = [
  { name: "Mind",          icon: Brain,       text: "Mental clarity, concentration, cognitive load and emotional regulation signals.", available: true  },
  { name: "Goal",          icon: Target,      text: "Goal clarity, personal importance, confidence and next-step readiness.",          available: true  },
  { name: "Body / Capacity", icon: Zap,       text: "Energy, recovery, workload tolerance and sustained focus capacity.",              available: true  },
  { name: "Scenario",      icon: Compass,     text: "Model possible futures before committing to a major decision.",                   available: false },
  { name: "Language",      icon: ShieldCheck, text: "Communication patterns, framing and narrative coherence signals.",               available: false },
  { name: "Global",        icon: Network,     text: "Connect personal development with external projects and opportunities.",          available: false },
];

const capabilities = [
  { icon: Brain,     label: "Decision Intelligence",      desc: "Structured reasoning across cognitive, goal and capacity domains." },
  { icon: GitBranch, label: "Human Development Graph",    desc: "Six-domain radial model visualising your development profile." },
  { icon: Layers,    label: "Transparent Recommendations", desc: "Every recommendation includes its reasoning, evidence and limitations." },
  { icon: BarChart3, label: "Decision Twin Simulator",    desc: "Explore how changes in signals shift decision readiness — before acting." },
];

/* ── Animated SVG background — pure CSS, no JS, no library ────────────────── */
function NetworkBackground() {
  const nodes = [
    { cx: 80,  cy: 120, r: 3, delay: "0s"    },
    { cx: 240, cy: 60,  r: 2, delay: "0.8s"  },
    { cx: 320, cy: 200, r: 3, delay: "1.6s"  },
    { cx: 160, cy: 280, r: 2, delay: "0.4s"  },
    { cx: 400, cy: 140, r: 3, delay: "2s"    },
    { cx: 60,  cy: 300, r: 2, delay: "1.2s"  },
    { cx: 460, cy: 280, r: 2, delay: "0.6s"  },
    { cx: 200, cy: 160, r: 2, delay: "1.8s"  },
  ];
  const lines = [
    [0, 1], [1, 2], [2, 4], [3, 5], [0, 3],
    [1, 7], [2, 6], [4, 6], [7, 3],
  ];
  return (
    <svg
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 h-full w-full"
      xmlns="http://www.w3.org/2000/svg"
      preserveAspectRatio="xMidYMid slice"
      viewBox="0 0 500 400"
    >
      <defs>
        <radialGradient id="node-glow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#6366f1" stopOpacity="0.8" />
          <stop offset="100%" stopColor="#6366f1" stopOpacity="0" />
        </radialGradient>
      </defs>
      {/* Connection lines */}
      {lines.map((pair, i) => {
        const a = pair[0]; const b = pair[1];
        if (a === undefined || b === undefined) return null;
        const na = nodes[a]; const nb = nodes[b];
        if (!na || !nb) return null;
        return (
          <line
            key={i}
            x1={na.cx} y1={na.cy}
            x2={nb.cx} y2={nb.cy}
            stroke="rgba(99,102,241,0.18)"
            strokeWidth="0.75"
          />
        );
      })}
      {/* Nodes */}
      {nodes.map((n, i) => (
        <g key={i}>
          <circle
            cx={n.cx} cy={n.cy} r={n.r * 4}
            fill="rgba(99,102,241,0.06)"
          />
          <circle
            cx={n.cx} cy={n.cy} r={n.r}
            fill="#6366f1"
            opacity="0.7"
            style={{
              animation: `icf-pulse-glow 3s ${n.delay} ease-in-out infinite`,
            }}
          />
        </g>
      ))}
    </svg>
  );
}

export default function HomePage() {
  return (
    <main className="relative min-h-screen overflow-hidden bg-[#080e1e] text-white">

      {/* ── Multi-layer background ────────────────────────────────────────────── */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0"
        style={{
          background: `
            radial-gradient(ellipse 90% 60% at 65% -5%, rgba(99,102,241,0.14) 0%, transparent 70%),
            radial-gradient(ellipse 60% 40% at 0% 80%, rgba(14,165,233,0.10) 0%, transparent 70%),
            radial-gradient(ellipse 40% 40% at 100% 60%, rgba(99,102,241,0.07) 0%, transparent 70%)
          `,
        }}
      />

      {/* Animated network background — hero zone */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 opacity-60">
        <NetworkBackground />
      </div>

      {/* Subtle horizontal grid lines */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-[0.025]"
        style={{
          backgroundImage: "repeating-linear-gradient(0deg, rgba(99,102,241,1) 0px, transparent 1px, transparent 80px, rgba(99,102,241,1) 80px)",
        }}
      />

      <div className="relative mx-auto max-w-7xl px-6 py-5 lg:px-8">

        {/* ── Navigation ──────────────────────────────────────────────────────── */}
        <nav
          className="flex items-center justify-between py-4 mb-2"
          style={{ borderBottom: "1px solid rgba(99,102,241,0.12)" }}
          aria-label="Main navigation"
        >
          <div className="flex items-center gap-4">
            {/* Wordmark */}
            <div>
              <span className="text-lg font-bold tracking-tight text-white">ICF AI Copilot</span>
              <span className="ml-2 hidden text-xs text-slate-500 sm:inline">
                Integrative Cognitive Framework
              </span>
            </div>
            <span
              className="hidden rounded-md border border-indigo-400/20 bg-indigo-400/8 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-widest text-indigo-400 sm:inline-block"
              style={{ background: "rgba(99,102,241,0.08)" }}
            >
              RC1
            </span>
          </div>
          <div className="flex items-center gap-3">
            <span className="hidden rounded-full border border-amber-400/30 bg-amber-400/8 px-3 py-1 text-xs text-amber-300/80 sm:inline-flex" style={{ background: "rgba(251,191,36,0.06)" }}>
              IBM AI Builders Challenge
            </span>
            <Link
              href="/demo"
              className="rounded-full border border-white/10 px-4 py-1.5 text-sm text-slate-300 hover:border-white/20 hover:text-white"
            >
              Assessment
            </Link>
            <Link
              href="/demo?mode=demo"
              className="flex items-center gap-1.5 rounded-full bg-indigo-600 px-4 py-1.5 text-sm font-semibold text-white hover:bg-indigo-500"
              style={{ boxShadow: "0 0 0 1px rgba(255,255,255,0.08) inset, 0 2px 8px rgba(99,102,241,0.35)" }}
              aria-label="Launch Demo Mode with a pre-loaded sample assessment"
            >
              <PlayCircle className="h-3.5 w-3.5" aria-hidden="true" />
              Demo Mode
            </Link>
          </div>
        </nav>

        {/* ── Hero ────────────────────────────────────────────────────────────── */}
        <section
          className="grid min-h-[75vh] items-center gap-12 py-14 lg:grid-cols-[1.1fr_0.9fr]"
          aria-labelledby="hero-heading"
        >
          {/* Left column — headline + CTAs */}
          <div className="icf-fade-up" style={{ animationDelay: "0.05s" }}>
            <div
              className="mb-6 inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-medium"
              style={{
                borderColor: "rgba(99,102,241,0.3)",
                background: "rgba(99,102,241,0.08)",
                color: "rgba(165,180,252,0.9)",
              }}
            >
              <span className="h-1.5 w-1.5 rounded-full bg-indigo-400 icf-pulse-glow inline-block" />
              Explainable Decision Intelligence
            </div>

            <h1
              id="hero-heading"
              className="max-w-2xl text-[2.8rem] font-bold leading-[1.12] tracking-tight sm:text-5xl lg:text-[3.4rem]"
              style={{ letterSpacing: "-0.02em" }}
            >
              <span className="text-white">Understand yourself.</span><br />
              <span style={{ color: "rgba(255,255,255,0.82)" }}>Evaluate choices.</span><br />
              <span
                style={{
                  background: "linear-gradient(135deg, #a5b4fc 0%, #818cf8 50%, #6366f1 100%)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  backgroundClip: "text",
                }}
              >
                Build a better future.
              </span>
            </h1>

            <p className="mt-7 max-w-xl text-base leading-[1.75] text-slate-400">
              ICF — Integrative Cognitive Framework — transforms cognitive, goal and
              capacity signals into explainable, structured decision support.
            </p>
            <p
              className="mt-3 max-w-lg text-sm leading-relaxed"
              style={{ color: "rgba(100,116,139,0.9)" }}
            >
              Designed for integration with IBM watsonx.ai, Granite and enterprise AI
              governance. This demo uses deterministic local logic — no external API calls.
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href="/demo"
                className="inline-flex items-center gap-2 rounded-full bg-white px-6 py-3 text-sm font-semibold text-slate-950 hover:bg-slate-100"
                style={{ boxShadow: "0 2px 12px rgba(255,255,255,0.12)" }}
              >
                Start assessment <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Link>
              <Link
                href="/demo?mode=demo"
                className="inline-flex items-center gap-2 rounded-full border px-6 py-3 text-sm font-semibold text-indigo-300 hover:text-white"
                style={{
                  borderColor: "rgba(99,102,241,0.4)",
                  background: "rgba(99,102,241,0.1)",
                  boxShadow: "0 0 0 1px rgba(99,102,241,0.08) inset",
                }}
                aria-label="Load a pre-filled sample profile and see all features instantly"
              >
                <PlayCircle className="h-4 w-4" aria-hidden="true" />
                Demo Mode
              </Link>
              <a
                href="#framework"
                className="rounded-full border border-white/10 px-6 py-3 text-sm text-slate-400 hover:border-white/20 hover:text-slate-300"
              >
                View framework
              </a>
            </div>

            {/* Micro-stat row */}
            <div className="mt-10 flex flex-wrap gap-6">
              {[
                ["6", "ICF Domains"],
                ["12", "Signal questions"],
                ["5", "Recommendation patterns"],
              ].map(([num, label]) => (
                <div key={label}>
                  <p className="text-2xl font-bold text-white" style={{ letterSpacing: "-0.02em" }}>{num}</p>
                  <p className="mt-0.5 text-xs text-slate-500">{label}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Right column — hero glass card */}
          <div
            className="icf-fade-up icf-float"
            style={{ animationDelay: "0.15s", animationDuration: "5s", willChange: "transform" }}
          >
            <div
              className="rounded-3xl p-6"
              style={{
                background: "rgba(12, 18, 38, 0.82)",
                border: "1px solid rgba(99,102,241,0.18)",
                backdropFilter: "blur(20px)",
                WebkitBackdropFilter: "blur(20px)",
                boxShadow: "0 0 0 1px rgba(255,255,255,0.04) inset, 0 24px 64px rgba(0,0,0,0.45), 0 0 40px rgba(99,102,241,0.08)",
              }}
              aria-label="Sample assessment result preview"
            >
              {/* Card header */}
              <div
                className="flex items-center justify-between pb-4 mb-5"
                style={{ borderBottom: "1px solid rgba(99,102,241,0.1)" }}
              >
                <div>
                  <p className="text-xs font-medium uppercase tracking-widest" style={{ color: "rgba(99,102,241,0.8)" }}>
                    Decision Intelligence
                  </p>
                  <p className="mt-0.5 text-sm font-semibold text-white">Sample Assessment Result</p>
                </div>
                <span
                  className="rounded-full border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider"
                  style={{
                    borderColor: "rgba(251,191,36,0.3)",
                    background: "rgba(251,191,36,0.06)",
                    color: "rgba(251,191,36,0.85)",
                  }}
                >
                  Sample data
                </span>
              </div>

              {/* Score grid */}
              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: "Focus Index",       value: "74",          unit: "/ 100", accent: "#818cf8" },
                  { label: "Decision Readiness", value: "68",         unit: "/ 100", accent: "#818cf8" },
                  { label: "Primary constraint", value: "Capacity",   unit: "gap",   accent: "#f59e0b" },
                  { label: "Recommended action", value: "Reduce",     unit: "scope", accent: "#34d399" },
                ].map(({ label, value, unit, accent }) => (
                  <div
                    key={label}
                    className="rounded-2xl p-4"
                    style={{
                      background: "rgba(255,255,255,0.03)",
                      border: "1px solid rgba(255,255,255,0.06)",
                    }}
                  >
                    <p className="text-[10px] font-medium uppercase tracking-wider text-slate-500">{label}</p>
                    <p className="mt-2 text-xl font-bold" style={{ color: accent }}>
                      {value}
                      <span className="ml-1 text-sm font-normal text-slate-500">{unit}</span>
                    </p>
                  </div>
                ))}
              </div>

              {/* Reasoning card */}
              <div
                className="mt-4 rounded-2xl p-4"
                style={{
                  background: "rgba(99,102,241,0.07)",
                  border: "1px solid rgba(99,102,241,0.18)",
                }}
              >
                <div className="flex gap-3">
                  <div
                    className="mt-0.5 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full"
                    style={{ background: "rgba(99,102,241,0.2)" }}
                  >
                    <ShieldCheck className="h-3.5 w-3.5 text-indigo-400" aria-hidden="true" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-indigo-300">Why this recommendation?</p>
                    <p className="mt-1 text-xs leading-[1.65] text-slate-400">
                      Goal clarity is high but current capacity is low. The system recommends
                      protecting the goal and reducing scope rather than adding new commitments.
                    </p>
                  </div>
                </div>
              </div>

              <Link
                href="/demo?mode=demo"
                className="mt-4 flex w-full items-center justify-center gap-2 rounded-2xl py-3 text-sm font-semibold text-white transition-all"
                style={{
                  background: "linear-gradient(135deg, #4f46e5 0%, #6366f1 100%)",
                  boxShadow: "0 0 0 1px rgba(255,255,255,0.1) inset, 0 4px 16px rgba(99,102,241,0.35)",
                }}
              >
                <PlayCircle className="h-4 w-4" aria-hidden="true" />
                Explore full demo →
              </Link>
            </div>
          </div>
        </section>

        {/* ── Capabilities strip ───────────────────────────────────────────────── */}
        <section
          className="py-12"
          style={{ borderTop: "1px solid rgba(99,102,241,0.1)" }}
          aria-labelledby="capabilities-heading"
        >
          <h2 id="capabilities-heading" className="sr-only">Platform capabilities</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {capabilities.map(({ icon: Icon, label, desc }) => (
              <div
                key={label}
                className="group flex gap-3 rounded-2xl p-5 transition-all duration-200"
                style={{
                  background: "rgba(255,255,255,0.025)",
                  border: "1px solid rgba(255,255,255,0.06)",
                }}
              >
                <div
                  className="mt-0.5 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-xl"
                  style={{ background: "rgba(99,102,241,0.12)", border: "1px solid rgba(99,102,241,0.2)" }}
                >
                  <Icon className="h-4 w-4 text-indigo-400" aria-hidden="true" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-white">{label}</p>
                  <p className="mt-1 text-xs leading-[1.6] text-slate-500">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ── Framework section ───────────────────────────────────────────────── */}
        <section
          id="framework"
          className="py-16"
          style={{ borderTop: "1px solid rgba(99,102,241,0.1)" }}
          aria-labelledby="framework-heading"
        >
          <div className="mb-10 max-w-2xl">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-indigo-400">
              ICF Framework
            </p>
            <h2
              id="framework-heading"
              className="mt-3 text-3xl font-bold tracking-tight text-white"
              style={{ letterSpacing: "-0.02em" }}
            >
              Six domains of human development
            </h2>
            <p className="mt-4 text-sm leading-[1.75] text-slate-400">
              This release assesses{" "}
              <strong className="font-semibold text-white">Mind</strong>,{" "}
              <strong className="font-semibold text-white">Goal</strong> and{" "}
              <strong className="font-semibold text-white">Body / Capacity</strong>.
              Scenario, Language and Global domains are on the product roadmap.
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {domains.map(({ name, icon: Icon, text, available }) => (
              <div
                key={name}
                className="group rounded-2xl p-6 transition-all duration-200"
                style={
                  available
                    ? {
                        background: "rgba(99,102,241,0.06)",
                        border: "1px solid rgba(99,102,241,0.22)",
                        boxShadow: "0 0 0 1px rgba(99,102,241,0.04) inset",
                      }
                    : {
                        background: "rgba(255,255,255,0.02)",
                        border: "1px solid rgba(255,255,255,0.06)",
                        opacity: 0.55,
                      }
                }
              >
                <div className="flex items-start justify-between">
                  <div
                    className="flex h-9 w-9 items-center justify-center rounded-xl"
                    style={
                      available
                        ? { background: "rgba(99,102,241,0.15)", border: "1px solid rgba(99,102,241,0.25)" }
                        : { background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }
                    }
                  >
                    <Icon
                      className={`h-4.5 w-4.5 ${available ? "text-indigo-300" : "text-slate-500"}`}
                      style={{ width: "1.1rem", height: "1.1rem" }}
                      aria-hidden="true"
                    />
                  </div>
                  {available ? (
                    <span
                      className="rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider"
                      style={{
                        background: "rgba(99,102,241,0.12)",
                        border: "1px solid rgba(99,102,241,0.25)",
                        color: "rgba(165,180,252,0.9)",
                      }}
                    >
                      Available
                    </span>
                  ) : (
                    <span className="text-[10px] uppercase tracking-wider text-slate-600">Roadmap</span>
                  )}
                </div>
                <h3 className="mt-5 text-base font-semibold text-white">{name}</h3>
                <p className="mt-2 text-sm leading-[1.65] text-slate-500">{text}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ── Trust & Safety ───────────────────────────────────────────────────── */}
        <section
          className="py-10"
          style={{ borderTop: "1px solid rgba(99,102,241,0.08)" }}
        >
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-xs font-semibold uppercase tracking-widest text-slate-500">
              Decision Support — Not a Diagnosis
            </p>
            <p className="mt-3 text-xs leading-[1.8] text-slate-600">
              ICF AI Copilot is intended to support human decision-making and should not be interpreted
              as a medical or psychological diagnosis. It does not provide treatment, therapy or
              emergency mental-health services. Always apply professional judgement when making
              significant decisions.
            </p>
          </div>
        </section>

      </div>

      {/* ── Footer ─────────────────────────────────────────────────────────────── */}
      <footer
        className="py-8 text-center"
        style={{ borderTop: "1px solid rgba(99,102,241,0.08)" }}
      >
        <p className="text-xs text-slate-600">
          ICF AI Copilot — Integrative Cognitive Framework · Explainable Decision Intelligence
        </p>
        <p className="mt-1 text-xs text-slate-700">
          Designed for integration with IBM watsonx.ai, Granite and enterprise AI governance.
        </p>
        <p className="mt-2 text-xs text-slate-700">
          © {new Date().getFullYear()} ICF AI Copilot
        </p>
      </footer>
    </main>
  );
}
