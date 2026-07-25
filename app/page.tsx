import Link from "next/link";
import {
  ArrowRight, Brain, Compass, Network, ShieldCheck,
  Target, Zap, Layers, GitBranch, BarChart3, PlayCircle,
  Lock, CheckCircle2, Activity, FileText,
} from "lucide-react";

// ── Static data ──────────────────────────────────────────────────────────────

const NAV_LINKS = [
  { label: "Methodology",  href: "#methodology" },
  { label: "Assessment",   href: "/demo" },
  { label: "Framework",    href: "#framework" },
  { label: "Demo",         href: "/demo?mode=demo" },
];

const METRICS = [
  { value: "6",    label: "ICF Domains",          sub: "Integrative model" },
  { value: "12",   label: "Questions",             sub: "3 min assessment" },
  { value: "5",    label: "Decision Patterns",     sub: "Deterministic logic" },
  { value: "100%", label: "Explainability",        sub: "No black box" },
  { value: "0",    label: "External APIs",         sub: "Privacy first" },
];

const DOMAINS = [
  { name: "Mind",     icon: Brain,      color: "text-blue-400",   border: "border-blue-400/25",   bg: "rgba(59,130,246,0.06)",  desc: "Cognitive clarity, concentration, mental load, emotional regulation.",        available: true  },
  { name: "Goal",     icon: Target,     color: "text-green-400",  border: "border-green-400/25",  bg: "rgba(34,197,94,0.06)",   desc: "Goal clarity, personal importance, confidence, next-step visibility.",         available: true  },
  { name: "Body",     icon: Zap,        color: "text-amber-400",  border: "border-amber-400/25",  bg: "rgba(245,158,11,0.06)",  desc: "Energy, recovery, workload tolerance, sustained attention capacity.",          available: true  },
  { name: "Language", icon: ShieldCheck,color: "text-violet-400", border: "border-violet-400/20", bg: "rgba(139,92,246,0.04)",  desc: "Communication patterns, framing quality, narrative coherence signals.",        available: false },
  { name: "Scenario", icon: Compass,    color: "text-sky-400",    border: "border-sky-400/20",    bg: "rgba(56,189,248,0.04)",  desc: "Risk scenario modelling, decision branching, consequence mapping.",           available: false },
  { name: "Global",   icon: Network,    color: "text-teal-400",   border: "border-teal-400/20",   bg: "rgba(20,184,166,0.04)",  desc: "System-level awareness, cultural context, long-range impact assessment.",     available: false },
];

const CAPABILITIES = [
  { icon: Brain,       label: "Decision Intelligence",        desc: "Structured reasoning across cognitive, goal and capacity domains." },
  { icon: GitBranch,   label: "Human Development Graph",      desc: "Six-domain radial model that visualises your current development profile." },
  { icon: Activity,    label: "Explainability Engine",        desc: "Every recommendation ships with its reasoning, evidence and limitations." },
  { icon: Layers,      label: "Decision Twin Simulator",      desc: "Explore how signal changes shift decision readiness — before acting." },
  { icon: BarChart3,   label: "Signal Importance",            desc: "See which signals drove the output and by how much." },
  { icon: FileText,    label: "Executive Report",             desc: "Print-ready PDF-quality report with complete decision analysis." },
];

// ── Hero SVG — Human Development Graph (static demo, 6 nodes) ───────────────

