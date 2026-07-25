"use client";

import { useState } from "react";
import { type Answers, scoreAnswers, SAMPLE_ANSWERS } from "@/lib/demo/scoring";
import { selectRecommendation } from "@/lib/demo/recommendations";
import type { ScoreResult } from "@/lib/demo/scoring";
import type { Recommendation } from "@/lib/demo/recommendations";
import { cn } from "@/lib/utils";
import {
  ArrowLeft, ArrowRight, RotateCcw, Brain, Target, Zap,
  CheckCircle2, AlertTriangle, Info, Printer, ChevronDown, ChevronUp,
  FlaskConical, Copy, Check, GitBranch, Sliders,
} from "lucide-react";

// ── Question definitions ────────────────────────────────────────────────────────

const QUESTIONS = [
  { id: "m1", section: "mind", text: "How clear and sharp does your thinking feel right now?", reverse: false },
  { id: "m2", section: "mind", text: "How well are you able to concentrate on one thing at a time?", reverse: false },
  { id: "m3", section: "mind", text: "How much does mental overload feel like a problem for you today?", reverse: true, reverseNote: "(1 = not at all, 5 = extremely)" },
  { id: "m4", section: "mind", text: "How much emotional pressure are you carrying right now?", reverse: true, reverseNote: "(1 = none, 5 = overwhelming)" },
  { id: "g1", section: "goal", text: "How clearly can you describe your main goal right now?", reverse: false },
  { id: "g2", section: "goal", text: "How personally important is achieving this goal to you?", reverse: false },
  { id: "g3", section: "goal", text: "How confident are you that you can make meaningful progress on it?", reverse: false },
  { id: "g4", section: "goal", text: "How clear are the next concrete steps you need to take?", reverse: false },
  { id: "c1", section: "capacity", text: "How would you rate your current physical and mental energy level?", reverse: false },
  { id: "c2", section: "capacity", text: "How well have you slept and recovered in recent days?", reverse: false },
  { id: "c3", section: "capacity", text: "How heavy is your current workload feeling?", reverse: true, reverseNote: "(1 = light, 5 = crushing)" },
  { id: "c4", section: "capacity", text: "How well can you sustain focused work for 60+ minutes right now?", reverse: false },
] as const;

type QuestionId = typeof QUESTIONS[number]["id"];

const SECTIONS = [
  { id: "mind",     label: "Mind",            icon: Brain,  color: "text-blue-400",  bg: "bg-blue-400/10",  border: "border-blue-400/30",  questions: ["m1","m2","m3","m4"] },
  { id: "goal",     label: "Goal",            icon: Target, color: "text-green-400", bg: "bg-green-400/10", border: "border-green-400/30", questions: ["g1","g2","g3","g4"] },
  { id: "capacity", label: "Body / Capacity", icon: Zap,    color: "text-amber-400", bg: "bg-amber-400/10", border: "border-amber-400/30", questions: ["c1","c2","c3","c4"] },
] as const;

const SCALE_LABELS = ["Strongly disagree", "Disagree", "Neutral", "Agree", "Strongly agree"];
type Phase = "intro" | "assessment" | "dashboard" | "report";
const EMPTY_ANSWERS: Answers = { m1:0, m2:0, m3:0, m4:0, g1:0, g2:0, g3:0, g4:0, c1:0, c2:0, c3:0, c4:0 };

// ── Colour helpers (unchanged) ──────────────────────────────────────────────────

function scoreColor(v: number) {
  if (v >= 65) return "text-green-400";
  if (v >= 40) return "text-amber-400";
  return "text-red-400";
}
function scoreBarColor(v: number) {
  if (v >= 65) return "bg-green-500";
  if (v >= 40) return "bg-amber-500";
  return "bg-red-500";
}
function riskColor(r: string) {
  if (r === "Low")      return "text-green-400 bg-green-400/10 border-green-400/30";
  if (r === "Moderate") return "text-amber-400 bg-amber-400/10 border-amber-400/30";
  return "text-red-400 bg-red-400/10 border-red-400/30";
}

// ── Shared score-bar sub-component (unchanged) ──────────────────────────────────

function ScoreBar({ label, value, icon: Icon, iconColor }: { label: string; value: number; icon: React.ElementType; iconColor: string }) {
  return (
    <div>
      <div className="flex items-center justify-between text-sm mb-1.5">
        <span className="flex items-center gap-1.5 font-medium text-slate-300">
          <Icon className={cn("h-4 w-4", iconColor)} />{label}
        </span>
        <span className={cn("font-bold", scoreColor(value))}>{value}<span className="text-slate-500 font-normal">/100</span></span>
      </div>
      <div className="h-2 w-full rounded-full bg-slate-700">
        <div className={cn("h-2 rounded-full transition-all duration-700", scoreBarColor(value))} style={{ width: `${value}%` }} />
      </div>
    </div>
  );
}

// ── Simulate a ScoreResult purely from three slider values ─────────────────────
// Reuses the existing formulas from scoring.ts without duplicating them.
// focusIndex = mind*0.6 + capacity*0.4
// decisionReadiness = goal*0.40 + mind*0.35 + capacity*0.25
// riskLevel from min(domains)
interface SimScores {
  focus: number; goal: number; capacity: number;
  decisionReadiness: number;
  riskLevel: "Low" | "Moderate" | "High";
  primaryConstraint: string;
}
function simulateScores(focus: number, goal: number, capacity: number): SimScores {
  const mind = Math.round(focus / 0.6); // approximate mind from focusIndex
  // Use clamped mind for readiness
  const m = Math.min(100, mind);
  const decisionReadiness = Math.round(goal * 0.40 + m * 0.35 + capacity * 0.25);
  const lowestVal = Math.min(focus, goal, capacity);
  const riskLevel: SimScores["riskLevel"] =
    lowestVal < 35 ? "High" : lowestVal < 55 ? "Moderate" : "Low";
  const scores = { Focus: focus, Goal: goal, Capacity: capacity };
  const sorted = Object.entries(scores).sort((a, b) => a[1] - b[1]);
  const primaryConstraint = `${sorted[0]![0]} (${sorted[0]![1]}/100)`;
  return { focus, goal, capacity, decisionReadiness, riskLevel, primaryConstraint };
}

// Build a minimal ScoreResult-compatible object for selectRecommendation
function simToScoreResult(s: SimScores): ScoreResult {
  const spread = Math.max(s.focus, s.goal, s.capacity) - Math.min(s.focus, s.goal, s.capacity);
  const sorted = Object.entries({ Mind: s.focus, Goal: s.goal, Capacity: s.capacity }).sort((a,b) => b[1]-a[1]);
  return {
    mindScore: s.focus, goalScore: s.goal, capacityScore: s.capacity,
    focusIndex: s.focus, goalAlignment: s.goal, capacityIndex: s.capacity,
    decisionReadiness: s.decisionReadiness,
    riskLevel: s.riskLevel,
    strongestSignal: `${sorted[0]![0]} (${sorted[0]![1]}/100)`,
    primaryConstraint: s.primaryConstraint,
    confidenceLevel: spread < 20 ? "High" : spread < 40 ? "Moderate" : "Low",
    rawMind: s.focus, rawGoal: s.goal, rawCapacity: s.capacity,
  };
}

