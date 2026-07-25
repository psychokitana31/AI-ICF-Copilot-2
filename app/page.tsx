import Link from "next/link";
import {
  Brain, Compass, Network, ShieldCheck, Target, Zap,
  GitBranch, BarChart3, PlayCircle, ArrowRight,
  Activity, Layers, Lock, TrendingUp, FileText,
  CheckCircle2, AlertTriangle,
} from "lucide-react";

// ── Domain colour system (persistent across the whole app) ───────────────────
const DOMAIN_COLORS: Record<string, string> = {
  mind:     "#60a5fa",   // blue-400
  goal:     "#4ade80",   // green-400
  body:     "#fb923c",   // orange-400
  language: "#2dd4bf",   // teal-400
  scenario: "#a78bfa",   // purple-400
  global:   "#fbbf24",   // gold/amber-400
};

// ── Static sample data (matches SAMPLE_ANSWERS scoring) ──────────────────────
const SAMPLE = {
  mind:             62,
  goal:             75,
  body:             44,
  decisionReadiness: 65,
  decisionConfidence:72,
  explainability:   88,
  riskLevel:        "Moderate" as const,
  confidenceLevel:  "High" as const,
  strongestSignal:  "Goal (75/100)",
  primaryConstraint:"Body / Capacity (44/100)",
  pattern:          "P3",
  recommendation:   "Protect goal momentum while restoring capacity before expanding commitments.",
  nextAction:       "Schedule a structured recovery window; defer any non-critical decisions for 48–72 hours.",
};

const DOMAINS_LIST = [
  { id: "mind",     label: "Mind",     score: SAMPLE.mind, available: true  },
  { id: "goal",     label: "Goal",     score: SAMPLE.goal, available: true  },
  { id: "body",     label: "Body",     score: SAMPLE.body, available: true  },
  { id: "language", label: "Language", score: null,         available: false },
  { id: "scenario", label: "Scenario", score: null,         available: false },
  { id: "global",   label: "Global",   score: null,         available: false },
];

const REASONING_STEPS = [
  { n: 1, stage: "Signal Extraction",  summary: "3 domains assessed",          detail: "Mind 62 · Goal 75 · Body 44 — 12 questions answered." },
  { n: 2, stage: "Score Normalisation",summary: "0–100 scale applied",          detail: "Reverse-scored items corrected. Composite indices computed." },
  { n: 3, stage: "Cross-domain Logic", summary: "Tension identified",           detail: "Goal clarity is high but capacity is low — scope risk pattern." },
  { n: 4, stage: "Pattern Matching",   summary: "Pattern P3 selected",          detail: "5 deterministic patterns evaluated. P3 matched on ≥2 criteria." },
  { n: 5, stage: "Recommendation",     summary: "Protect momentum",             detail: "Reduce scope; restore capacity before expanding commitments." },
  { n: 6, stage: "Next Action",        summary: "48–72 hr recovery window",     detail: "Defer non-critical decisions. Structured rest is the leverage point." },
];