function HeroGraph() {
  const R = 120;
  const cx = 200; const cy = 200;
  const nodes = [
    { label: "Mind",     angle: -90,  score: 72,  color: "#60a5fa", available: true  },
    { label: "Language", angle: -30,  score: null, color: "#8b5cf6", available: false },
    { label: "Global",   angle:  30,  score: null, color: "#14b8a6", available: false },
    { label: "Body",     angle:  90,  score: 48,  color: "#f59e0b", available: true  },
    { label: "Scenario", angle: 150,  score: null, color: "#38bdf8", available: false },
    { label: "Goal",     angle: 210,  score: 81,  color: "#22c55e", available: true  },
  ];

  const toXY = (angle: number, radius: number) => ({
    x: cx + radius * Math.cos((angle * Math.PI) / 180),
    y: cy + radius * Math.sin((angle * Math.PI) / 180),
  });

  const assessed = nodes.filter(n => n.score !== null);
  const polyPoints = assessed.map(n => {
    const pt = toXY(n.angle, (n.score! / 100) * R);
    return `${pt.x},${pt.y}`;
  }).join(" ");

  const nodePositions = nodes.map(n => ({ ...n, ...toXY(n.angle, R) }));

  return (
    <svg
      viewBox="0 0 400 400"
      className="w-full max-w-[420px]"
      aria-label="ICF Human Development Graph — six-domain model"
      role="img"
    >
      <defs>
        <radialGradient id="hero-poly-fill" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="rgba(99,102,241,0.3)" />
          <stop offset="100%" stopColor="rgba(99,102,241,0.04)" />
        </radialGradient>
        <filter id="hero-glow" x="-60%" y="-60%" width="220%" height="220%">
          <feGaussianBlur stdDeviation="4" result="blur" />
          <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
        <filter id="hero-glow-sm" x="-40%" y="-40%" width="180%" height="180%">
          <feGaussianBlur stdDeviation="2.5" result="blur" />
          <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
      </defs>

      {/* Concentric rings */}
      {[0.25, 0.5, 0.75, 1].map((r, i) => (
        <circle key={r} cx={cx} cy={cy} r={R * r}
          fill="none"
          stroke={i === 3 ? "rgba(99,102,241,0.2)" : "rgba(99,102,241,0.07)"}
          strokeWidth={i === 3 ? 1.5 : 0.75}
          strokeDasharray={i < 3 ? "3 5" : undefined}
        />
      ))}

      {/* Spokes */}
      {nodePositions.map(n => (
        <line key={n.label}
          x1={cx} y1={cy} x2={n.x} y2={n.y}
          stroke="rgba(99,102,241,0.12)" strokeWidth="0.75"
        />
      ))}

      {/* Animated pulse ring on outer circle */}
      <circle cx={cx} cy={cy} r={R}
        fill="none" stroke="rgba(99,102,241,0.15)" strokeWidth="1"
        style={{ animation: "icf-pulse-glow 4s ease-in-out infinite" }}
      />

      {/* Filled polygon — assessed domains */}
      <polygon points={polyPoints}
        fill="url(#hero-poly-fill)"
        stroke="rgba(99,102,241,0.6)" strokeWidth="1.5" strokeLinejoin="round"
        style={{ filter: "drop-shadow(0 0 8px rgba(99,102,241,0.25))" }}
      />

      {/* Nodes */}
      {nodePositions.map(n => {
        const isAssessed = n.score !== null;
        const scorePt = isAssessed ? toXY(n.angle, (n.score! / 100) * R) : null;

        // label offset
        const lx = n.x + (n.x < cx - 8 ? -16 : n.x > cx + 8 ? 16 : 0);
        const ly = n.y + (n.y < cy - 8 ? -16 : n.y > cy + 8 ? 20 : 0);
        const anchor = n.x < cx - 8 ? "end" : n.x > cx + 8 ? "start" : "middle";

        return (
          <g key={n.label}>
            {isAssessed && (
              <>
                <circle cx={n.x} cy={n.y} r={14} fill={n.color} opacity="0.07" />
                <circle cx={n.x} cy={n.y} r={7} fill={n.color} stroke={n.color} strokeWidth="1.5"
                  filter="url(#hero-glow-sm)" />
                {scorePt && (
                  <circle cx={scorePt.x} cy={scorePt.y} r={4.5}
                    fill={n.color} opacity="0.9" filter="url(#hero-glow-sm)" />
                )}
                <text x={lx} y={ly} textAnchor={anchor} fontSize="11.5" fontWeight="600"
                  fill="#e2e8f0" style={{ fontFamily: "system-ui,sans-serif" }}>
                  {n.label}
                </text>
                <text x={lx}
                  y={n.y + (n.y < cy - 8 ? -28 : n.y > cy + 8 ? 33 : ly - n.y + 16)}
                  textAnchor={anchor} fontSize="10" fontWeight="700"
                  fill={n.color} opacity="0.95" style={{ fontFamily: "system-ui,sans-serif" }}>
                  {n.score}
                </text>
              </>
            )}
            {!isAssessed && (
              <>
                <circle cx={n.x} cy={n.y} r={4} fill="#1e293b" stroke="#334155" strokeWidth="1.2" />
                <text x={lx} y={ly} textAnchor={anchor} fontSize="10.5" fontWeight="400"
                  fill="#475569" style={{ fontFamily: "system-ui,sans-serif" }}>
                  {n.label}
                </text>
              </>
            )}
          </g>
        );
      })}

      {/* Centre mark */}
      <circle cx={cx} cy={cy} r={22} fill="rgba(99,102,241,0.1)" stroke="rgba(99,102,241,0.3)" strokeWidth="1" />
      <text x={cx} y={cy - 5} textAnchor="middle" fontSize="9" fill="#818cf8" fontWeight="800"
        style={{ letterSpacing: "0.1em", fontFamily: "system-ui,sans-serif" }}>ICF</text>
      <text x={cx} y={cy + 8} textAnchor="middle" fontSize="7.5" fill="rgba(99,102,241,0.5)"
        style={{ letterSpacing: "0.07em", fontFamily: "system-ui,sans-serif" }}>ENGINE</text>
    </svg>
  );
}