// ── ICF Profile Code (deterministic, based on original scores only) ────────────
function buildProfileCode(s: ScoreResult): string {
  const rCode = s.riskLevel === "Low" ? "RL" : s.riskLevel === "Moderate" ? "RM" : "RH";
  return `ICF-M${s.focusIndex}-G${s.goalAlignment}-B${s.capacityIndex}-${rCode}`;
}

// ── Human Development Graph (pure SVG, no dependency) ─────────────────────────
// Six-node radial layout. Assessed nodes show score colour; unassessed are dim.
const GRAPH_NODES = [
  { id: "mind",     label: "Mind",     angle: -90  },
  { id: "language", label: "Language", angle: -30  },
  { id: "global",   label: "Global",   angle:  30  },
  { id: "body",     label: "Body",     angle:  90  },
  { id: "scenario", label: "Scenario", angle: 150  },
  { id: "goal",     label: "Goal",     angle: 210  },
] as const;

function HumanDevelopmentGraph({ mind, goal, body }: { mind: number; goal: number; body: number }) {
  const R = 100; // orbit radius
  const cx = 160; const cy = 160; // centre of 320×320 viewBox

  // Value for assessed nodes 0–1 (ring radius); unassessed = 0.15 (faint)
  const scores: Record<string, number | null> = {
    mind, goal, body, language: null, scenario: null, global: null,
  };

  // Positions
  const pos = GRAPH_NODES.map(n => {
    const rad = (n.angle * Math.PI) / 180;
    return { ...n, x: cx + R * Math.cos(rad), y: cy + R * Math.sin(rad) };
  });

  // Build polygon path for assessed ring (only 3 points: mind, goal, body)
  // mind=top(-90), goal=bottom-left(210), body=bottom(90)
  const assessedPos = pos.filter(p => ["mind","goal","body"].includes(p.id));
  const polyPoints = assessedPos
    .map(p => {
      const val = (scores[p.id] ?? 0) / 100;
      const rad = (GRAPH_NODES.find(n => n.id === p.id)!.angle * Math.PI) / 180;
      const r = val * R;
      return `${cx + r * Math.cos(rad)},${cy + r * Math.sin(rad)}`;
    })
    .join(" ");

  return (
    <div className="flex flex-col items-center">
      <svg
        viewBox="0 0 320 320"
        className="w-full max-w-[280px] sm:max-w-[320px]"
        role="img"
        aria-label="ICF Human Development Graph showing assessed domain scores"
      >
        {/* Concentric guide rings */}
        {[0.25, 0.5, 0.75, 1].map(r => (
          <circle key={r} cx={cx} cy={cy} r={R * r} fill="none" stroke="rgba(99,102,241,0.12)" strokeWidth="1" />
        ))}
        {/* Spoke lines */}
        {pos.map(p => (
          <line key={p.id} x1={cx} y1={cy} x2={p.x} y2={p.y} stroke="rgba(99,102,241,0.15)" strokeWidth="1" />
        ))}

        {/* Assessed-domain fill polygon */}
        <polygon points={polyPoints} fill="rgba(99,102,241,0.15)" stroke="rgba(99,102,241,0.6)" strokeWidth="1.5" strokeLinejoin="round" />

        {/* Node circles */}
        {pos.map(p => {
          const val = scores[p.id];
          const isAssessed = val !== null;
          const norm = isAssessed ? (val! / 100) : 0.15;
          const rad = (GRAPH_NODES.find(n => n.id === p.id)!.angle * Math.PI) / 180;
          const nx = cx + norm * R * Math.cos(rad);
          const ny = cy + norm * R * Math.sin(rad);
          const dotColor = isAssessed
            ? (val! >= 65 ? "#22c55e" : val! >= 40 ? "#f59e0b" : "#ef4444")
            : "#334155";
          return (
            <g key={p.id}>
              {/* Outer anchor node */}
              <circle cx={p.x} cy={p.y} r={5} fill={isAssessed ? dotColor : "#1e293b"} stroke={isAssessed ? dotColor : "#475569"} strokeWidth="1.5" />
              {/* Score position dot */}
              {isAssessed && <circle cx={nx} cy={ny} r={4} fill={dotColor} opacity={0.9} />}
              {/* Label */}
              <text
                x={p.x + (p.x < cx - 5 ? -10 : p.x > cx + 5 ? 10 : 0)}
                y={p.y + (p.y < cy - 5 ? -10 : p.y > cy + 5 ? 14 : 0)}
                textAnchor={p.x < cx - 5 ? "end" : p.x > cx + 5 ? "start" : "middle"}
                fontSize="11"
                fill={isAssessed ? "#e2e8f0" : "#475569"}
                fontWeight={isAssessed ? "600" : "400"}
              >
                {p.label}
              </text>
              {/* Score label */}
              {isAssessed && (
                <text
                  x={p.x + (p.x < cx - 5 ? -10 : p.x > cx + 5 ? 10 : 0)}
                  y={p.y + (p.y < cy - 5 ? -22 : p.y > cy + 5 ? 26 : 12)}
                  textAnchor={p.x < cx - 5 ? "end" : p.x > cx + 5 ? "start" : "middle"}
                  fontSize="10"
                  fill={dotColor}
                >
                  {val}
                </text>
              )}
            </g>
          );
        })}
        {/* Centre label */}
        <text x={cx} y={cy - 6} textAnchor="middle" fontSize="10" fill="#6366f1" fontWeight="700">ICF</text>
        <text x={cx} y={cy + 6} textAnchor="middle" fontSize="9" fill="#64748b">MVP</text>
      </svg>

      {/* Accessible text summary */}
      <p className="mt-2 text-center text-xs text-slate-500 max-w-xs" aria-live="polite">
        Mind {mind}/100 · Goal {goal}/100 · Body {body}/100 · Language, Scenario, Global not yet assessed
      </p>
    </div>
  );
}