// ── Large Human Development Graph ────────────────────────────────────────────
function DashboardGraph() {
  const R = 150;
  const cx = 240; const cy = 240;

  const nodes = [
    { id: "mind",     label: "Mind",     angle: -90,  score: SAMPLE.mind },
    { id: "language", label: "Language", angle: -30,  score: null },
    { id: "global",   label: "Global",   angle:  30,  score: null },
    { id: "body",     label: "Body",     angle:  90,  score: SAMPLE.body },
    { id: "scenario", label: "Scenario", angle: 150,  score: null },
    { id: "goal",     label: "Goal",     angle: 210,  score: SAMPLE.goal },
  ];

  const toXY = (angle: number, r: number) => ({
    x: cx + r * Math.cos((angle * Math.PI) / 180),
    y: cy + r * Math.sin((angle * Math.PI) / 180),
  });

  const assessed = nodes.filter(n => n.score !== null);
  const polyPoints = assessed.map(n => {
    const pt = toXY(n.angle, (n.score! / 100) * R);
    return `${pt.x},${pt.y}`;
  }).join(" ");

  const nodePos = nodes.map(n => ({ ...n, ...toXY(n.angle, R) }));

  return (
    <svg
      viewBox="0 0 480 480"
      className="w-full max-w-[480px]"
      aria-label="ICF Human Development Graph — sample profile"
      role="img"
    >
      <defs>
        <radialGradient id="db-poly-fill" cx="50%" cy="50%" r="50%">
          <stop offset="0%"   stopColor="rgba(99,102,241,0.18)" />
          <stop offset="100%" stopColor="rgba(99,102,241,0.02)" />
        </radialGradient>
        <filter id="db-glow-sm" x="-40%" y="-40%" width="180%" height="180%">
          <feGaussianBlur stdDeviation="1.5" result="blur" />
          <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
      </defs>

      {/* Rings */}
      {[0.25, 0.5, 0.75, 1].map((r, i) => (
        <circle key={r} cx={cx} cy={cy} r={R * r}
          fill="none"
          stroke={i === 3 ? "rgba(148,163,184,0.18)" : "rgba(148,163,184,0.07)"}
          strokeWidth={i === 3 ? "1" : "0.75"}
          strokeDasharray={i < 3 ? "4 6" : undefined}
        />
      ))}

      {/* Ring labels (25 / 50 / 75 / 100) */}
      {[25, 50, 75, 100].map(v => (
        <text key={v}
          x={cx + 4} y={cy - R * (v / 100) + 4}
          fontSize="8" fill="rgba(148,163,184,0.4)"
          style={{ fontFamily: "system-ui,sans-serif" }}>
          {v}
        </text>
      ))}

      {/* Spokes */}
      {nodePos.map(n => (
        <line key={n.id} x1={cx} y1={cy} x2={n.x} y2={n.y}
          stroke="rgba(148,163,184,0.1)" strokeWidth="0.75" />
      ))}

      {/* Filled polygon */}
      <polygon points={polyPoints}
        fill="url(#db-poly-fill)"
        stroke="rgba(99,102,241,0.45)" strokeWidth="1.5" strokeLinejoin="round"
      />

      {/* Nodes */}
      {nodePos.map(n => {
        const col = DOMAIN_COLORS[n.id] ?? "#64748b";
        const isAssessed = n.score !== null;
        const scorePt = isAssessed ? toXY(n.angle, (n.score! / 100) * R) : null;

        const lx = n.x + (n.x < cx - 10 ? -18 : n.x > cx + 10 ? 18 : 0);
        const ly = n.y + (n.y < cy - 10 ? -18 : n.y > cy + 10 ? 22 : 0);
        const anchor = n.x < cx - 10 ? "end" : n.x > cx + 10 ? "start" : "middle";

        return (
          <g key={n.id}>
            {isAssessed ? (
              <>
                    {/* Anchor node */}
                    <circle cx={n.x} cy={n.y} r={7} fill={col} opacity="0.9"
                      filter="url(#db-glow-sm)" />
                    {/* Score dot */}
                    {scorePt && (
                      <circle cx={scorePt.x} cy={scorePt.y} r={4.5}
                        fill={col} opacity="0.85" filter="url(#db-glow-sm)" />
                    )}
                {/* Domain label */}
                <text x={lx} y={ly} textAnchor={anchor} fontSize="12" fontWeight="600"
                  fill={col} style={{ fontFamily: "system-ui,sans-serif" }}>
                  {n.label}
                </text>
                {/* Score value */}
                <text x={lx}
                  y={n.y + (n.y < cy - 10 ? -32 : n.y > cy + 10 ? 38 : ly - n.y + 18)}
                  textAnchor={anchor} fontSize="11" fontWeight="700"
                  fill={col} opacity="0.95" style={{ fontFamily: "system-ui,sans-serif" }}>
                  {n.score}
                </text>
              </>
            ) : (
              <>
                <circle cx={n.x} cy={n.y} r={5} fill="#1e293b" stroke="#334155" strokeWidth="1.2" />
                <text x={lx} y={ly} textAnchor={anchor} fontSize="11" fontWeight="400"
                  fill="#475569" style={{ fontFamily: "system-ui,sans-serif" }}>
                  {n.label}
                </text>
              </>
            )}
          </g>
        );
      })}

      {/* Centre */}
      <circle cx={cx} cy={cy} r={24} fill="rgba(99,102,241,0.08)"
        stroke="rgba(148,163,184,0.2)" strokeWidth="1" />
      <text x={cx} y={cy - 4} textAnchor="middle" fontSize="9.5" fill="#a5b4fc" fontWeight="700"
        style={{ letterSpacing: "0.1em", fontFamily: "system-ui,sans-serif" }}>ICF</text>
      <text x={cx} y={cy + 8} textAnchor="middle" fontSize="8" fill="rgba(148,163,184,0.5)"
        style={{ letterSpacing: "0.07em", fontFamily: "system-ui,sans-serif" }}>ENGINE</text>
    </svg>
  );
}