// ── Page ─────────────────────────────────────────────────────────────────────

export default function HomePage() {
  return (
    <div className="min-h-screen bg-slate-950 text-white">

      {/* ── Sticky navigation ─────────────────────────────────────────────── */}
      <header className="sticky top-0 z-50 border-b border-white/[0.06]"
        style={{ background: "rgba(2,6,23,0.88)", backdropFilter: "blur(20px) saturate(160%)" }}>
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-3 lg:px-10">
          {/* Wordmark */}
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg"
              style={{ background: "linear-gradient(135deg,#4f46e5,#6366f1)" }}>
              <span className="text-xs font-black text-white tracking-tight">ICF</span>
            </div>
            <div className="hidden sm:flex flex-col leading-none">
              <span className="text-sm font-bold text-white">ICF AI Copilot</span>
              <span className="text-xs text-slate-500">Decision Intelligence</span>
            </div>
          </div>

          {/* Nav links */}
          <nav aria-label="Primary navigation" className="hidden md:flex items-center gap-1">
            {NAV_LINKS.map(link => (
              <Link key={link.label} href={link.href}
                className="rounded-lg px-4 py-2 text-sm text-slate-400 transition-colors hover:bg-white/[0.05] hover:text-white">
                {link.label}
              </Link>
            ))}
          </nav>

          {/* CTA */}
          <div className="flex items-center gap-3">
            <span className="hidden sm:inline-flex rounded-full border border-indigo-400/30 px-2.5 py-1 text-xs text-indigo-300"
              style={{ background: "rgba(99,102,241,0.08)" }}>
              IBM AI Build
            </span>
            <Link href="/demo"
              className="inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-semibold text-white transition-all hover:brightness-110"
              style={{ background: "linear-gradient(135deg,#4f46e5,#6366f1)", boxShadow: "0 0 12px rgba(99,102,241,0.3)" }}>
              Begin Assessment <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
      </header>

      {/* ── Hero — full viewport ───────────────────────────────────────────── */}
      <section className="relative flex min-h-[calc(100vh-56px)] items-center overflow-hidden"
        aria-labelledby="hero-heading">
        {/* Background layers */}
        <div className="pointer-events-none absolute inset-0"
          style={{ background: "radial-gradient(ellipse 80% 60% at 60% 40%,rgba(99,102,241,0.12) 0%,transparent 70%)" }} />
        <div className="pointer-events-none absolute inset-0"
          style={{ background: "radial-gradient(ellipse 50% 40% at 10% 80%,rgba(59,130,246,0.06) 0%,transparent 60%)" }} />
        {/* Subtle grid */}
        <div className="pointer-events-none absolute inset-0 opacity-[0.025]"
          style={{ backgroundImage: "linear-gradient(rgba(99,102,241,1) 1px,transparent 1px),linear-gradient(90deg,rgba(99,102,241,1) 1px,transparent 1px)", backgroundSize: "64px 64px" }} />

        <div className="relative mx-auto w-full max-w-7xl px-6 py-20 lg:px-10">
          <div className="grid items-center gap-16 lg:grid-cols-2">

            {/* LEFT — copy */}
            <div className="max-w-xl">
              {/* Category badge */}
              <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-indigo-400/30 px-4 py-1.5 text-sm text-indigo-300"
                style={{ background: "rgba(99,102,241,0.08)" }}>
                <span className="h-1.5 w-1.5 rounded-full bg-indigo-400" />
                Explainable Decision Intelligence Platform
              </div>

              {/* Headline */}
              <h1 id="hero-heading" className="text-5xl font-bold leading-[1.1] tracking-tight text-white lg:text-6xl">
                Know yourself.
                <br />
                Decide with
                <br />
                <span style={{ background: "linear-gradient(90deg,#818cf8 0%,#6366f1 50%,#a78bfa 100%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
                  clarity.
                </span>
              </h1>

              {/* Sub-headline */}
              <p className="mt-6 text-lg text-slate-400 leading-relaxed">
                ICF AI Copilot maps your cognitive, goal and capacity signals
                into a transparent decision readiness score — with full
                reasoning, no black box.
              </p>

              {/* Trust badges */}
              <div className="mt-6 flex flex-wrap gap-2">
                {["Deterministic logic", "Zero external APIs", "Full explainability", "IBM watsonx.ai ready"].map(b => (
                  <span key={b} className="inline-flex items-center gap-1.5 rounded-full border border-slate-700 px-3 py-1 text-xs text-slate-400">
                    <CheckCircle2 className="h-3 w-3 text-green-400" />
                    {b}
                  </span>
                ))}
              </div>

              {/* CTAs */}
              <div className="mt-10 flex flex-col gap-3 sm:flex-row">
                <Link href="/demo"
                  className="inline-flex items-center justify-center gap-2 rounded-full px-8 py-3.5 font-semibold text-white transition-all hover:brightness-110 active:scale-[0.98]"
                  style={{ background: "linear-gradient(135deg,#4f46e5,#6366f1)", boxShadow: "0 0 24px rgba(99,102,241,0.35)" }}>
                  Start Assessment <ArrowRight className="h-4 w-4" />
                </Link>
                <Link href="/demo?mode=demo"
                  className="inline-flex items-center justify-center gap-2 rounded-full border border-slate-700 px-8 py-3.5 text-sm font-semibold text-slate-300 transition-colors hover:border-slate-500 hover:text-white">
                  <PlayCircle className="h-4 w-4" />
                  Live Demo
                </Link>
              </div>
            </div>

            {/* RIGHT — Human Development Graph */}
            <div className="flex flex-col items-center justify-center" aria-hidden="true">
              <div className="relative w-full max-w-[480px]">
                {/* Glow behind graph */}
                <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                  <div style={{ width: 320, height: 320, borderRadius: "50%", background: "radial-gradient(circle,rgba(99,102,241,0.14) 0%,transparent 70%)", filter: "blur(20px)" }} />
                </div>
                <HeroGraph />
              </div>
              <p className="mt-4 text-center text-xs text-slate-600 max-w-xs leading-relaxed">
                Human Development Graph — six-domain model.
                Mind · Goal · Body active. Language, Scenario, Global: roadmap.
              </p>
            </div>

          </div>
        </div>
      </section>

      {/* ── Metrics strip ─────────────────────────────────────────────────── */}
      <section aria-label="Platform metrics"
        className="border-y border-white/[0.06]"
        style={{ background: "rgba(15,23,42,0.6)" }}>
        <div className="mx-auto max-w-7xl px-6 py-8 lg:px-10">
          <div className="grid grid-cols-2 gap-px sm:grid-cols-3 lg:grid-cols-5">
            {METRICS.map((m, i) => (
              <div key={m.label}
                className={`flex flex-col items-center py-6 text-center ${i < METRICS.length - 1 ? "border-r border-white/[0.05]" : ""}`}>
                <span className="text-3xl font-bold text-white tabular-nums tracking-tight"
                  style={{ textShadow: "0 0 24px rgba(99,102,241,0.4)" }}>
                  {m.value}
                </span>
                <span className="mt-1.5 text-sm font-medium text-slate-300">{m.label}</span>
                <span className="mt-0.5 text-xs text-slate-600">{m.sub}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Platform capabilities ──────────────────────────────────────────── */}
      <section id="methodology" className="py-24" aria-labelledby="capabilities-heading">
        <div className="mx-auto max-w-7xl px-6 lg:px-10">
          <div className="mb-14 max-w-2xl">
            <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-indigo-400">Platform Capabilities</p>
            <h2 id="capabilities-heading" className="text-3xl font-bold text-white lg:text-4xl">
              Enterprise decision intelligence,<br className="hidden lg:block" />
              fully transparent.
            </h2>
            <p className="mt-4 text-slate-400 leading-relaxed">
              Every output is backed by deterministic, rule-based logic.
              No machine learning black box. Designed for IBM watsonx.ai integration.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {CAPABILITIES.map(c => {
              const Icon = c.icon;
              return (
                <div key={c.label}
                  className="group rounded-2xl border border-slate-800 p-6 transition-all duration-200 hover:border-indigo-500/40"
                  style={{ background: "rgba(15,23,42,0.6)" }}>
                  <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl"
                    style={{ background: "rgba(99,102,241,0.12)" }}>
                    <Icon className="h-5 w-5 text-indigo-400" aria-hidden="true" />
                  </div>
                  <h3 className="mb-2 font-semibold text-white">{c.label}</h3>
                  <p className="text-sm text-slate-500 leading-relaxed">{c.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── ICF Domains grid ──────────────────────────────────────────────── */}
      <section id="framework" className="py-24 border-t border-white/[0.05]" aria-labelledby="domains-heading">
        <div className="mx-auto max-w-7xl px-6 lg:px-10">
          <div className="mb-14 max-w-2xl">
            <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-indigo-400">Integrative Cognitive Framework</p>
            <h2 id="domains-heading" className="text-3xl font-bold text-white lg:text-4xl">
              Six domains of<br className="hidden lg:block" /> human development.
            </h2>
            <p className="mt-4 text-slate-400 leading-relaxed">
              ICF models the full spectrum of decision-relevant human signals.
              Three domains are active in this MVP. Three are on the product roadmap.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {DOMAINS.map(d => {
              const Icon = d.icon;
              return (
                <div key={d.name}
                  className="relative rounded-2xl border p-6 transition-all duration-200"
                  style={{ borderColor: d.available ? d.border.replace("border-","").replace("/25","") + "40" : "rgba(255,255,255,0.05)", background: d.bg }}>
                  {!d.available && (
                    <span className="absolute right-4 top-4 inline-flex items-center gap-1 rounded-full border border-slate-700/60 px-2 py-0.5 text-xs text-slate-500"
                      style={{ background: "rgba(15,23,42,0.8)" }}>
                      <Lock className="h-2.5 w-2.5" /> Roadmap
                    </span>
                  )}
                  <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl"
                    style={{ background: d.available ? d.bg : "rgba(30,41,59,0.4)", border: "1px solid " + (d.available ? "rgba(255,255,255,0.08)" : "rgba(255,255,255,0.04)") }}>
                    <Icon className={`h-5 w-5 ${d.available ? d.color : "text-slate-600"}`} aria-hidden="true" />
                  </div>
                  <h3 className={`mb-2 font-semibold ${d.available ? "text-white" : "text-slate-500"}`}>{d.name}</h3>
                  <p className={`text-sm leading-relaxed ${d.available ? "text-slate-400" : "text-slate-600"}`}>{d.desc}</p>
                  {d.available && (
                    <div className="mt-4 flex items-center gap-1.5">
                      <span className="h-1.5 w-1.5 rounded-full bg-green-500" />
                      <span className="text-xs text-green-400 font-medium">Active</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── Trust section ─────────────────────────────────────────────────── */}
      <section className="py-24 border-t border-white/[0.05]" aria-label="Trust and ethics">
        <div className="mx-auto max-w-7xl px-6 lg:px-10">
          <div className="rounded-2xl border border-indigo-400/20 px-8 py-10 lg:px-12 lg:py-14"
            style={{ background: "linear-gradient(135deg,rgba(99,102,241,0.07),rgba(99,102,241,0.02))" }}>
            <div className="grid items-center gap-10 lg:grid-cols-2">
              <div>
                <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-indigo-400">Ethical AI by Design</p>
                <h2 className="text-2xl font-bold text-white lg:text-3xl">
                  Decision support.<br />Not a diagnosis.
                </h2>
                <p className="mt-4 text-slate-400 leading-relaxed text-sm">
                  ICF AI Copilot is a structured decision-support tool.
                  Every output includes its reasoning, evidence used, limitations
                  and a disclaimer. No data is stored. No external APIs are called.
                </p>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                {[
                  { icon: ShieldCheck, label: "No diagnosis",       desc: "Assessment results are decision support, not clinical judgement." },
                  { icon: CheckCircle2, label: "Full transparency",  desc: "Every recommendation includes its logic chain." },
                  { icon: Layers,       label: "No data stored",    desc: "All processing is client-side. Nothing is persisted." },
                  { icon: Activity,     label: "Human-in-the-loop", desc: "The system recommends. You decide." },
                ].map(item => {
                  const Icon = item.icon;
                  return (
                    <div key={item.label} className="rounded-xl border border-slate-700/60 p-4"
                      style={{ background: "rgba(15,23,42,0.5)" }}>
                      <Icon className="mb-2 h-4 w-4 text-indigo-400" aria-hidden="true" />
                      <p className="text-sm font-semibold text-white">{item.label}</p>
                      <p className="mt-1 text-xs text-slate-500 leading-relaxed">{item.desc}</p>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── CTA bar ───────────────────────────────────────────────────────── */}
      <section className="py-24 border-t border-white/[0.05]" aria-label="Call to action">
        <div className="mx-auto max-w-3xl px-6 text-center lg:px-10">
          <h2 className="text-3xl font-bold text-white lg:text-4xl">
            Ready to assess your<br className="hidden sm:block" /> decision readiness?
          </h2>
          <p className="mt-4 text-slate-400 leading-relaxed">
            12 questions. 3 minutes. Full transparency. No account required.
          </p>
          <div className="mt-10 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
            <Link href="/demo"
              className="inline-flex items-center gap-2 rounded-full px-10 py-4 font-semibold text-white transition-all hover:brightness-110"
              style={{ background: "linear-gradient(135deg,#4f46e5,#6366f1)", boxShadow: "0 0 32px rgba(99,102,241,0.4)" }}>
              Begin Assessment <ArrowRight className="h-4 w-4" />
            </Link>
            <Link href="/demo?mode=demo"
              className="inline-flex items-center gap-2 rounded-full border border-slate-700 px-10 py-4 text-sm font-semibold text-slate-300 transition-colors hover:border-slate-500 hover:text-white">
              <PlayCircle className="h-4 w-4" />
              View Live Demo
            </Link>
          </div>
        </div>
      </section>

      {/* ── Footer ────────────────────────────────────────────────────────── */}
      <footer className="border-t border-white/[0.06] py-12" role="contentinfo">
        <div className="mx-auto max-w-7xl px-6 lg:px-10">
          <div className="flex flex-col items-center gap-6 text-center sm:flex-row sm:justify-between sm:text-left">
            <div>
              <p className="text-sm font-bold text-white">ICF AI Copilot</p>
              <p className="text-xs text-slate-500 mt-0.5">Integrative Cognitive Framework · Explainable Decision Intelligence</p>
              <p className="text-xs text-slate-600 mt-0.5">IBM AI Build Challenge MVP</p>
            </div>
            <div className="flex flex-col items-center gap-1 sm:items-end">
              <p className="text-xs text-slate-600">Decision Support — Not a Diagnosis</p>
              <p className="text-xs text-slate-700">
                Designed for integration with IBM watsonx.ai &amp; Granite
              </p>
              <p className="text-xs text-slate-700 mt-1">© 2025 ICF AI Copilot</p>
            </div>
          </div>
        </div>
      </footer>

    </div>
  );
}