// ── Cross-domain insights (deterministic rules) ────────────────────────────────
function crossDomainInsights(mind: number, goal: number, capacity: number) {
  const gap = Math.max(mind, goal, capacity) - Math.min(mind, goal, capacity);
  const strongest = mind >= goal && mind >= capacity ? "Mind" : goal >= capacity ? "Goal" : "Body/Capacity";
  const weakest   = mind <= goal && mind <= capacity ? "Mind" : goal <= capacity ? "Goal" : "Body/Capacity";
  const scores: Record<string,number> = { Mind: mind, Goal: goal, Capacity: capacity };
  const pairs = [["Mind","Goal"],["Mind","Capacity"],["Goal","Capacity"]];
  let maxGap = 0; let tensionPair = ["Mind","Goal"];
  pairs.forEach(([a,b]) => { if (!a || !b) return; const d = Math.abs((scores[a] ?? 0) - (scores[b] ?? 0)); if (d > maxGap) { maxGap = d; tensionPair = [a,b]; } });

  let primaryTension = "";
  if (goal >= 65 && capacity < 50)    primaryTension = "Clear direction without sufficient capacity — scope risk.";
  else if (capacity >= 65 && goal < 50) primaryTension = "Available capacity without a clear target — direction risk.";
  else if (mind < 50 && goal >= 65)    primaryTension = "Strong goal with constrained focus — execution quality risk.";
  else if (gap < 15)                   primaryTension = "Scores are closely aligned — conditions support structured action.";
  else                                 primaryTension = `${tensionPair[0]} and ${tensionPair[1]} diverge by ${maxGap} points — re-balance before scaling effort.`;

  const leverage =
    weakest === "Mind"     ? "Improving cognitive clarity will unlock both goal execution and capacity use." :
    weakest === "Goal"     ? "Clarifying the goal will make existing capacity and focus immediately more productive." :
    "Recovery and energy restoration will compound across both Mind and Goal domains.";

  let narrativeInsight = "";
  if      (goal >= 65 && capacity < 50)    narrativeInsight = "Your direction is clear, but current capacity may not support the full scope.";
  else if (capacity >= 65 && goal < 50)    narrativeInsight = "You have available capacity, but the decision target requires clarification.";
  else if (mind < 50  && goal >= 65)       narrativeInsight = "The goal is meaningful, but cognitive overload may reduce execution quality.";
  else if (gap < 15)                       narrativeInsight = "Your current signals are sufficiently aligned for structured action.";
  else if (mind >= 65 && goal >= 65)       narrativeInsight = "Strong mind and goal clarity — capacity is the only limiting factor right now.";
  else                                     narrativeInsight = "Mixed signals across domains — prioritise stabilising the weakest area before expanding commitments.";

  return { strongest, weakest, gap, primaryTension, leverage, narrativeInsight };
}

// ── Scenario button rules (documented, deterministic) ──────────────────────────
const SCENARIOS = [
  {
    id: "focus",    label: "Improve focus",
    description: "Focus +15 (max 100). Represents deliberate reduction of distractions.",
    apply: (f: number, g: number, c: number) => ({ f: Math.min(100, f + 15), g, c }),
  },
  {
    id: "scope",    label: "Reduce scope",
    description: "Capacity +10. Reducing scope frees mental and physical resource.",
    apply: (f: number, g: number, c: number) => ({ f, g, c: Math.min(100, c + 10) }),
  },
  {
    id: "recovery", label: "Increase recovery",
    description: "Capacity +15 (max 100). Improved rest directly increases available capacity.",
    apply: (f: number, g: number, c: number) => ({ f, g, c: Math.min(100, c + 15) }),
  },
  {
    id: "goal",     label: "Clarify goal",
    description: "Goal Alignment +15 (max 100). Investing in goal clarity raises decision readiness.",
    apply: (f: number, g: number, c: number) => ({ f, g: Math.min(100, g + 15), c }),
  },
] as const;

// ── Main component ──────────────────────────────────────────────────────────────