// ── Score colour ─────────────────────────────────────────────────────────────
function scoreColor(v: number): string {
  if (v >= 65) return "#4ade80";
  if (v >= 40) return "#fb923c";
  return "#f87171";
}

// ── Risk badge ───────────────────────────────────────────────────────────────
function RiskBadge({ level }: { level: "Low" | "Moderate" | "High" }) {
  const cfg = {
    Low:      { text: "text-green-400",  border: "border-green-400/30",  bg: "rgba(74,222,128,0.07)" },
    Moderate: { text: "text-orange-400", border: "border-orange-400/30", bg: "rgba(251,146,60,0.07)" },
    High:     { text: "text-red-400",    border: "border-red-400/30",    bg: "rgba(248,113,113,0.07)" },
  }[level];
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold ${cfg.text} ${cfg.border}`}
      style={{ background: cfg.bg }}>
      {level === "Low" ? <CheckCircle2 className="h-3 w-3" /> :
       level === "Moderate" ? <AlertTriangle className="h-3 w-3" /> :
       <AlertTriangle className="h-3 w-3" />}
      Risk: {level}
    </span>
  );
}

// ── KPI card ─────────────────────────────────────────────────────────────────
function KpiCard({ label, value, sub, color }: { label: string; value: string | number; sub?: string; color?: string }) {
return (
  <div className="rounded-xl border border-slate-700/60 p-5"
    style={{ background: "rgba(22,32,58,0.9)" }}>
    <p className="text-xs font-medium uppercase tracking-widest text-slate-400 mb-2">{label}</p>
    <p className="text-3xl font-bold tabular-nums" style={{ color: color ?? "#f1f5f9" }}>{value}</p>
    {sub && <p className="mt-1 text-xs text-slate-500">{sub}</p>}
  </div>
);
}

// ── Page ─────────────────────────────────────────────────────────────────────
export default function HomePage() {
  return (
    <div className="min-h-screen text-slate-100" style={{ background: "#0b1324" }}>

      {/* ── Top navigation ────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-50 border-b border-slate-700/50"
        style={{ background: "rgba(11,19,36,0.95)", backdropFilter: "blur(16px)" }}>
        <div className="mx-auto flex max-w-[1440px] items-center justify-between px-6 py-4 lg:px-8">

          {/* Wordmark */}
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-md"
              style={{ background: "linear-gradient(135deg,#4338ca,#6366f1)" }}>
              <span className="text-[10px] font-black text-white tracking-tight">ICF</span>
            </div>
            <span className="text-sm font-bold text-white">ICF AI Copilot</span>
            <span className="hidden md:inline-block h-4 w-px bg-slate-600/60" />
            <span className="hidden md:inline text-xs text-slate-400">Integrative Cognitive Framework</span>
          </div>

          {/* Nav */}
          <nav aria-label="Workspace navigation" className="hidden md:flex items-center gap-1">
            {[
              { label: "Workspace",  href: "/",            active: true  },
              { label: "Assessment", href: "/demo",         active: false },
              { label: "Framework",  href: "#domains",      active: false },
            ].map(item => (
              <Link key={item.label} href={item.href}
                className={`rounded-md px-4 py-2 text-sm font-medium transition-colors ${
                  item.active
                    ? "bg-indigo-600/20 text-indigo-300 border border-indigo-500/30"
                    : "text-slate-300 hover:bg-slate-700/40 hover:text-white"
                }`}>
                {item.label}
              </Link>
            ))}
          </nav>

          {/* Actions */}
          <div className="flex items-center gap-3">
            <Link href="/demo?mode=demo"
              className="hidden sm:flex items-center gap-1.5 rounded-md border border-slate-600 px-3 py-2 text-xs font-medium text-slate-300 transition-colors hover:border-slate-400 hover:text-white">
              <PlayCircle className="h-3.5 w-3.5" />
              Sample Profile
            </Link>
            <Link href="/demo"
              className="flex items-center gap-1.5 rounded-md px-4 py-2 text-xs font-semibold text-white transition-all hover:brightness-110"
              style={{ background: "#4f46e5", boxShadow: "0 1px 3px rgba(0,0,0,0.3), 0 0 0 1px rgba(99,102,241,0.4)" }}>
              Begin Assessment
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
      </header>

      {/* ── Main workspace ────────────────────────────────────────────────── */}
      <main className="mx-auto max-w-[1440px] px-6 py-7 lg:px-8">

        {/* ── Workspace title bar ───────────────────────────────────────── */}
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-lg font-semibold text-white">Decision Intelligence Workspace</h1>
            <p className="text-xs text-slate-400 mt-0.5">Sample profile · ICF-M62-G75-B44-RM · {new Date().toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}</p>
          </div>
          <div className="flex items-center gap-2">
            <RiskBadge level={SAMPLE.riskLevel} />
            <span className="hidden sm:inline-flex items-center gap-1.5 rounded-full border border-amber-400/30 px-3 py-1 text-xs font-medium text-amber-300"
              style={{ background: "rgba(245,158,11,0.07)" }}>
              Sample data · Begin assessment for your profile
            </span>
          </div>
        </div>

        {/* ── Primary grid: Graph + KPIs ────────────────────────────────── */}
        <div className="mb-5 grid gap-5 xl:grid-cols-[480px_1fr]">

          {/* Human Development Graph — centrepiece */}
          <div className="rounded-xl border border-slate-700/50 p-6"
            style={{ background: "rgba(17,26,48,0.95)" }}
            aria-label="Human Development Graph panel">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <GitBranch className="h-4 w-4 text-indigo-400" aria-hidden="true" />
                <h2 className="text-sm font-semibold text-white">Human Development Graph</h2>
              </div>
              <span className="text-xs text-slate-400">3 / 6 domains active</span>
            </div>

            <div className="flex justify-center">
              <DashboardGraph />
            </div>

            {/* Domain legend */}
            <div className="mt-4 flex flex-wrap justify-center gap-3">
              {DOMAINS_LIST.map(d => (
                <div key={d.id} className="flex items-center gap-1.5 text-xs">
                  <span className="h-2 w-2 rounded-full flex-shrink-0"
                    style={{ background: d.available ? (DOMAIN_COLORS[d.id] ?? "#64748b") : "#475569" }} />
                  <span className={d.available ? "text-slate-200" : "text-slate-500"}>
                    {d.label}
                    {d.available && d.score !== null && (
                      <span className="ml-1 tabular-nums font-semibold"
                        style={{ color: DOMAIN_COLORS[d.id] }}>{d.score}</span>
                    )}
                    {!d.available && <span className="ml-1 text-slate-600">—</span>}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Right column — KPIs + Decision Summary */}
          <div className="flex flex-col gap-4">

            {/* KPI row */}
            <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
              <KpiCard label="Decision Readiness" value={SAMPLE.decisionReadiness}
                color={scoreColor(SAMPLE.decisionReadiness)} sub="out of 100" />
              <KpiCard label="Decision Confidence" value={SAMPLE.decisionConfidence}
                color={scoreColor(SAMPLE.decisionConfidence)} sub="Signal consistency" />
              <KpiCard label="Explainability" value={`${SAMPLE.explainability}%`}
                color="#a5b4fc" sub="Fully verifiable" />
              <div className="rounded-xl border border-slate-700/60 p-5"
                style={{ background: "rgba(22,32,58,0.9)" }}>
                <p className="text-xs font-medium uppercase tracking-widest text-slate-400 mb-2">Pattern</p>
                <p className="text-3xl font-bold text-indigo-300 tabular-nums">{SAMPLE.pattern}</p>
                <p className="mt-1 text-xs text-slate-400">Recommendation</p>
              </div>
            </div>

            {/* Domain scores strip */}
            <div className="rounded-xl border border-slate-700/50 p-5"
              style={{ background: "rgba(17,26,48,0.95)" }}>
              <p className="text-xs font-medium uppercase tracking-widest text-slate-400 mb-4">Domain Scores</p>
              <div className="space-y-3">
                {DOMAINS_LIST.filter(d => d.available && d.score !== null).map(d => (
                  <div key={d.id}>
                    <div className="flex items-center justify-between text-xs mb-1.5">
                      <div className="flex items-center gap-2">
                        <span className="h-2 w-2 rounded-full"
                          style={{ background: DOMAIN_COLORS[d.id] ?? "#64748b" }} />
                        <span className="text-slate-200 font-medium">{d.label}</span>
                      </div>
                      <span className="font-bold tabular-nums"
                        style={{ color: DOMAIN_COLORS[d.id] }}>{d.score}</span>
                    </div>
                    <div className="h-1.5 w-full rounded-full overflow-hidden"
                      style={{ background: "rgba(51,65,85,0.6)" }}>
                      <div className="h-1.5 rounded-full transition-all duration-700"
                        style={{
                          width: `${d.score}%`,
                          background: DOMAIN_COLORS[d.id],
                        }} />
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-3 pt-3 border-t border-slate-700/50">
                <div className="flex gap-4 text-xs">
                  <span className="text-slate-400">Strongest: <span className="text-green-400 font-medium">{SAMPLE.strongestSignal}</span></span>
                  <span className="text-slate-400">Constraint: <span className="text-orange-400 font-medium">{SAMPLE.primaryConstraint}</span></span>
                </div>
              </div>
            </div>

            {/* Decision Summary */}
            <div className="rounded-xl border border-indigo-500/25 p-5 flex-1"
              style={{ background: "rgba(22,32,58,0.9)" }}>
              <p className="text-xs font-medium uppercase tracking-widest text-slate-400 mb-3">Decision Summary</p>
              <p className="text-sm font-medium text-white leading-relaxed mb-3">{SAMPLE.recommendation}</p>
              <div className="rounded-lg border border-slate-600/50 p-3"
                style={{ background: "rgba(30,42,68,0.7)" }}>
                <p className="text-xs text-slate-400 uppercase tracking-wide mb-1">Recommended next action</p>
                <p className="text-sm text-slate-100">{SAMPLE.nextAction}</p>
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                {["Deterministic logic", "Zero external APIs", "Full explainability"].map(b => (
                  <span key={b} className="inline-flex items-center gap-1 rounded-full border border-slate-600/60 px-2.5 py-0.5 text-xs text-slate-400">
                    <CheckCircle2 className="h-3 w-3 text-green-400" />
                    {b}
                  </span>
                ))}
              </div>
            </div>

          </div>
        </div>

        {/* ── Reasoning pipeline ────────────────────────────────────────── */}
        <div className="mb-5 rounded-xl border border-slate-700/50 p-6"
          style={{ background: "rgba(17,26,48,0.95)" }}>
          <div className="flex items-center gap-2 mb-5">
            <Layers className="h-4 w-4 text-indigo-400" aria-hidden="true" />
            <h2 className="text-sm font-semibold text-white">Decision Reasoning Pipeline</h2>
            <span className="ml-auto text-xs text-slate-400">Deterministic · Rule-based · No machine learning</span>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
            {REASONING_STEPS.map((step, i) => (
              <div key={step.stage} className="relative rounded-lg border border-slate-600/40 p-4"
                style={{ background: "rgba(22,32,58,0.8)" }}>
                {/* Connector arrow for non-last items on desktop */}
                {i < REASONING_STEPS.length - 1 && (
                  <div className="hidden xl:block absolute -right-2 top-1/2 -translate-y-1/2 z-10">
                    <ArrowRight className="h-3 w-3 text-slate-500" />
                  </div>
                )}
                <div className="flex items-center gap-2 mb-2">
                  <div className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full border border-indigo-400/60 bg-indigo-500/20 text-[10px] font-bold text-indigo-300">
                    {step.n}
                  </div>
                  <p className="text-[10px] uppercase tracking-wide text-slate-400">{step.stage}</p>
                </div>
                <p className="text-xs font-semibold text-slate-100 mb-1 leading-snug">{step.summary}</p>
                <p className="text-[11px] text-slate-400 leading-relaxed">{step.detail}</p>
              </div>
            ))}
          </div>
        </div>

        {/* ── Bottom row: Domains + Start assessment ────────────────────── */}
        <div className="grid gap-5 lg:grid-cols-[1fr_340px]" id="domains">

          {/* ICF Domains */}
          <div className="rounded-xl border border-slate-700/50 p-6"
            style={{ background: "rgba(17,26,48,0.95)" }}>
            <div className="flex items-center gap-2 mb-5">
              <GitBranch className="h-4 w-4 text-indigo-400" aria-hidden="true" />
              <h2 className="text-sm font-semibold text-white">ICF Domains</h2>
              <span className="ml-auto text-xs text-slate-400">Integrative Cognitive Framework</span>
            </div>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {[
                { id: "mind",     label: "Mind",     icon: Brain,       desc: "Cognitive clarity, concentration, mental load.",         available: true  },
                { id: "goal",     label: "Goal",     icon: Target,      desc: "Goal clarity, importance, confidence, next steps.",      available: true  },
                { id: "body",     label: "Body",     icon: Zap,         desc: "Energy, recovery, workload, sustained attention.",       available: true  },
                { id: "language", label: "Language", icon: ShieldCheck, desc: "Communication patterns, framing, narrative coherence.",  available: false },
                { id: "scenario", label: "Scenario", icon: Compass,     desc: "Risk modelling, decision branching, consequences.",      available: false },
                { id: "global",   label: "Global",   icon: Network,     desc: "System awareness, cultural context, long-range impact.", available: false },
              ].map(d => {
                const Icon = d.icon;
                const col = DOMAIN_COLORS[d.id] ?? "#64748b";
                return (
                  <div key={d.id} className="relative rounded-lg border p-4"
                    style={{
                      borderColor: d.available ? `${col}30` : "rgba(255,255,255,0.05)",
                      background:  d.available ? `${col}0a` : "rgba(22,32,58,0.5)",
                    }}>
                    {!d.available && (
                      <div className="absolute right-3 top-3 flex items-center gap-1 text-[10px] text-slate-500">
                        <Lock className="h-2.5 w-2.5" /> Roadmap
                      </div>
                    )}
                    <div className="flex items-start gap-3">
                      <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-md"
                        style={{ background: d.available ? `${col}1a` : "rgba(30,41,59,0.5)" }}>
                        <Icon className="h-4 w-4" style={{ color: d.available ? col : "#64748b" }} aria-hidden="true" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold mb-0.5" style={{ color: d.available ? col : "#64748b" }}>
                          {d.label}
                        </p>
                        <p className={`text-xs leading-relaxed ${d.available ? "text-slate-300" : "text-slate-500"}`}>
                          {d.desc}
                        </p>
                        {d.available && (
                          <div className="mt-2 flex items-center gap-1">
                            <span className="h-1.5 w-1.5 rounded-full bg-green-500" />
                            <span className="text-[10px] text-green-400 font-medium">Active</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Assessment panel */}
          <div className="flex flex-col gap-4">
            {/* Start assessment */}
            <div className="rounded-xl border border-slate-700/50 p-6"
              style={{ background: "rgba(17,26,48,0.95)" }}>
              <div className="flex items-center gap-2 mb-4">
                <Activity className="h-4 w-4 text-indigo-400" />
                <h2 className="text-sm font-semibold text-white">Assessment</h2>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed mb-5">
                12 questions across Mind, Goal and Body. Takes ~3 minutes.
                All processing is local — no data is sent anywhere.
              </p>
              <div className="space-y-2">
                <Link href="/demo"
                  className="flex w-full items-center justify-center gap-2 rounded-lg py-2.5 text-sm font-semibold text-white transition-all hover:brightness-110"
                  style={{ background: "#4f46e5", boxShadow: "0 1px 3px rgba(0,0,0,0.3), 0 0 0 1px rgba(99,102,241,0.4)" }}>
                  Begin Assessment
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
                <Link href="/demo?mode=demo"
                  className="flex w-full items-center justify-center gap-2 rounded-lg border border-slate-600 py-2.5 text-xs font-medium text-slate-300 transition-colors hover:border-slate-400 hover:text-white">
                  <PlayCircle className="h-3.5 w-3.5" />
                  Load Sample Profile
                </Link>
              </div>
            </div>

            {/* Platform capabilities */}
            <div className="rounded-xl border border-slate-700/50 p-6 flex-1"
              style={{ background: "rgba(17,26,48,0.95)" }}>
              <div className="flex items-center gap-2 mb-4">
                <BarChart3 className="h-4 w-4 text-indigo-400" />
                <h2 className="text-sm font-semibold text-white">Capabilities</h2>
              </div>
              <ul className="space-y-2.5">
                {[
                  { icon: Brain,     label: "Decision Intelligence",  desc: "Structured deterministic reasoning" },
                  { icon: GitBranch, label: "Human Development Graph",desc: "Six-domain radial model" },
                  { icon: Layers,    label: "Decision Twin",          desc: "What-if signal simulator" },
                  { icon: TrendingUp,label: "Explainability Engine",  desc: "Full reasoning transparency" },
                  { icon: FileText,  label: "Executive Report",       desc: "Print-ready PDF analysis" },
                ].map(c => {
                  const Icon = c.icon;
                  return (
                    <li key={c.label} className="flex items-center gap-3 text-xs">
                      <div className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-md"
                        style={{ background: "rgba(99,102,241,0.15)" }}>
                        <Icon className="h-3.5 w-3.5 text-indigo-300" aria-hidden="true" />
                      </div>
                      <div>
                        <span className="font-medium text-slate-200">{c.label}</span>
                        <span className="ml-1.5 text-slate-400">{c.desc}</span>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </div>
          </div>

        </div>

      </main>

      {/* ── Footer ────────────────────────────────────────────────────────── */}
      <footer className="mx-auto max-w-[1440px] border-t border-slate-700/40 px-6 py-5 lg:px-8 mt-6"
        role="contentinfo">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between text-xs text-slate-500">
          <div className="flex items-center gap-3">
            <span className="font-semibold text-slate-400">ICF AI Copilot</span>
            <span>·</span>
            <span>Integrative Cognitive Framework</span>
            <span>·</span>
            <span>Explainable Decision Intelligence</span>
          </div>
          <div className="flex items-center gap-3">
            <span>IBM AI Build Challenge MVP</span>
            <span>·</span>
            <span className="text-amber-700">Decision Support — Not a Diagnosis</span>
            <span>·</span>
            <span>© 2025</span>
          </div>
        </div>
      </footer>

    </div>
  );
}