export function DemoExperience() {
  // ── Existing state (unchanged) ──────────────────────────────────────────────
  const [phase, setPhase]           = useState<Phase>("intro");
  const [answers, setAnswers]       = useState<Answers>(EMPTY_ANSWERS);
  const [currentSection, setCurrentSection] = useState(0);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [scores, setScores]         = useState<ScoreResult | null>(null);
  const [rec, setRec]               = useState<Recommendation | null>(null);
  const [whyOpen, setWhyOpen]       = useState(true);
  const [isSample, setIsSample]     = useState(false);

  // ── New state: Decision Twin simulator ─────────────────────────────────────
  const [simFocus,    setSimFocus]    = useState(0);
  const [simGoal,     setSimGoal]     = useState(0);
  const [simCapacity, setSimCapacity] = useState(0);
  const [lastScenario, setLastScenario] = useState<string | null>(null);
  const [copied, setCopied]           = useState(false);

  // ── Derived (assessment phase helpers, unchanged) ──────────────────────────
  const section      = SECTIONS[currentSection]!;
  const sectionQIds  = section.questions as readonly string[];
  const sectionQuestions = QUESTIONS.filter(q => sectionQIds.includes(q.id));
  const sectionAnswered  = sectionQuestions.filter(q => (answers[q.id as QuestionId] ?? 0) > 0).length;
  const totalAnswered    = QUESTIONS.filter(q => (answers[q.id as QuestionId] ?? 0) > 0).length;
  const overallProgress  = Math.round((totalAnswered / 12) * 100);

  function setAnswer(id: QuestionId, val: number) {
    setAnswers(prev => ({ ...prev, [id]: val }));
    setValidationError(null);
  }

  function handleContinue() {
    if (sectionAnswered < 4) {
      setValidationError("Please answer all questions in this section before continuing.");
      return;
    }
    setValidationError(null);
    if (currentSection < SECTIONS.length - 1) {
      setCurrentSection(s => s + 1);
    } else {
      const s = scoreAnswers(answers);
      const r = selectRecommendation(s);
      setScores(s);
      setRec(r);
      // Initialise simulator from real scores
      setSimFocus(s.focusIndex);
      setSimGoal(s.goalAlignment);
      setSimCapacity(s.capacityIndex);
      setLastScenario(null);
      setPhase("dashboard");
    }
  }

  function handleBack() {
    if (currentSection > 0) setCurrentSection(s => s - 1);
    else setPhase("intro");
  }

  function handleRestart() {
    setPhase("intro");
    setAnswers(EMPTY_ANSWERS);
    setCurrentSection(0);
    setValidationError(null);
    setScores(null);
    setRec(null);
    setIsSample(false);
    setLastScenario(null);
  }

  function loadSample() {
    const s = scoreAnswers(SAMPLE_ANSWERS);
    const r = selectRecommendation(s);
    setAnswers(SAMPLE_ANSWERS);
    setScores(s);
    setRec(r);
    setSimFocus(s.focusIndex);
    setSimGoal(s.goalAlignment);
    setSimCapacity(s.capacityIndex);
    setLastScenario(null);
    setIsSample(true);
    setPhase("dashboard");
  }

  function resetSimulation() {
    if (!scores) return;
    setSimFocus(scores.focusIndex);
    setSimGoal(scores.goalAlignment);
    setSimCapacity(scores.capacityIndex);
    setLastScenario(null);
  }

  function applyScenario(scenario: typeof SCENARIOS[number]) {
    const { f, g, c } = scenario.apply(simFocus, simGoal, simCapacity);
    setSimFocus(f); setSimGoal(g); setSimCapacity(c);
    setLastScenario(scenario.id);
  }

  function copyCode(code: string) {
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(code).then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      });
    }
  }

  // ── INTRO (unchanged) ───────────────────────────────────────────────────────
  if (phase === "intro") {
    return (
      <div className="mx-auto max-w-2xl px-4 py-12 text-center">
        <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-indigo-400/30 bg-indigo-400/10 px-3 py-1 text-sm text-indigo-300">
          <FlaskConical className="h-4 w-4" /> Decision Intelligence Assessment
        </div>
        <h1 className="text-3xl font-bold text-white sm:text-4xl">ICF Demo Assessment</h1>
        <p className="mt-4 text-slate-400 leading-relaxed">
          12 questions across three domains — Mind, Goal and Body / Capacity.
          Takes approximately 3 minutes. No data is sent anywhere.
        </p>
        <div className="mt-8 grid gap-4 text-left sm:grid-cols-3">
          {SECTIONS.map(s => {
            const Icon = s.icon;
            return (
              <div key={s.id} className={cn("rounded-xl border p-4", s.bg, s.border)}>
                <Icon className={cn("h-5 w-5 mb-2", s.color)} />
                <p className={cn("font-semibold text-sm", s.color)}>{s.label}</p>
                <p className="mt-1 text-xs text-slate-400">4 questions</p>
              </div>
            );
          })}
        </div>
        <div className="mt-8 rounded-xl border border-amber-400/20 bg-amber-400/5 p-4 text-left text-sm text-amber-200">
          <AlertTriangle className="mb-2 h-4 w-4 text-amber-400" />
          This is a decision-support prototype. It does not provide medical diagnosis,
          treatment or emergency mental-health services.
        </div>
        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <button onClick={() => setPhase("assessment")}
            className="inline-flex items-center justify-center gap-2 rounded-full bg-white px-8 py-3 font-semibold text-slate-950 hover:bg-slate-200">
            Start assessment <ArrowRight className="h-4 w-4" />
          </button>
          <button onClick={loadSample}
            className="inline-flex items-center justify-center gap-2 rounded-full border border-white/20 px-8 py-3 text-sm font-medium text-slate-300 hover:bg-white/10">
            <FlaskConical className="h-4 w-4" /> Load sample profile
          </button>
        </div>
      </div>
    );
  }

  // ── ASSESSMENT (unchanged) ──────────────────────────────────────────────────
  if (phase === "assessment") {
    const Icon = section.icon;
    return (
      <div className="mx-auto max-w-xl px-4 py-8">
        <div className="mb-2 flex items-center justify-between text-xs text-slate-500">
          <span>{totalAnswered} / 12 answered</span>
          <button onClick={handleRestart} className="flex items-center gap-1 hover:text-slate-300">
            <RotateCcw className="h-3 w-3" /> Restart
          </button>
        </div>
        <div className="mb-6 h-1 w-full overflow-hidden rounded-full bg-slate-800">
          <div className="h-full rounded-full bg-indigo-500 transition-all" style={{ width: `${overallProgress}%` }} />
        </div>
        <div className={cn("mb-6 flex items-center gap-3 rounded-xl border p-4", section.bg, section.border)}>
          <Icon className={cn("h-6 w-6 flex-shrink-0", section.color)} />
          <div>
            <p className={cn("font-bold", section.color)}>{section.label}</p>
            <p className="text-xs text-slate-400">Section {currentSection + 1} of {SECTIONS.length} · 4 questions</p>
          </div>
        </div>
        <div className="space-y-8">
          {sectionQuestions.map((q, qi) => {
            const ans = answers[q.id as QuestionId] ?? 0;
            return (
              <div key={q.id}>
                <p className="mb-1 text-xs text-slate-500">Question {currentSection * 4 + qi + 1} of 12</p>
                <p className="mb-3 font-medium text-white leading-snug">
                  {q.text}
                  {"reverseNote" in q && <span className="ml-1 text-xs text-slate-500">{q.reverseNote}</span>}
                </p>
                <div className="grid grid-cols-5 gap-2">
                  {[1,2,3,4,5].map(v => (
                    <button key={v} onClick={() => setAnswer(q.id as QuestionId, v)}
                      aria-label={`${v} — ${SCALE_LABELS[v-1]}`}
                      className={cn("flex flex-col items-center gap-1 rounded-xl border py-3 text-xs transition-all",
                        ans === v ? "border-indigo-500 bg-indigo-600 text-white font-semibold"
                                  : "border-slate-700 bg-slate-800/60 text-slate-400 hover:border-slate-500 hover:text-slate-200")}>
                      <span className="text-lg font-bold">{v}</span>
                      <span className="hidden text-center leading-tight sm:block">{SCALE_LABELS[v-1]}</span>
                    </button>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
        {validationError && (
          <div className="mt-4 flex items-center gap-2 rounded-lg border border-red-400/30 bg-red-400/10 p-3 text-sm text-red-300">
            <AlertTriangle className="h-4 w-4 flex-shrink-0" /> {validationError}
          </div>
        )}
        <div className="mt-8 flex gap-3">
          <button onClick={handleBack}
            className="flex items-center gap-2 rounded-full border border-slate-700 px-5 py-2.5 text-sm font-medium text-slate-300 hover:bg-slate-800">
            <ArrowLeft className="h-4 w-4" /> Back
          </button>
          <button onClick={handleContinue}
            className="ml-auto flex items-center gap-2 rounded-full bg-indigo-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-indigo-500">
            {currentSection < SECTIONS.length - 1 ? "Continue" : "See my results"}
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    );
  }

  // ── DASHBOARD ───────────────────────────────────────────────────────────────
  if (phase === "dashboard" && scores && rec) {
    const profileCode = buildProfileCode(scores);
    const simS = simulateScores(simFocus, simGoal, simCapacity);
    const simScoreResult = simToScoreResult(simS);
    const simRec = selectRecommendation(simScoreResult);
    const insights = crossDomainInsights(scores.focusIndex, scores.goalAlignment, scores.capacityIndex);
    const simInsights = crossDomainInsights(simFocus, simGoal, simCapacity);

    const drChanged = simS.decisionReadiness !== scores.decisionReadiness;
    const riskChanged = simS.riskLevel !== scores.riskLevel;
    const recChanged = simRec.pattern !== rec.pattern;
    const isSimModified = simFocus !== scores.focusIndex || simGoal !== scores.goalAlignment || simCapacity !== scores.capacityIndex;

    return (
      <div className="mx-auto max-w-3xl px-4 py-8">

        {/* Sample data banner */}
        {isSample && (
          <div className="mb-6 flex items-center gap-3 rounded-xl border border-amber-400/30 bg-amber-400/10 p-3 text-sm text-amber-300">
            <FlaskConical className="h-4 w-4 flex-shrink-0" />
            <span>This is <strong>sample data</strong> — not a real assessment result. Run your own for accurate scores.</span>
          </div>
        )}

        {/* Header */}
        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm text-indigo-400 font-medium">ICF Decision Intelligence</p>
            <h1 className="text-2xl font-bold text-white sm:text-3xl">Your Assessment Results</h1>
          </div>
          <div className="flex gap-2">
            <button onClick={handleRestart} className="flex items-center gap-1.5 rounded-full border border-slate-700 px-4 py-2 text-xs text-slate-400 hover:bg-slate-800">
              <RotateCcw className="h-3.5 w-3.5" /> Restart
            </button>
            <button onClick={() => setPhase("report")} className="flex items-center gap-1.5 rounded-full bg-indigo-600 px-4 py-2 text-xs font-semibold text-white hover:bg-indigo-500">
              Generate report →
            </button>
          </div>
        </div>

        {/* 1. Decision Readiness hero */}
        <div className="mb-6 rounded-2xl border border-indigo-400/30 bg-indigo-500/10 p-6 text-center">
          <p className="text-sm text-slate-400 mb-1">Decision Readiness</p>
          <p className={cn("text-6xl font-bold", scoreColor(scores.decisionReadiness))}>{scores.decisionReadiness}</p>
          <p className="text-slate-500 text-sm mt-1">out of 100</p>
          <div className="mt-4 flex justify-center">
            <span className={cn("rounded-full border px-4 py-1 text-sm font-semibold", riskColor(scores.riskLevel))}>
              Risk Level: {scores.riskLevel}
            </span>
          </div>
        </div>

        {/* Score grid */}
        <div className="mb-6 grid gap-4 sm:grid-cols-3">
          {[
            { label: "Focus Index",    value: scores.focusIndex,    icon: Brain,  color: "text-blue-400" },
            { label: "Goal Alignment", value: scores.goalAlignment, icon: Target, color: "text-green-400" },
            { label: "Capacity Index", value: scores.capacityIndex, icon: Zap,    color: "text-amber-400" },
          ].map(m => (
            <div key={m.label} className="rounded-xl border border-slate-700 bg-slate-800/60 p-5">
              <ScoreBar label={m.label} value={m.value} icon={m.icon} iconColor={m.color} />
            </div>
          ))}
        </div>

        {/* Signals */}
        <div className="mb-6 grid gap-4 sm:grid-cols-2">
          <div className="rounded-xl border border-green-400/20 bg-green-400/5 p-4">
            <p className="text-xs uppercase tracking-wide text-slate-500 mb-1">Strongest signal</p>
            <p className="font-semibold text-green-300">{scores.strongestSignal}</p>
          </div>
          <div className="rounded-xl border border-red-400/20 bg-red-400/5 p-4">
            <p className="text-xs uppercase tracking-wide text-slate-500 mb-1">Primary constraint</p>
            <p className="font-semibold text-red-300">{scores.primaryConstraint}</p>
          </div>
        </div>

        {/* 2. Main recommendation */}
        <div className="mb-6 rounded-2xl border border-indigo-400/30 bg-slate-800/60 p-6">
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs uppercase tracking-wide text-slate-500">Recommendation · Pattern {rec.pattern}</p>
            <span className={cn("rounded-full border px-2.5 py-0.5 text-xs font-semibold",
              scores.confidenceLevel === "High"     ? "border-green-400/30 text-green-300 bg-green-400/10" :
              scores.confidenceLevel === "Moderate" ? "border-amber-400/30 text-amber-300 bg-amber-400/10" :
              "border-slate-600 text-slate-400 bg-slate-700/50")}>
              Confidence: {scores.confidenceLevel}
            </span>
          </div>
          <h2 className="text-xl font-bold text-white mb-2">{rec.title}</h2>
          <p className="text-slate-300 text-sm leading-relaxed mb-4">{rec.rationale}</p>
          <div className="rounded-xl bg-slate-700/50 p-4">
            <p className="text-xs uppercase tracking-wide text-slate-500 mb-1">Recommended next action</p>
            <p className="text-white font-medium">{rec.nextAction}</p>
          </div>
        </div>

        {/* 3. Why this recommendation? */}
        <div className="mb-6 rounded-2xl border border-slate-700 bg-slate-800/40 p-6">
          <button onClick={() => setWhyOpen(o => !o)} className="flex w-full items-center justify-between text-left">
            <div className="flex items-center gap-2">
              <Info className="h-5 w-5 text-indigo-400" />
              <h3 className="font-semibold text-white">Why this recommendation?</h3>
            </div>
            {whyOpen ? <ChevronUp className="h-4 w-4 text-slate-500" /> : <ChevronDown className="h-4 w-4 text-slate-500" />}
          </button>
          {whyOpen && (
            <div className="mt-5 space-y-5 text-sm">
              <p className="text-slate-300 leading-relaxed italic border-l-2 border-indigo-500 pl-4">{rec.whyText}</p>
              <div>
                <p className="text-xs uppercase tracking-wide text-slate-500 mb-2">Influencing factors</p>
                <ul className="space-y-1.5">
                  {rec.influencingFactors.map((f, i) => (
                    <li key={i} className="flex items-start gap-2 text-slate-300">
                      <CheckCircle2 className="mt-0.5 h-4 w-4 flex-shrink-0 text-indigo-400" />{f}
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <p className="text-xs uppercase tracking-wide text-slate-500 mb-2">Missing information</p>
                <ul className="space-y-1.5">
                  {rec.missingInformation.map((m, i) => (
                    <li key={i} className="flex items-start gap-2 text-slate-400">
                      <span className="mt-1 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-slate-600" />{m}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="rounded-lg border border-amber-400/20 bg-amber-400/5 p-3 text-amber-200 text-xs">
                <AlertTriangle className="mb-1 h-3.5 w-3.5 text-amber-400" />
                This is decision support, not an objective diagnosis. Always apply your own judgement.
              </div>
            </div>
          )}
        </div>

        {/* 4. ICF Human Development Graph */}
        <div className="mb-6 rounded-2xl border border-slate-700 bg-slate-800/40 p-6">
          <div className="flex items-center gap-2 mb-1">
            <GitBranch className="h-5 w-5 text-indigo-400" />
            <h3 className="font-semibold text-white">ICF Human Development Graph</h3>
          </div>
          <p className="text-xs text-slate-500 mb-5">
            The Human Development Graph shows the currently assessed relationships between cognitive focus,
            goal alignment and available capacity. Additional ICF domains will expand the model over time.
          </p>
          <HumanDevelopmentGraph mind={scores.focusIndex} goal={scores.goalAlignment} body={scores.capacityIndex} />
        </div>

        {/* 5. Cross-domain insights */}
        <div className="mb-6 rounded-2xl border border-slate-700 bg-slate-800/40 p-6">
          <h3 className="font-semibold text-white mb-4">Cross-Domain Insights</h3>
          <div className="mb-4 rounded-xl border border-indigo-400/20 bg-indigo-500/5 p-4">
            <p className="text-white text-sm font-medium">{insights.narrativeInsight}</p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 text-sm">
            <div className="rounded-lg bg-slate-800/60 p-3">
              <p className="text-xs text-slate-500 uppercase tracking-wide mb-1">Strongest domain</p>
              <p className="font-semibold text-green-300">{insights.strongest}</p>
            </div>
            <div className="rounded-lg bg-slate-800/60 p-3">
              <p className="text-xs text-slate-500 uppercase tracking-wide mb-1">Weakest assessed domain</p>
              <p className="font-semibold text-red-300">{insights.weakest}</p>
            </div>
            <div className="rounded-lg bg-slate-800/60 p-3">
              <p className="text-xs text-slate-500 uppercase tracking-wide mb-1">Largest score gap</p>
              <p className="font-semibold text-amber-300">{insights.gap} points</p>
            </div>
            <div className="rounded-lg bg-slate-800/60 p-3">
              <p className="text-xs text-slate-500 uppercase tracking-wide mb-1">Primary tension</p>
              <p className="text-slate-300">{insights.primaryTension}</p>
            </div>
          </div>
          <div className="mt-3 rounded-lg border border-indigo-400/15 bg-indigo-400/5 p-3">
            <p className="text-xs text-slate-500 uppercase tracking-wide mb-1">Best leverage point</p>
            <p className="text-sm text-slate-300">{insights.leverage}</p>
          </div>
        </div>

        {/* 6. Decision Twin Simulator */}
        <div className="mb-6 rounded-2xl border border-violet-500/30 bg-violet-500/5 p-6">
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-2">
              <Sliders className="h-5 w-5 text-violet-400" />
              <h3 className="font-semibold text-white">Decision Twin Simulator</h3>
            </div>
            <span className="rounded-full border border-amber-400/30 bg-amber-400/10 px-2.5 py-0.5 text-xs text-amber-300">
              Simulation — not a prediction
            </span>
          </div>
          <p className="text-xs text-slate-500 mb-5">
            Adjust the sliders to explore how changes in human signals affect decision readiness.
            Original results are never overwritten.
          </p>

          {/* Sliders */}
          <div className="space-y-5 mb-5">
            {[
              { label: "Focus",          val: simFocus,    set: setSimFocus,    color: "text-blue-400",  accentClass: "accent-blue-500" },
              { label: "Goal Alignment", val: simGoal,     set: setSimGoal,     color: "text-green-400", accentClass: "accent-green-500" },
              { label: "Capacity",       val: simCapacity, set: setSimCapacity, color: "text-amber-400", accentClass: "accent-amber-500" },
            ].map(({ label, val, set, color, accentClass }) => (
              <div key={label}>
                <div className="flex justify-between text-sm mb-1">
                  <span className={cn("font-medium", color)}>{label}</span>
                  <span className={cn("font-bold", scoreColor(val))}>{val}/100</span>
                </div>
                <input type="range" min={0} max={100} value={val}
                  onChange={e => { set(Number(e.target.value)); setLastScenario(null); }}
                  className={cn("w-full h-2 rounded-full appearance-none cursor-pointer bg-slate-700", accentClass)}
                  aria-label={`Simulate ${label}`} />
                <div className="flex justify-between text-xs text-slate-600 mt-0.5">
                  <span>Original: {label === "Focus" ? scores.focusIndex : label === "Goal Alignment" ? scores.goalAlignment : scores.capacityIndex}</span>
                  <span className={val !== (label === "Focus" ? scores.focusIndex : label === "Goal Alignment" ? scores.goalAlignment : scores.capacityIndex) ? "text-violet-400" : "text-slate-600"}>
                    {val !== (label === "Focus" ? scores.focusIndex : label === "Goal Alignment" ? scores.goalAlignment : scores.capacityIndex)
                      ? `${val > (label === "Focus" ? scores.focusIndex : label === "Goal Alignment" ? scores.goalAlignment : scores.capacityIndex) ? "+" : ""}${val - (label === "Focus" ? scores.focusIndex : label === "Goal Alignment" ? scores.goalAlignment : scores.capacityIndex)}`
                      : "—"}
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* Quick scenario buttons */}
          <div className="mb-5">
            <p className="text-xs text-slate-500 uppercase tracking-wide mb-2">Quick scenarios</p>
            <div className="flex flex-wrap gap-2">
              {SCENARIOS.map(s => (
                <button key={s.id} onClick={() => applyScenario(s)}
                  className={cn("rounded-full border px-3 py-1.5 text-xs font-medium transition-all",
                    lastScenario === s.id
                      ? "border-violet-500 bg-violet-600 text-white"
                      : "border-slate-600 text-slate-300 hover:border-violet-500 hover:text-violet-300")}>
                  {s.label}
                </button>
              ))}
            </div>
            {lastScenario && (
              <p className="mt-2 text-xs text-violet-300">
                {SCENARIOS.find(s => s.id === lastScenario)?.description}
              </p>
            )}
          </div>

          {/* Sim results */}
          <div className="rounded-xl border border-slate-700 bg-slate-900/60 p-4 space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-xs uppercase tracking-wide text-slate-500">Simulated Decision Readiness</p>
              <span className={cn("font-bold text-lg", scoreColor(simS.decisionReadiness))}>
                {simS.decisionReadiness}
                {drChanged && (
                  <span className={cn("ml-1.5 text-xs font-semibold",
                    simS.decisionReadiness > scores.decisionReadiness ? "text-green-400" : "text-red-400")}>
                    ({simS.decisionReadiness > scores.decisionReadiness ? "+" : ""}{simS.decisionReadiness - scores.decisionReadiness})
                  </span>
                )}
              </span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-400">Risk Level</span>
              <span className={cn("rounded-full border px-2 py-0.5 text-xs font-semibold", riskColor(simS.riskLevel))}>
                {simS.riskLevel} {riskChanged && <span className="ml-1 opacity-70">(was {scores.riskLevel})</span>}
              </span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-400">Primary constraint</span>
              <span className="text-red-300 font-medium">{simS.primaryConstraint}</span>
            </div>
            <div className="rounded-lg bg-slate-800/60 p-3 text-sm">
              <p className="text-xs text-slate-500 uppercase tracking-wide mb-1">
                Simulated recommendation {recChanged && <span className="text-violet-400">(changed!)</span>}
              </p>
              <p className="font-semibold text-white">{simRec.title}</p>
              <p className="mt-1 text-xs text-slate-400">{simRec.nextAction}</p>
            </div>
            <p className="text-xs text-slate-500 italic">{simInsights.narrativeInsight}</p>
          </div>

          {/* Human Development Graph preview for simulation */}
          {isSimModified && (
            <div className="mt-4">
              <p className="text-xs text-slate-500 uppercase tracking-wide mb-2">Development graph (simulated)</p>
              <HumanDevelopmentGraph mind={simFocus} goal={simGoal} body={simCapacity} />
            </div>
          )}

          <div className="mt-4 flex justify-end">
            <button onClick={resetSimulation}
              className="flex items-center gap-1.5 rounded-full border border-slate-600 px-4 py-2 text-xs text-slate-400 hover:bg-slate-800">
              <RotateCcw className="h-3.5 w-3.5" /> Reset simulation
            </button>
          </div>
        </div>

        {/* 7. Original vs Simulated comparison */}
        {isSimModified && (
          <div className="mb-6 rounded-2xl border border-slate-700 bg-slate-800/40 p-6">
            <h3 className="font-semibold text-white mb-4">Original vs Simulated</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-xs uppercase tracking-wide text-slate-500 border-b border-slate-700">
                    <th className="text-left pb-2 pr-4">Metric</th>
                    <th className="text-right pb-2 pr-4">Original</th>
                    <th className="text-right pb-2">Simulated</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {[
                    { label: "Decision Readiness", orig: scores.decisionReadiness, sim: simS.decisionReadiness },
                    { label: "Focus",              orig: scores.focusIndex,        sim: simFocus },
                    { label: "Goal Alignment",     orig: scores.goalAlignment,     sim: simGoal },
                    { label: "Capacity",           orig: scores.capacityIndex,     sim: simCapacity },
                  ].map(({ label, orig, sim }) => {
                    const changed = orig !== sim;
                    return (
                      <tr key={label}>
                        <td className="py-2 pr-4 text-slate-400">{label}</td>
                        <td className={cn("py-2 pr-4 text-right font-mono", scoreColor(orig))}>{orig}</td>
                        <td className={cn("py-2 text-right font-mono font-bold", changed ? (sim > orig ? "text-green-400" : "text-red-400") : "text-slate-500")}>
                          {sim}{changed && <span className="ml-1 text-xs">({sim > orig ? "+" : ""}{sim - orig})</span>}
                        </td>
                      </tr>
                    );
                  })}
                  <tr>
                    <td className="py-2 pr-4 text-slate-400">Risk Level</td>
                    <td className="py-2 pr-4 text-right">
                      <span className={cn("text-xs font-semibold", riskColor(scores.riskLevel).split(" ")[0])}>{scores.riskLevel}</span>
                    </td>
                    <td className="py-2 text-right">
                      <span className={cn("text-xs font-semibold", riskColor(simS.riskLevel).split(" ")[0])}>{simS.riskLevel}</span>
                    </td>
                  </tr>
                  <tr>
                    <td className="py-2 pr-4 text-slate-400">Recommended priority</td>
                    <td className="py-2 pr-4 text-right text-xs text-slate-400">Pattern {rec.pattern}</td>
                    <td className={cn("py-2 text-right text-xs", recChanged ? "text-violet-400 font-semibold" : "text-slate-400")}>
                      Pattern {simRec.pattern}{recChanged && " ✦"}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
            <p className="mt-4 text-xs text-slate-600 italic">
              This simulation explores possible decision conditions. It does not predict behaviour or outcomes.
            </p>
          </div>
        )}

        {/* 8. ICF Profile Code */}
        <div className="mb-6 rounded-2xl border border-slate-700 bg-slate-800/40 p-6">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-semibold text-white">ICF Profile Code</h3>
            <span className="rounded-full border border-slate-600 px-2 py-0.5 text-xs text-slate-500">MVP profile code</span>
          </div>
          <p className="text-xs text-slate-500 mb-4">
            The ICF Profile Code is a compact representation of the currently assessed domains.
            It is not a diagnosis or permanent identity. It is based on original results only and does not change during simulation.
          </p>
          <div className="flex items-center gap-3 rounded-xl bg-slate-900/80 border border-slate-700 px-5 py-4">
            <code className="flex-1 text-lg font-mono font-bold tracking-widest text-indigo-300 select-all">
              {profileCode}
            </code>
            <button onClick={() => copyCode(profileCode)}
              className="flex items-center gap-1.5 rounded-lg border border-slate-600 px-3 py-1.5 text-xs text-slate-400 hover:bg-slate-700 transition-colors">
              {copied ? <Check className="h-3.5 w-3.5 text-green-400" /> : <Copy className="h-3.5 w-3.5" />}
              {copied ? "Copied" : "Copy"}
            </button>
          </div>
          <p className="mt-2 text-xs text-slate-600">
            M = Mind/Focus · G = Goal Alignment · B = Body/Capacity · RL = Low risk · RM = Moderate · RH = High
          </p>
        </div>

        {/* Footer CTA */}
        <div className="flex flex-col gap-3 sm:flex-row sm:justify-between">
          <button onClick={handleRestart} className="flex items-center justify-center gap-2 rounded-full border border-slate-700 px-6 py-2.5 text-sm text-slate-400 hover:bg-slate-800">
            <RotateCcw className="h-4 w-4" /> Take assessment again
          </button>
          <button onClick={() => setPhase("report")} className="flex items-center justify-center gap-2 rounded-full bg-indigo-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-indigo-500">
            Generate ICF Demo Report →
          </button>
        </div>
      </div>
    );
  }

  // ── REPORT (unchanged) ──────────────────────────────────────────────────────
  if (phase === "report" && scores && rec) {
    const today = new Date().toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });
    const profileCode = buildProfileCode(scores);
    return (
      <div className="mx-auto max-w-3xl px-4 py-8">
        <div className="mb-6 flex items-center justify-between print:hidden">
          <button onClick={() => setPhase("dashboard")} className="flex items-center gap-2 text-sm text-slate-400 hover:text-white">
            <ArrowLeft className="h-4 w-4" /> Back to dashboard
          </button>
          <button onClick={() => window.print()}
            className="flex items-center gap-2 rounded-full bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-indigo-500">
            <Printer className="h-4 w-4" /> Print / Save as PDF
          </button>
        </div>

        <div id="icf-report" className="rounded-2xl border border-slate-700 bg-slate-900 p-8 text-slate-200 print:border-0 print:bg-white print:text-black">
          <div className="border-b border-slate-700 pb-6 mb-6 print:border-slate-300">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs uppercase tracking-widest text-indigo-400 print:text-indigo-600 mb-1">ICF AI Copilot</p>
                <h1 className="text-2xl font-bold text-white print:text-black">Decision Intelligence Report</h1>
              </div>
              {isSample && (
                <span className="rounded-full border border-amber-400/30 bg-amber-400/10 px-3 py-1 text-xs text-amber-300 print:text-amber-700">Sample data</span>
              )}
            </div>
            <div className="mt-3 flex flex-wrap gap-4 text-sm text-slate-400 print:text-slate-600">
              <span>Date: {today}</span>
              <span>Scope: Mind · Goal · Body/Capacity</span>
              <span>Pattern: {rec.pattern}</span>
              <span className="font-mono text-indigo-400 print:text-indigo-600">{profileCode}</span>
            </div>
          </div>

          <section className="mb-8">
            <h2 className="text-lg font-bold text-white print:text-black mb-4">Score Summary</h2>
            <div className="grid gap-3 sm:grid-cols-2">
              {[
                ["Decision Readiness", scores.decisionReadiness],
                ["Focus Index",        scores.focusIndex],
                ["Goal Alignment",     scores.goalAlignment],
                ["Capacity Index",     scores.capacityIndex],
                ["Mind Domain",        scores.mindScore],
                ["Goal Domain",        scores.goalScore],
                ["Capacity Domain",    scores.capacityScore],
              ].map(([label, value]) => (
                <div key={String(label)} className="flex items-center justify-between rounded-lg border border-slate-700 bg-slate-800/40 px-4 py-3 print:border-slate-300 print:bg-slate-50">
                  <span className="text-sm text-slate-300 print:text-slate-700">{label}</span>
                  <span className={cn("font-bold", scoreColor(Number(value)))}>{value}/100</span>
                </div>
              ))}
              <div className="flex items-center justify-between rounded-lg border border-slate-700 bg-slate-800/40 px-4 py-3 print:border-slate-300 print:bg-slate-50">
                <span className="text-sm text-slate-300 print:text-slate-700">Risk Level</span>
                <span className={cn("font-bold", riskColor(scores.riskLevel).split(" ")[0])}>{scores.riskLevel}</span>
              </div>
            </div>
          </section>

          <section className="mb-8">
            <h2 className="text-lg font-bold text-white print:text-black mb-3">Signal Interpretation</h2>
            <div className="space-y-3 text-sm leading-relaxed text-slate-300 print:text-slate-700">
              <p><strong className="text-white print:text-black">Strongest signal:</strong> {scores.strongestSignal}</p>
              <p><strong className="text-white print:text-black">Primary constraint:</strong> {scores.primaryConstraint}</p>
              <p><strong className="text-white print:text-black">Confidence:</strong> {scores.confidenceLevel} — {
                scores.confidenceLevel === "High"     ? "domain scores are consistent." :
                scores.confidenceLevel === "Moderate" ? "some variation; apply your own judgement." :
                "significant spread; interpret cautiously."
              }</p>
            </div>
          </section>

          <section className="mb-8">
            <h2 className="text-lg font-bold text-white print:text-black mb-3">Decision Priority</h2>
            <div className="rounded-xl border border-indigo-400/30 bg-indigo-500/10 p-5 print:border-indigo-300 print:bg-indigo-50">
              <p className="font-semibold text-white print:text-black mb-2">{rec.title}</p>
              <p className="text-sm text-slate-300 print:text-slate-700 leading-relaxed">{rec.rationale}</p>
            </div>
          </section>

          <section className="mb-8">
            <h2 className="text-lg font-bold text-white print:text-black mb-3">Recommended Next Action</h2>
            <div className="rounded-xl border border-green-400/20 bg-green-400/5 p-5 print:border-green-300 print:bg-green-50">
              <p className="text-white print:text-black">{rec.nextAction}</p>
            </div>
          </section>

          <section className="mb-8">
            <h2 className="text-lg font-bold text-white print:text-black mb-3">7-Day Action Plan</h2>
            <ol className="space-y-2">
              {rec.sevenDayPlan.map((step, i) => (
                <li key={i} className="flex gap-3 text-sm">
                  <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-indigo-600 text-xs font-bold text-white print:bg-indigo-100 print:text-indigo-700">{i + 1}</span>
                  <span className="text-slate-300 print:text-slate-700 leading-relaxed pt-0.5">{step}</span>
                </li>
              ))}
            </ol>
          </section>

          <section className="mb-8">
            <h2 className="text-lg font-bold text-white print:text-black mb-3">Why this recommendation?</h2>
            <p className="text-sm italic text-slate-300 print:text-slate-600 leading-relaxed border-l-2 border-indigo-500 pl-4 mb-4">{rec.whyText}</p>
            <p className="text-xs text-slate-500 print:text-slate-500">
              <strong>Scoring method:</strong> Mind = avg(clarity, concentration, ¬overload, ¬pressure).
              Goal = avg(clarity, importance, confidence, next-step). Capacity = avg(energy, recovery, ¬workload, focus).
              All 0–100. Decision Readiness = Goal×40% + Mind×35% + Capacity×25%.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-lg font-bold text-white print:text-black mb-3">Limitations</h2>
            <ul className="space-y-2 text-sm text-slate-400 print:text-slate-600">
              <li className="flex gap-2"><span>•</span> Covers Mind, Goal and Body/Capacity only. Language, Scenario and Global are roadmap.</li>
              <li className="flex gap-2"><span>•</span> Self-reported answers at one point in time — may not reflect sustained patterns.</li>
              <li className="flex gap-2"><span>•</span> Deterministic rules, not machine learning. IBM Granite would enrich outputs in production.</li>
              <li className="flex gap-2"><span>•</span> No data stored, no authentication, no external services.</li>
            </ul>
          </section>

          <div className="rounded-xl border border-amber-400/20 bg-amber-400/5 p-4 print:border-amber-300 print:bg-amber-50">
            <p className="text-xs text-amber-300 print:text-amber-700 leading-relaxed">
              <strong>Safety disclaimer:</strong> ICF AI Copilot is a decision-support and human-development tool.
              It does not provide medical diagnosis, treatment or emergency mental-health services.
              If you are in distress, please contact a qualified professional.
            </p>
          </div>

          <div className="mt-8 border-t border-slate-700 pt-4 print:border-slate-300 text-xs text-slate-600">
            <p>ICF AI Copilot — Demo Prototype · {profileCode} · Generated {today}</p>
            <p>Designed for integration with IBM watsonx.ai, Granite and enterprise AI governance.</p>
          </div>
        </div>
      </div>
    );
  }

  return null;
}
