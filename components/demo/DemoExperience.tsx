"use client";

import { useState, useEffect } from "react";
import { type Answers, scoreAnswers, SAMPLE_ANSWERS } from "@/lib/demo/scoring";
import { selectRecommendation } from "@/lib/demo/recommendations";
import type { ScoreResult } from "@/lib/demo/scoring";
import type { Recommendation } from "@/lib/demo/recommendations";
import {
  buildSignalImportance,
  buildDecisionFactors,
  buildDecisionTree,
  computeExplainabilityScore,
  analyseConsistency,
  buildExecutiveSummary,
  buildReasoningSteps,
  type TreeNode,
} from "@/lib/demo/explainability";
import { cn } from "@/lib/utils";
import {
  ArrowLeft, ArrowRight, RotateCcw, Brain, Target, Zap,
  CheckCircle2, AlertTriangle, Info, Printer, ChevronDown, ChevronUp,
  FlaskConical, Copy, Check, GitBranch, Sliders, Lock,
  Activity, BookOpen, TrendingUp, ListTree, ShieldCheck,
  FileText, BarChart3, Layers, PlayCircle,
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
  {
    id: "mind",     label: "Mind",            icon: Brain,  color: "text-blue-400",  bg: "bg-blue-400/10",  border: "border-blue-400/30",  questions: ["m1","m2","m3","m4"],
    description: "Assesses your current cognitive state — attention clarity, concentration quality, mental overload and emotional pressure.",
    signals: ["Attention clarity", "Concentration", "Cognitive overload", "Emotional stability"],
  },
  {
    id: "goal",     label: "Goal",            icon: Target, color: "text-green-400", bg: "bg-green-400/10", border: "border-green-400/30", questions: ["g1","g2","g3","g4"],
    description: "Evaluates how clearly defined your primary goal is, how much it matters to you, and how confident you are in making progress.",
    signals: ["Goal clarity", "Personal importance", "Confidence level", "Next-step visibility"],
  },
  {
    id: "capacity", label: "Body / Capacity", icon: Zap,    color: "text-amber-400", bg: "bg-amber-400/10", border: "border-amber-400/30", questions: ["c1","c2","c3","c4"],
    description: "Measures the physical and mental resources available for focused action — energy, recovery, workload and sustained attention.",
    signals: ["Energy level", "Sleep & recovery", "Workload pressure", "Sustained focus"],
  },
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

// ── Shared score-bar sub-component ──────────────────────────────────────────────

function ScoreBar({ label, value, icon: Icon, iconColor }: { label: string; value: number; icon: React.ElementType; iconColor: string }) {
  return (
    <div>
      <div className="flex items-center justify-between text-sm mb-2">
        <span className="flex items-center gap-2 font-medium text-slate-300">
          <span className={cn("flex h-6 w-6 items-center justify-center rounded-md", iconColor.replace("text-", "bg-").replace("400", "400/12"))}>
            <Icon className={cn("h-3.5 w-3.5", iconColor)} aria-hidden="true" />
          </span>
          {label}
        </span>
        <span className={cn("text-base font-bold tracking-tight", scoreColor(value))}>
          {value}<span className="text-slate-600 text-xs font-normal ml-0.5">/100</span>
        </span>
      </div>
      <div className="h-1.5 w-full rounded-full" style={{ background: "rgba(30,41,59,0.9)" }}>
        <div
          className={cn("h-1.5 rounded-full transition-all duration-700", scoreBarColor(value))}
          style={{ width: `${value}%`, boxShadow: value >= 65 ? "0 0 6px rgba(34,197,94,0.4)" : value >= 40 ? "0 0 6px rgba(245,158,11,0.3)" : "none" }}
        />
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
  const avgScore = (s.focus + s.goal + s.capacity) / 3;
  const spreadPenalty = Math.round((spread / 100) * 35);
  const lowScorePenalty = avgScore < 40 ? 25 : avgScore < 55 ? 15 : avgScore < 70 ? 5 : 0;
  return {
    mindScore: s.focus, goalScore: s.goal, capacityScore: s.capacity,
    focusIndex: s.focus, goalAlignment: s.goal, capacityIndex: s.capacity,
    decisionReadiness: s.decisionReadiness,
    decisionConfidence: Math.max(0, Math.min(100, 100 - spreadPenalty - lowScorePenalty)),
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

// ── Human Development Graph (premium SVG) ─────────────────────────────────────
const GRAPH_NODES = [
  { id: "mind",     label: "Mind",     angle: -90  },
  { id: "language", label: "Language", angle: -30  },
  { id: "global",   label: "Global",   angle:  30  },
  { id: "body",     label: "Body",     angle:  90  },
  { id: "scenario", label: "Scenario", angle: 150  },
  { id: "goal",     label: "Goal",     angle: 210  },
] as const;

function HumanDevelopmentGraph({ mind, goal, body }: { mind: number; goal: number; body: number }) {
  const R = 104;
  const cx = 165; const cy = 165;

  const scores: Record<string, number | null> = {
    mind, goal, body, language: null, scenario: null, global: null,
  };

  const pos = GRAPH_NODES.map(n => {
    const rad = (n.angle * Math.PI) / 180;
    return { ...n, x: cx + R * Math.cos(rad), y: cy + R * Math.sin(rad) };
  });

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
        viewBox="0 0 330 330"
        className="w-full max-w-[290px] sm:max-w-[330px]"
        role="img"
        aria-label="ICF Human Development Graph showing assessed domain scores"
      >
        <defs>
          {/* Reduced glow filters */}
          <filter id="glow-green" x="-40%" y="-40%" width="180%" height="180%">
            <feGaussianBlur stdDeviation="1.5" result="blur" />
            <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
          </filter>
          <filter id="glow-amber" x="-40%" y="-40%" width="180%" height="180%">
            <feGaussianBlur stdDeviation="1.5" result="blur" />
            <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
          </filter>
          <filter id="glow-red" x="-40%" y="-40%" width="180%" height="180%">
            <feGaussianBlur stdDeviation="1.5" result="blur" />
            <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
          </filter>
          {/* Polygon fill gradient — lighter */}
          <radialGradient id="poly-fill" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="rgba(99,102,241,0.2)" />
            <stop offset="100%" stopColor="rgba(99,102,241,0.03)" />
          </radialGradient>
        </defs>

        {/* Concentric guide rings */}
        {[0.25, 0.5, 0.75, 1].map((r, i) => (
          <circle
            key={r}
            cx={cx} cy={cy} r={R * r}
            fill="none"
            stroke={i === 3 ? "rgba(148,163,184,0.18)" : "rgba(148,163,184,0.07)"}
            strokeWidth={i === 3 ? "1" : "0.75"}
            strokeDasharray={i < 3 ? "2 4" : undefined}
          />
        ))}

        {/* Spoke lines */}
        {pos.map(p => (
          <line
            key={p.id}
            x1={cx} y1={cy} x2={p.x} y2={p.y}
            stroke="rgba(148,163,184,0.1)"
            strokeWidth="0.75"
          />
        ))}

        {/* Assessed-domain fill polygon */}
        <polygon
          points={polyPoints}
          fill="url(#poly-fill)"
          stroke="rgba(99,102,241,0.5)"
          strokeWidth="1.5"
          strokeLinejoin="round"
        />

        {/* Node circles + labels */}
        {pos.map(p => {
          const val = scores[p.id];
          const isAssessed = val !== null;
          const norm = isAssessed ? (val! / 100) : 0.15;
          const rad = (GRAPH_NODES.find(n => n.id === p.id)!.angle * Math.PI) / 180;
          const nx = cx + norm * R * Math.cos(rad);
          const ny = cy + norm * R * Math.sin(rad);

          const dotColor = isAssessed
            ? (val! >= 65 ? "#22c55e" : val! >= 40 ? "#f59e0b" : "#ef4444")
            : "#1e293b";
          const dotGlow = isAssessed
            ? (val! >= 65 ? "url(#glow-green)" : val! >= 40 ? "url(#glow-amber)" : "url(#glow-red)")
            : undefined;
          const strokeColor = isAssessed
            ? (val! >= 65 ? "#22c55e" : val! >= 40 ? "#f59e0b" : "#ef4444")
            : "#334155";

          const lx = p.x + (p.x < cx - 5 ? -13 : p.x > cx + 5 ? 13 : 0);
          const ly = p.y + (p.y < cy - 5 ? -13 : p.y > cy + 5 ? 17 : 0);
          const anchor = p.x < cx - 5 ? "end" : p.x > cx + 5 ? "start" : "middle";

          return (
            <g key={p.id}>
              {/* Outer halo on assessed nodes */}
              {isAssessed && (
                <circle
                  cx={p.x} cy={p.y} r={10}
                  fill={dotColor}
                  opacity="0.08"
                />
              )}
              {/* Anchor node */}
              <circle
                cx={p.x} cy={p.y} r={isAssessed ? 5.5 : 3.5}
                fill={dotColor}
                stroke={strokeColor}
                strokeWidth="1.5"
                filter={isAssessed ? dotGlow : undefined}
              />
              {/* Score position dot (inner) */}
              {isAssessed && (
                <circle
                  cx={nx} cy={ny} r={4}
                  fill={dotColor}
                  opacity="0.85"
                  filter={dotGlow}
                />
              )}
              {/* Domain label */}
              <text
                x={lx} y={ly}
                textAnchor={anchor}
                fontSize="11"
                fontWeight={isAssessed ? "600" : "400"}
                fill={isAssessed ? "#f1f5f9" : "#64748b"}
                style={{ fontFamily: "system-ui, sans-serif" }}
              >
                {p.label}
              </text>
              {/* Score value label */}
              {isAssessed && (
                <text
                  x={lx}
                  y={p.y + (p.y < cy - 5 ? -25 : p.y > cy + 5 ? 30 : ly - p.y + 15)}
                  textAnchor={anchor}
                  fontSize="9.5"
                  fontWeight="700"
                  fill={dotColor}
                  opacity="0.9"
                >
                  {val}
                </text>
              )}
            </g>
          );
        })}

        {/* Centre — ICF brand mark */}
        <circle cx={cx} cy={cy} r={18} fill="rgba(99,102,241,0.08)" stroke="rgba(148,163,184,0.2)" strokeWidth="1" />
        <text x={cx} y={cy - 4} textAnchor="middle" fontSize="8.5" fill="#a5b4fc" fontWeight="700" style={{ letterSpacing: "0.08em" }}>ICF</text>
        <text x={cx} y={cy + 7} textAnchor="middle" fontSize="7.5" fill="rgba(148,163,184,0.5)" style={{ letterSpacing: "0.06em" }}>ENGINE</text>
      </svg>

      {/* Accessible text summary */}
      <p className="mt-3 text-center text-xs text-slate-400 max-w-xs leading-relaxed" aria-live="polite">
        Mind <span className="text-blue-400 font-semibold">{mind}</span> ·
        Goal <span className="text-green-400 font-semibold">{goal}</span> ·
        Body <span className="text-amber-400 font-semibold">{body}</span>
        <span className="text-slate-600"> · Language, Scenario, Global: future modules</span>
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

// ── Decision Tree View (CSS-only, no library) ──────────────────────────────────
function DecisionTreeView({ node, depth = 0 }: { node: TreeNode; depth?: number }) {
  const statusColor = (s?: string) => {
    if (s === "good")   return "text-green-400 border-green-500/40 bg-green-500/10";
    if (s === "moderate") return "text-amber-400 border-amber-500/40 bg-amber-500/10";
    if (s === "low")    return "text-red-400 border-red-500/40 bg-red-500/10";
    if (s === "result") return "text-indigo-300 border-indigo-500/40 bg-indigo-500/10";
    return "text-slate-300 border-slate-600 bg-slate-800/40";
  };
  const isRoot = depth === 0;
  return (
    <div className={cn("relative", depth > 0 && "pl-4 sm:pl-6")}>
      {depth > 0 && (
        <div className="absolute left-0 top-0 h-full w-px bg-slate-700" />
      )}
      <div className={cn(
        "relative flex items-center gap-2 mb-2",
        depth > 0 && "before:absolute before:left-0 before:top-1/2 before:-translate-y-1/2 before:w-3 before:h-px before:bg-slate-700"
      )}>
        <span className={cn(
          "inline-flex items-center gap-1 rounded-lg border px-2.5 py-1 text-xs font-medium",
          isRoot ? "border-indigo-500/40 bg-indigo-500/15 text-indigo-300 font-bold text-sm" : statusColor(node.status)
        )}>
          {node.label}
          {node.value && <span className="ml-1 font-mono opacity-80">{node.value}</span>}
        </span>
      </div>
      {node.children && node.children.length > 0 && (
        <div className="ml-2 space-y-1">
          {node.children.map((child, i) => (
            <DecisionTreeView key={i} node={child} depth={depth + 1} />
          ))}
        </div>
      )}
    </div>
  );
}

// ── Main component ──────────────────────────────────────────────────────────────

export function DemoExperience({ autoDemo = false }: { autoDemo?: boolean }) {
  // ── State ───────────────────────────────────────────────────────────────────
  const [phase, setPhase]           = useState<Phase>("intro");
  const [answers, setAnswers]       = useState<Answers>(EMPTY_ANSWERS);
  const [currentSection, setCurrentSection] = useState(0);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [scores, setScores]         = useState<ScoreResult | null>(null);
  const [rec, setRec]               = useState<Recommendation | null>(null);
  const [whyOpen, setWhyOpen]       = useState(true);
  const [isSample, setIsSample]     = useState(false);
  const [simFocus,    setSimFocus]    = useState(0);
  const [simGoal,     setSimGoal]     = useState(0);
  const [simCapacity, setSimCapacity] = useState(0);
  const [lastScenario, setLastScenario] = useState<string | null>(null);
  const [copied, setCopied]           = useState(false);
  const [sigExpanded, setSigExpanded] = useState<string | null>(null);

  // ── Demo Mode: auto-load sample on mount when ?mode=demo ───────────────────
  useEffect(() => {
    if (autoDemo) {
      const s = scoreAnswers(SAMPLE_ANSWERS);
      const r = selectRecommendation(s);
      setAnswers(SAMPLE_ANSWERS);
      setScores(s);
      setRec(r);
      setSimFocus(s.focusIndex);
      setSimGoal(s.goalAlignment);
      setSimCapacity(s.capacityIndex);
      setIsSample(true);
      setPhase("dashboard");
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoDemo]);

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
    setSigExpanded(null);
    setWhyOpen(true);
    setSimFocus(0);
    setSimGoal(0);
    setSimCapacity(0);
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

  // ── INTRO ───────────────────────────────────────────────────────────────────
  if (phase === "intro") {
    return (
      <div className="mx-auto max-w-2xl px-4 py-12">
        {/* Badge */}
        <div className="flex justify-center mb-6">
          <div className="inline-flex items-center gap-2 rounded-full border border-indigo-400/30 bg-indigo-400/8 px-4 py-1.5 text-sm text-indigo-300"
            style={{ background: "rgba(99,102,241,0.08)" }}>
            <FlaskConical className="h-3.5 w-3.5" aria-hidden="true" />
            Decision Intelligence Assessment
          </div>
        </div>

        {/* Headline */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white sm:text-4xl leading-tight">
            ICF Decision Intelligence
            <span className="block mt-1"
              style={{ background: "linear-gradient(90deg,#818cf8,#6366f1)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
              Assessment
            </span>
          </h1>
          <p className="mt-4 text-slate-400 leading-relaxed max-w-lg mx-auto">
            12 questions across three domains — Mind, Goal and Body / Capacity.
            Takes approximately 3 minutes. No data is sent anywhere.
          </p>
          {/* Micro stats */}
          <div className="mt-5 flex items-center justify-center gap-6 text-xs text-slate-500">
            {[["3", "Domains"], ["12", "Questions"], ["~3 min", "Duration"]].map(([val, lbl]) => (
              <div key={lbl} className="flex flex-col items-center gap-0.5">
                <span className="text-base font-bold text-indigo-400">{val}</span>
                <span>{lbl}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Domain cards */}
        <div
          className="grid gap-3 text-left sm:grid-cols-3 mb-8"
          role="list"
          aria-label="Assessment domains"
        >
          {SECTIONS.map(s => {
            const Icon = s.icon;
            return (
              <div
                key={s.id}
                role="listitem"
                className={cn("rounded-2xl border p-5 transition-colors", s.bg, s.border)}
                style={{ boxShadow: "0 2px 12px rgba(0,0,0,0.18)" }}
              >
                <div className={cn("flex h-9 w-9 items-center justify-center rounded-xl mb-3",
                  s.id === "mind"     ? "bg-blue-400/12"  :
                  s.id === "goal"     ? "bg-green-400/12" : "bg-amber-400/12")}
                  style={{ background: s.id === "mind" ? "rgba(96,165,250,0.1)" : s.id === "goal" ? "rgba(74,222,128,0.1)" : "rgba(251,191,36,0.1)" }}>
                  <Icon className={cn("h-5 w-5", s.color)} aria-hidden="true" />
                </div>
                <p className={cn("font-semibold text-sm mb-1", s.color)}>{s.label}</p>
                <p className="text-xs text-slate-500 leading-relaxed">{s.description}</p>
                <p className="mt-2 text-xs text-slate-600">4 questions</p>
              </div>
            );
          })}
        </div>

        {/* Trust & Safety notice */}
        <div
          role="note"
          className="mb-8 rounded-xl border border-amber-400/20 p-4 text-left text-sm text-amber-200 leading-relaxed"
          style={{ background: "rgba(245,158,11,0.05)" }}
        >
          <div className="flex items-start gap-2.5">
            <AlertTriangle className="mt-0.5 h-4 w-4 flex-shrink-0 text-amber-400" aria-hidden="true" />
            <p>
              <strong className="font-semibold">Decision support — not a diagnosis.</strong>{" "}
              This assessment supports human decision-making and should not be interpreted
              as a medical or psychological diagnosis. It does not provide treatment,
              therapy or emergency mental-health services.
            </p>
          </div>
        </div>

        {/* CTAs */}
        <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
          <button
            onClick={() => setPhase("assessment")}
            className="inline-flex items-center justify-center gap-2 rounded-full bg-white px-8 py-3 font-semibold text-slate-950 hover:bg-slate-100 focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950"
            aria-label="Begin the 12-question assessment"
          >
            Start assessment <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </button>
          <button
            onClick={loadSample}
            className="inline-flex items-center justify-center gap-2 rounded-full border border-indigo-500/50 px-8 py-3 text-sm font-semibold text-white hover:border-indigo-400 hover:bg-indigo-600/20"
            style={{ background: "linear-gradient(135deg,rgba(99,102,241,0.18),rgba(99,102,241,0.08))", boxShadow: "0 0 0 1px rgba(99,102,241,0.2) inset" }}
            aria-label="Load a pre-filled sample profile and skip directly to the dashboard"
          >
            <PlayCircle className="h-4 w-4" aria-hidden="true" />
            Demo Mode — Sample Profile
          </button>
        </div>
        <p className="mt-4 text-center text-xs text-slate-600">
          Demo Mode loads a representative sample profile — clearly labelled throughout.
        </p>
      </div>
    );
  }

  // ── ASSESSMENT (M3: diagnostic header + live signal panel) ─────────────────
  if (phase === "assessment") {
    const Icon = section.icon;
    // Live partial scores for the live signal panel
    const liveMinds    = QUESTIONS.filter(q => q.section === "mind").map(q => answers[q.id as QuestionId] ?? 0);
    const liveGoals    = QUESTIONS.filter(q => q.section === "goal").map(q => answers[q.id as QuestionId] ?? 0);
    const liveCaps     = QUESTIONS.filter(q => q.section === "capacity").map(q => answers[q.id as QuestionId] ?? 0);
    const liveScore = (vals: number[]) => {
      const answered = vals.filter(v => v > 0);
      if (answered.length === 0) return null;
      return Math.round(answered.reduce((a, b) => a + b, 0) / answered.length / 4 * 100);
    };
    const liveMindScore = liveScore(liveMinds);
    const liveGoalScore = liveScore(liveGoals);
    const liveCapScore  = liveScore(liveCaps);

    return (
      <div className="mx-auto max-w-2xl px-6 py-10 lg:px-8">
        {/* Progress header */}
        <div className="mb-3 flex items-center justify-between text-xs">
          <span className="text-slate-400 font-medium">{totalAnswered} <span className="text-slate-600">/ 12 answered</span></span>
          <button onClick={handleRestart} className="flex items-center gap-1.5 text-slate-500 hover:text-slate-300 transition-colors">
            <RotateCcw className="h-3 w-3" /> Restart
          </button>
        </div>
        {/* Premium segmented progress bar */}
        <div className="mb-6 relative h-1.5 w-full overflow-hidden rounded-full" style={{ background: "rgba(30,41,59,0.9)" }}>
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{
              width: `${overallProgress}%`,
              background: "linear-gradient(90deg,#6366f1,#818cf8)",
              boxShadow: "0 0 8px rgba(99,102,241,0.5)",
            }}
          />
          {/* Section tick marks */}
          {[33, 67].map(p => (
            <div key={p} className="absolute top-0 h-full w-px" style={{ left: `${p}%`, background: "rgba(15,23,42,0.8)" }} />
          ))}
        </div>

        {/* Diagnostic section header */}
        <div className={cn("mb-5 rounded-2xl border p-5", section.bg, section.border)}
          style={{ boxShadow: "0 2px 12px rgba(0,0,0,0.15)" }}>
          <div className="flex items-center gap-3 mb-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl flex-shrink-0"
              style={{ background: section.id === "mind" ? "rgba(96,165,250,0.12)" : section.id === "goal" ? "rgba(74,222,128,0.12)" : "rgba(251,191,36,0.12)" }}>
              <Icon className={cn("h-5 w-5", section.color)} aria-hidden="true" />
            </div>
            <div>
              <p className={cn("font-bold text-sm", section.color)}>{section.label} Domain</p>
              <p className="text-xs text-slate-500 mt-0.5">Section {currentSection + 1} of {SECTIONS.length} · 4 questions</p>
            </div>
          </div>
          <p className="text-xs text-slate-400 leading-relaxed mb-3">{section.description}</p>
          <div className="flex flex-wrap gap-1.5">
            {section.signals.map(sig => (
              <span key={sig} className={cn("rounded-full border px-2.5 py-0.5 text-xs", section.border, section.color)}
                style={{ background: "transparent", opacity: 0.8 }}>
                {sig}
              </span>
            ))}
          </div>
        </div>

        {/* Live signal panel */}
        <div className="mb-6 rounded-xl border border-slate-700/70 p-4"
          style={{ background: "rgba(15,23,42,0.6)" }}>
          <p className="text-xs uppercase tracking-widest text-slate-500 mb-3 flex items-center gap-1.5">
            <Activity className="h-3.5 w-3.5 text-indigo-400" /> Live signals
          </p>
          <div className="space-y-2.5">
            {[
              { label: "Mind",     score: liveMindScore, barColor: "#3b82f6", textColor: "text-blue-400"  },
              { label: "Goal",     score: liveGoalScore, barColor: "#22c55e", textColor: "text-green-400" },
              { label: "Body/Cap", score: liveCapScore,  barColor: "#f59e0b", textColor: "text-amber-400" },
            ].map(({ label, score, barColor, textColor }) => (
              <div key={label} className="flex items-center gap-3">
                <span className={cn("text-xs font-semibold w-14 flex-shrink-0", textColor)}>{label}</span>
                <div className="flex-1 h-1 rounded-full overflow-hidden" style={{ background: "rgba(51,65,85,0.7)" }}>
                  <div
                    className="h-1 rounded-full transition-all duration-500"
                    style={{
                      width: score !== null ? `${score}%` : "0%",
                      background: barColor,
                      boxShadow: score !== null && score > 0 ? `0 0 6px ${barColor}60` : "none",
                    }}
                  />
                </div>
                <span className="text-xs text-slate-500 w-12 text-right tabular-nums">
                  {score !== null ? `~${score}` : "—"}
                </span>
              </div>
            ))}
          </div>
          <p className="mt-2.5 text-xs text-slate-600 italic">Partial estimates · finalised after all questions.</p>
        </div>

        {/* Question cards */}
        <div className="space-y-6">
          {sectionQuestions.map((q, qi) => {
            const ans = answers[q.id as QuestionId] ?? 0;
            return (
              <div key={q.id} className="rounded-2xl border border-slate-700/60 p-5"
                style={{ background: "rgba(15,23,42,0.5)" }}>
                <p className="mb-1.5 text-xs text-slate-500 tabular-nums">Question {currentSection * 4 + qi + 1} of 12</p>
                <p className="mb-4 font-medium text-white leading-snug">
                  {q.text}
                  {"reverseNote" in q && <span className="ml-1.5 text-xs text-slate-500">{q.reverseNote}</span>}
                </p>
                <div className="grid grid-cols-5 gap-2">
                  {[1,2,3,4,5].map(v => (
                    <button key={v} onClick={() => setAnswer(q.id as QuestionId, v)}
                      aria-label={`${v} — ${SCALE_LABELS[v-1]}`}
                      className={cn(
                        "flex flex-col items-center gap-1 rounded-xl border py-3 text-xs transition-all",
                        ans === v
                          ? "border-indigo-500 text-white font-semibold"
                          : "border-slate-700/80 text-slate-400 hover:border-slate-500 hover:text-slate-200"
                      )}
                      style={ans === v
                        ? { background: "linear-gradient(135deg,#4f46e5,#6366f1)", boxShadow: "0 0 12px rgba(99,102,241,0.35)" }
                        : { background: "rgba(30,41,59,0.6)" }
                      }>
                      <span className="text-lg font-bold leading-none">{v}</span>
                      <span className="hidden text-center leading-tight sm:block text-xs opacity-80">{SCALE_LABELS[v-1]}</span>
                    </button>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        {validationError && (
          <div className="mt-4 flex items-center gap-2 rounded-xl border border-red-400/30 p-3 text-sm text-red-300"
            style={{ background: "rgba(239,68,68,0.06)" }}>
            <AlertTriangle className="h-4 w-4 flex-shrink-0" /> {validationError}
          </div>
        )}

        <div className="mt-8 flex gap-3">
          <button onClick={handleBack}
            className="flex items-center gap-2 rounded-full border border-slate-700 px-5 py-2.5 text-sm font-medium text-slate-300 hover:bg-slate-800/60 transition-colors">
            <ArrowLeft className="h-4 w-4" /> Back
          </button>
          <button onClick={handleContinue}
            className="ml-auto flex items-center gap-2 rounded-full px-6 py-2.5 text-sm font-semibold text-white transition-all hover:brightness-110"
            style={{ background: "linear-gradient(135deg,#4f46e5,#6366f1)", boxShadow: "0 0 16px rgba(99,102,241,0.3)" }}>
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

    // ── M4 explainability computations ────────────────────────────────────────
    const signals      = buildSignalImportance(scores, answers);
    const factors      = buildDecisionFactors(scores, rec);
    const tree         = buildDecisionTree(scores, rec);
    const explScore    = computeExplainabilityScore(scores, answers);
    const consistency  = analyseConsistency(scores, answers);
    const execSummary  = buildExecutiveSummary(scores, rec);
    const reasoning    = buildReasoningSteps(scores, rec);

    return (
      <div className="mx-auto max-w-7xl px-6 py-10 lg:px-10">

        {/* Demo Mode / Sample data banner */}
        {isSample && (
          <div
            role="status"
            aria-live="polite"
            className="mb-8 flex items-start gap-3 rounded-xl border border-amber-400/30 p-4 text-sm text-amber-200"
            style={{ background: "rgba(245,158,11,0.08)" }}
          >
            <PlayCircle className="h-5 w-5 flex-shrink-0 text-amber-400 mt-0.5" aria-hidden="true" />
            <div>
              <p className="font-semibold text-amber-300">Demo Mode — Sample Data</p>
              <p className="mt-0.5 text-xs text-amber-200/70">
                Pre-loaded representative profile. All scores, reasoning and the report are live — generated from sample answers in real time.
              </p>
            </div>
          </div>
        )}

        {/* ── Dashboard header ─────────────────────────────────────── */}
        <div className="mb-10 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-indigo-400 mb-1">
              ICF Decision Intelligence
            </p>
            <h1 className="text-3xl font-bold text-white sm:text-4xl">
              {isSample ? "Sample Assessment Results" : "Your Assessment Results"}
            </h1>
            <p className="mt-1.5 text-sm text-slate-400">
              Integrative Cognitive Framework · {buildProfileCode(scores)}
            </p>
          </div>
          <div className="flex gap-2 flex-shrink-0">
            <button
              onClick={handleRestart}
              className="flex items-center gap-1.5 rounded-full border border-slate-600 px-4 py-2 text-xs font-medium text-slate-300 hover:bg-slate-700/50 transition-colors"
              aria-label="Restart and take a new assessment"
            >
              <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" /> Restart
            </button>
            <button onClick={() => setPhase("report")}
              className="flex items-center gap-1.5 rounded-full px-5 py-2 text-xs font-semibold text-white transition-all hover:brightness-110"
              style={{ background: "#4f46e5", boxShadow: "0 1px 3px rgba(0,0,0,0.3)" }}>
              Generate Report →
            </button>
          </div>
        </div>

        {/* ── Section 1: Two-column KPI + Graph ───────────────────────── */}
        <div className="mb-10 grid gap-6 lg:grid-cols-[1fr_auto]">

          {/* LEFT — KPI stack */}
          <div className="flex flex-col gap-4">

            {/* Decision Readiness hero */}
            <div className="rounded-2xl border border-indigo-400/20 p-7 text-center relative overflow-hidden"
              style={{ background: "rgba(22,32,58,0.95)" }}>
              <p className="text-xs uppercase tracking-widest text-slate-400 mb-2">Decision Readiness</p>
              <p className={cn("text-7xl font-bold leading-none icf-score-hero", scoreColor(scores.decisionReadiness))}>
                {scores.decisionReadiness}
              </p>
              <p className="text-slate-400 text-sm mt-2 tabular-nums">out of 100</p>
              <div className="mt-4 flex flex-wrap justify-center gap-2">
                <span className={cn("rounded-full border px-3 py-1 text-sm font-semibold", riskColor(scores.riskLevel))}>
                  Risk: {scores.riskLevel}
                </span>
                <span className={cn("rounded-full border px-3 py-1 text-xs font-semibold",
                  scores.confidenceLevel === "High"     ? "border-green-400/30 text-green-300 bg-green-400/10" :
                  scores.confidenceLevel === "Moderate" ? "border-amber-400/30 text-amber-300 bg-amber-400/10" :
                  "border-slate-600 text-slate-400 bg-slate-700/50")}>
                  Confidence: {scores.confidenceLevel}
                </span>
              </div>
            </div>

            {/* Score grid — 3 col */}
            <div className="grid gap-3 sm:grid-cols-3">
              {[
                { label: "Focus Index",    value: scores.focusIndex,    icon: Brain,  color: "text-blue-400",  glow: "rgba(59,130,246,0.06)"  },
                { label: "Goal Alignment", value: scores.goalAlignment, icon: Target, color: "text-green-400", glow: "rgba(34,197,94,0.06)"   },
                { label: "Capacity Index", value: scores.capacityIndex, icon: Zap,    color: "text-amber-400", glow: "rgba(245,158,11,0.06)"  },
              ].map(m => (
                <div key={m.label} className="rounded-2xl border border-slate-700/50 p-5 transition-colors hover:border-slate-600"
                  style={{ background: `rgba(22,32,58,0.95)` }}>
                  <ScoreBar label={m.label} value={m.value} icon={m.icon} iconColor={m.color} />
                </div>
              ))}
            </div>

            {/* Signals */}
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-xl border border-green-400/20 p-4" style={{ background: "rgba(22,32,58,0.95)" }}>
                <p className="text-xs uppercase tracking-widest text-slate-400 mb-1.5">Strongest signal</p>
                <p className="font-semibold text-green-300">{scores.strongestSignal}</p>
              </div>
              <div className="rounded-xl border border-red-400/20 p-4" style={{ background: "rgba(22,32,58,0.95)" }}>
                <p className="text-xs uppercase tracking-widest text-slate-400 mb-1.5">Primary constraint</p>
                <p className="font-semibold text-red-300">{scores.primaryConstraint}</p>
              </div>
            </div>

          </div>

          {/* RIGHT — Human Development Graph (signature feature) */}
          <div className="flex flex-col items-center justify-center rounded-2xl border border-slate-700/50 p-6 lg:w-[360px]"
            style={{ background: "rgba(17,26,48,0.95)" }}>
            <p className="text-xs uppercase tracking-widest text-slate-400 mb-1 flex items-center gap-1.5 self-start">
              <GitBranch className="h-3.5 w-3.5 text-indigo-400" /> Human Development Graph
            </p>
            <p className="text-xs text-slate-400 mb-4 self-start leading-relaxed">
              Three domains assessed · three on roadmap
            </p>
            <HumanDevelopmentGraph mind={scores.focusIndex} goal={scores.goalAlignment} body={scores.capacityIndex} />
          </div>

        </div>

        {/* ── Section 1b: Diagnostic pipeline (compact) ───────────────── */}
        <div className="mb-10 rounded-2xl border border-slate-700/50 px-6 py-4 overflow-hidden"
          style={{ background: "rgba(17,26,48,0.95)" }}>
          <div className="flex items-start gap-0 overflow-x-auto pb-1">
            {[
              { label: "Questions",         sublabel: "12 answered",            icon: BookOpen },
              { label: "Signal Extraction", sublabel: "Mind · Goal · Capacity", icon: Activity },
              { label: "Score Calculation", sublabel: "Deterministic formulas", icon: TrendingUp },
              { label: "Cross-domain",      sublabel: "Tension & leverage",     icon: GitBranch },
              { label: "Decision Logic",    sublabel: "Rule matching",          icon: Brain },
              { label: "Recommendation",    sublabel: `Pattern ${rec.pattern}`, icon: CheckCircle2 },
            ].map((step, i, arr) => {
              const StepIcon = step.icon;
              return (
                <div key={step.label} className="flex items-center flex-shrink-0">
                  <div className="flex flex-col items-center text-center w-20 sm:w-24">
                    <div className="h-7 w-7 rounded-full border-2 border-indigo-400/60 bg-indigo-500/20 flex items-center justify-center mb-1">
                      <StepIcon className="h-3 w-3 text-indigo-300" />
                    </div>
                    <p className="text-xs font-medium leading-tight text-slate-200">{step.label}</p>
                    <p className="text-xs text-slate-400 leading-tight mt-0.5 hidden sm:block">{step.sublabel}</p>
                  </div>
                  {i < arr.length - 1 && (
                    <div className="h-px w-4 sm:w-6 bg-indigo-500/30 flex-shrink-0 mx-0.5 mt-[-16px]" />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* 2. Main recommendation */}
        <div className="mb-6 rounded-2xl border border-indigo-400/20 p-6"
          style={{ background: "rgba(22,32,58,0.95)" }}>
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs uppercase tracking-wide text-slate-400">Recommendation · Pattern {rec.pattern}</p>
            <span className={cn("rounded-full border px-2.5 py-0.5 text-xs font-semibold",
              scores.confidenceLevel === "High"     ? "border-green-400/30 text-green-300 bg-green-400/10" :
              scores.confidenceLevel === "Moderate" ? "border-amber-400/30 text-amber-300 bg-amber-400/10" :
              "border-slate-600 text-slate-400 bg-slate-700/50")}>
              Confidence: {scores.confidenceLevel}
            </span>
          </div>
          <h2 className="text-xl font-bold text-white mb-2">{rec.title}</h2>
          <p className="text-slate-200 text-sm leading-relaxed mb-3">{rec.rationale}</p>
          {/* M3: Recommendation quality fields */}
          <div className="mb-4 grid gap-2 sm:grid-cols-2 text-xs">
            <div className="rounded-lg bg-slate-700/50 p-2.5">
              <p className="text-slate-400 uppercase tracking-wide mb-0.5">Primary driver</p>
              <p className="text-slate-200">{rec.reason}</p>
            </div>
            <div className="rounded-lg bg-slate-700/50 p-2.5">
              <p className="text-slate-400 uppercase tracking-wide mb-0.5">Expected benefit</p>
              <p className="text-slate-200">{rec.expectedBenefit}</p>
            </div>
            <div className="rounded-lg bg-slate-700/50 p-2.5">
              <p className="text-slate-400 uppercase tracking-wide mb-0.5">Possible limitation</p>
              <p className="text-slate-200">{rec.possibleLimitation}</p>
            </div>
            <div className="rounded-lg bg-slate-700/50 p-2.5">
              <p className="text-slate-400 uppercase tracking-wide mb-0.5">Next review point</p>
              <p className="text-slate-200">{rec.nextReviewPoint}</p>
            </div>
          </div>
          <div className="rounded-xl bg-slate-700/60 p-4">
            <p className="text-xs uppercase tracking-wide text-slate-400 mb-1">Recommended next action</p>
            <p className="text-white font-medium">{rec.nextAction}</p>
          </div>
          {/* Trust disclaimer — inline on recommendation */}
          <p className="mt-3 text-xs text-slate-500 leading-relaxed">
            This recommendation is intended to support human decision-making and should not be interpreted as a medical or psychological diagnosis. Always apply professional judgement.
          </p>
        </div>

        {/* 3. Why this recommendation? */}
        <div className="mb-6 rounded-2xl border border-slate-700/50 p-6" style={{ background: "rgba(17,26,48,0.95)" }}>
          <button onClick={() => setWhyOpen(o => !o)} className="flex w-full items-center justify-between text-left">
            <div className="flex items-center gap-2">
              <Info className="h-5 w-5 text-indigo-400" />
              <h3 className="font-semibold text-white">Why this recommendation?</h3>
            </div>
            {whyOpen ? <ChevronUp className="h-4 w-4 text-slate-400" /> : <ChevronDown className="h-4 w-4 text-slate-400" />}
          </button>
          {whyOpen && (
            <div className="mt-5 space-y-5 text-sm">
              <p className="text-slate-200 leading-relaxed italic border-l-2 border-indigo-500 pl-4">{rec.whyText}</p>
              <div>
                <p className="text-xs uppercase tracking-wide text-slate-400 mb-2">Influencing factors</p>
                <ul className="space-y-1.5">
                  {rec.influencingFactors.map((f, i) => (
                    <li key={i} className="flex items-start gap-2 text-slate-200">
                      <CheckCircle2 className="mt-0.5 h-4 w-4 flex-shrink-0 text-indigo-400" />{f}
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <p className="text-xs uppercase tracking-wide text-slate-400 mb-2">Missing information</p>
                <ul className="space-y-1.5">
                  {rec.missingInformation.map((m, i) => (
                    <li key={i} className="flex items-start gap-2 text-slate-300">
                      <span className="mt-1 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-slate-500" />{m}
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

        {/* 3b. M3: Signal explanations — "What influences this score?" */}
        <div className="mb-6 rounded-2xl border border-slate-700/50 p-6" style={{ background: "rgba(17,26,48,0.95)" }}>
          <div className="flex items-center gap-2 mb-4">
            <Info className="h-5 w-5 text-indigo-400" />
            <h3 className="font-semibold text-white">What influences each score?</h3>
          </div>
          <div className="space-y-2">
            {[
              {
                id: "focus",
                label: "Focus Index",
                value: scores.focusIndex,
                icon: Brain,
                color: "text-blue-400",
                formula: "Mind × 60% + Capacity × 40%",
                contributors: [
                  `Q1 — Mental clarity: ${answers.m1}/5`,
                  `Q2 — Concentration: ${answers.m2}/5`,
                  `Q3 — Cognitive overload (reverse): ${answers.m3}/5`,
                  `Q4 — Emotional pressure (reverse): ${answers.m4}/5`,
                  `Q9 — Energy level (capacity component): ${answers.c1}/5`,
                  `Q10 — Sleep & recovery: ${answers.c2}/5`,
                ],
                note: "Overload and pressure are reverse-scored — higher answer = lower score.",
              },
              {
                id: "goal",
                label: "Goal Alignment",
                value: scores.goalAlignment,
                icon: Target,
                color: "text-green-400",
                formula: "Average of 4 goal questions",
                contributors: [
                  `Q5 — Goal clarity: ${answers.g1}/5`,
                  `Q6 — Personal importance: ${answers.g2}/5`,
                  `Q7 — Confidence: ${answers.g3}/5`,
                  `Q8 — Next-step clarity: ${answers.g4}/5`,
                ],
                note: "All goal questions are direct-scored — higher answer = higher score.",
              },
              {
                id: "capacity",
                label: "Capacity Index",
                value: scores.capacityIndex,
                icon: Zap,
                color: "text-amber-400",
                formula: "Average of 4 capacity questions",
                contributors: [
                  `Q9 — Energy level: ${answers.c1}/5`,
                  `Q10 — Sleep & recovery: ${answers.c2}/5`,
                  `Q11 — Workload (reverse): ${answers.c3}/5`,
                  `Q12 — Sustained focus: ${answers.c4}/5`,
                ],
                note: "Workload is reverse-scored — higher workload answer = lower capacity score.",
              },
            ].map(({ id, label, value, icon: SIcon, color, formula, contributors, note }) => {
              const isOpen = sigExpanded === id;
              return (
                <div key={id} className="rounded-xl border border-slate-700/60 overflow-hidden" style={{ background: "rgba(22,32,58,0.7)" }}>
                  <button
                    onClick={() => setSigExpanded(isOpen ? null : id)}
                    className="flex w-full items-center justify-between px-4 py-3 text-left hover:bg-slate-700/30 transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <SIcon className={cn("h-4 w-4", color)} />
                      <span className="text-sm font-medium text-slate-100">{label}</span>
                      <span className={cn("text-sm font-bold ml-2", scoreColor(value))}>{value}/100</span>
                    </div>
                    {isOpen ? <ChevronUp className="h-4 w-4 text-slate-400" /> : <ChevronDown className="h-4 w-4 text-slate-400" />}
                  </button>
                  {isOpen && (
                    <div className="px-4 pb-4 pt-1 space-y-3 text-xs">
                      <div className="rounded-lg bg-slate-800/60 px-3 py-2">
                        <span className="text-slate-400">Formula: </span>
                        <span className="text-indigo-300 font-mono">{formula}</span>
                      </div>
                      <div>
                        <p className="text-slate-400 uppercase tracking-wide mb-1.5">Contributing questions</p>
                        <ul className="space-y-1">
                          {contributors.map((c, ci) => (
                            <li key={ci} className="flex items-start gap-2 text-slate-300">
                              <span className="mt-0.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-indigo-500/60" />
                              {c}
                            </li>
                          ))}
                        </ul>
                      </div>
                      <p className="text-slate-500 italic">{note}</p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* 3c. M3: Decision Confidence score */}
        <div className="mb-6 rounded-2xl border border-indigo-400/20 p-6" style={{ background: "rgba(22,32,58,0.95)" }}>
          <div className="flex items-center gap-2 mb-3">
            <CheckCircle2 className="h-5 w-5 text-indigo-400" />
            <h3 className="font-semibold text-white">Decision Confidence</h3>
            <span className="rounded-full border border-indigo-400/30 px-2 py-0.5 text-xs text-indigo-300">New in M3</span>
          </div>
          <p className="text-xs text-slate-300 mb-4 leading-relaxed">
            Decision Confidence measures how consistent and well-balanced the three signals are.
            High confidence means the domains are closely aligned and scores are above the threshold for reliable pattern-matching.
            Low confidence indicates spread or low scores — the recommendation still applies, but apply additional judgement.
          </p>
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <div className="flex justify-between text-sm mb-1.5">
                <span className="text-slate-400">Signal consistency</span>
                <span className={cn("font-bold", scoreColor(scores.decisionConfidence))}>{scores.decisionConfidence}<span className="text-slate-500 font-normal">/100</span></span>
              </div>
              <div className="h-2.5 w-full rounded-full bg-slate-700">
                <div className={cn("h-2.5 rounded-full transition-all duration-700", scoreBarColor(scores.decisionConfidence))} style={{ width: `${scores.decisionConfidence}%` }} />
              </div>
            </div>
          </div>
          <div className="mt-4 grid gap-2 sm:grid-cols-3 text-xs">
            <div className="rounded-lg bg-slate-700/50 p-2.5">
              <p className="text-slate-400 uppercase tracking-wide mb-0.5">Score spread</p>
              <p className={cn("font-semibold", Math.max(scores.mindScore, scores.goalScore, scores.capacityScore) - Math.min(scores.mindScore, scores.goalScore, scores.capacityScore) < 20 ? "text-green-300" : Math.max(scores.mindScore, scores.goalScore, scores.capacityScore) - Math.min(scores.mindScore, scores.goalScore, scores.capacityScore) < 40 ? "text-amber-300" : "text-red-300")}>
                {Math.max(scores.mindScore, scores.goalScore, scores.capacityScore) - Math.min(scores.mindScore, scores.goalScore, scores.capacityScore)} pts
              </p>
            </div>
            <div className="rounded-lg bg-slate-700/50 p-2.5">
              <p className="text-slate-400 uppercase tracking-wide mb-0.5">Average score</p>
              <p className={cn("font-semibold", scoreColor(Math.round((scores.mindScore + scores.goalScore + scores.capacityScore) / 3)))}>
                {Math.round((scores.mindScore + scores.goalScore + scores.capacityScore) / 3)}/100
              </p>
            </div>
            <div className="rounded-lg bg-slate-700/50 p-2.5">
              <p className="text-slate-400 uppercase tracking-wide mb-0.5">Confidence band</p>
              <p className={cn("font-semibold",
                scores.decisionConfidence >= 70 ? "text-green-300" :
                scores.decisionConfidence >= 45 ? "text-amber-300" : "text-red-300")}>
                {scores.decisionConfidence >= 70 ? "High" : scores.decisionConfidence >= 45 ? "Moderate" : "Low"}
              </p>
            </div>
          </div>
        </div>

        {/* 5. Cross-domain insights */}
        <div className="mb-6 rounded-2xl border border-slate-700/50 p-6" style={{ background: "rgba(17,26,48,0.95)" }}>
          <h3 className="font-semibold text-white mb-4">Cross-Domain Insights</h3>
          <div className="mb-4 rounded-xl border border-indigo-400/20 p-4" style={{ background: "rgba(22,32,58,0.8)" }}>
            <p className="text-white text-sm font-medium">{insights.narrativeInsight}</p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 text-sm">
            <div className="rounded-lg bg-slate-700/50 p-3">
              <p className="text-xs text-slate-400 uppercase tracking-wide mb-1">Strongest domain</p>
              <p className="font-semibold text-green-300">{insights.strongest}</p>
            </div>
            <div className="rounded-lg bg-slate-700/50 p-3">
              <p className="text-xs text-slate-400 uppercase tracking-wide mb-1">Weakest assessed domain</p>
              <p className="font-semibold text-red-300">{insights.weakest}</p>
            </div>
            <div className="rounded-lg bg-slate-700/50 p-3">
              <p className="text-xs text-slate-400 uppercase tracking-wide mb-1">Largest score gap</p>
              <p className="font-semibold text-amber-300">{insights.gap} points</p>
            </div>
            <div className="rounded-lg bg-slate-700/50 p-3">
              <p className="text-xs text-slate-400 uppercase tracking-wide mb-1">Primary tension</p>
              <p className="text-slate-200">{insights.primaryTension}</p>
            </div>
          </div>
          <div className="mt-3 rounded-lg border border-indigo-400/15 p-3" style={{ background: "rgba(22,32,58,0.8)" }}>
            <p className="text-xs text-slate-400 uppercase tracking-wide mb-1">Best leverage point</p>
            <p className="text-sm text-slate-200">{insights.leverage}</p>
          </div>
        </div>

        {/* 6. Decision Twin Simulator */}
        <div className="mb-6 rounded-2xl border border-violet-500/25 p-6" style={{ background: "rgba(22,32,58,0.95)" }}>
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
          <div className="rounded-xl border border-slate-700/60 p-4 space-y-3" style={{ background: "rgba(17,26,48,0.95)" }}>
            <div className="flex items-center justify-between">
              <p className="text-xs uppercase tracking-wide text-slate-400">Simulated Decision Readiness</p>
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
            <div className="rounded-lg bg-slate-700/60 p-3 text-sm">
              <p className="text-xs text-slate-400 uppercase tracking-wide mb-1">
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
          <div className="mb-6 rounded-2xl border border-slate-700/50 p-6" style={{ background: "rgba(17,26,48,0.95)" }}>
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
        <div className="mb-6 rounded-2xl border border-slate-700/50 p-6" style={{ background: "rgba(17,26,48,0.95)" }}>
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-semibold text-white">ICF Profile Code</h3>
            <span className="rounded-full border border-slate-600 px-2 py-0.5 text-xs text-slate-500">MVP profile code</span>
          </div>
          <p className="text-xs text-slate-300 mb-4">
            The ICF Profile Code is a compact representation of the currently assessed domains.
            It is not a diagnosis or permanent identity. It is based on original results only and does not change during simulation.
          </p>
          <div className="flex items-center gap-3 rounded-xl border border-slate-700/60 px-5 py-4" style={{ background: "rgba(22,32,58,0.8)" }}>
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

        {/* ── M4-9: Executive Summary ─────────────────────────────────────── */}
        <div className="mb-6 rounded-2xl border border-indigo-400/20 p-6" style={{ background: "rgba(22,32,58,0.95)" }}>
          <div className="flex items-center gap-2 mb-3">
            <FileText className="h-5 w-5 text-indigo-400" />
            <h3 className="font-semibold text-white">Executive Summary</h3>
            <span className="rounded-full border border-slate-600 px-2 py-0.5 text-xs text-slate-500">≤120 words</span>
          </div>
          <p className="text-sm text-slate-200 leading-relaxed">{execSummary}</p>
        </div>

        {/* ── M4-1: Decision Reasoning Pipeline — visual ───────────────── */}
        <div className="mb-6 rounded-2xl border border-slate-700/50 p-6" style={{ background: "rgba(17,26,48,0.95)" }}>
          <div className="flex items-center gap-2 mb-1">
            <Layers className="h-5 w-5 text-indigo-400" />
            <h3 className="font-semibold text-white">Decision Reasoning Pipeline</h3>
          </div>
          <p className="text-xs text-slate-400 mb-6 leading-relaxed">
            Deterministic · Rule-based · No machine learning · Fully transparent
          </p>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {reasoning.map((step, i) => (
              <div key={step.stage} className="relative rounded-xl border border-slate-700/50 p-4"
                style={{ background: "rgba(22,32,58,0.8)" }}>
                <div className="flex items-start gap-3">
                  <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full border-2 border-indigo-400/60 bg-indigo-500/20 text-xs font-bold text-indigo-300">
                    {i + 1}
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs uppercase tracking-wide text-slate-400 mb-0.5">{step.stage}</p>
                    <p className="text-sm font-medium text-slate-100 mb-1 leading-snug">{step.summary}</p>
                    <p className="text-xs text-slate-400 leading-relaxed">{step.detail}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── M4-2: Signal Importance ─────────────────────────────────────── */}
        <div className="mb-6 rounded-2xl border border-slate-700/50 p-6" style={{ background: "rgba(17,26,48,0.95)" }}>
          <div className="flex items-center gap-2 mb-4">
            <BarChart3 className="h-5 w-5 text-indigo-400" />
            <h3 className="font-semibold text-white">Signal Importance</h3>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <p className="text-xs uppercase tracking-wide text-slate-400 mb-2">Top positive signals</p>
              <ul className="space-y-1.5">
                {signals.positive.length === 0
                  ? <li className="text-xs text-slate-400 italic">No signals above threshold</li>
                  : signals.positive.map((sig, i) => (
                  <li key={i} className="flex items-center gap-2 text-sm">
                    <CheckCircle2 className="h-4 w-4 flex-shrink-0 text-green-400" />
                    <span className="text-slate-200 flex-1">{sig.label}</span>
                    <span className={cn("text-xs font-mono font-semibold", scoreColor(sig.value))}>{sig.value}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <p className="text-xs uppercase tracking-wide text-slate-400 mb-2">Top limiting signals</p>
              <ul className="space-y-1.5">
                {signals.limiting.length === 0
                  ? <li className="text-xs text-slate-400 italic">No significant limiting signals</li>
                  : signals.limiting.map((sig, i) => (
                  <li key={i} className="flex items-center gap-2 text-sm">
                    <AlertTriangle className="h-4 w-4 flex-shrink-0 text-amber-400" />
                    <span className="text-slate-200 flex-1">{sig.label}</span>
                    <span className={cn("text-xs font-mono font-semibold", scoreColor(sig.value))}>{sig.value}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        {/* ── M4-3: Decision Factors ──────────────────────────────────────── */}
        <div className="mb-6 rounded-2xl border border-slate-700/50 p-6" style={{ background: "rgba(17,26,48,0.95)" }}>
          <div className="flex items-center gap-2 mb-4">
            <Info className="h-5 w-5 text-indigo-400" />
            <h3 className="font-semibold text-white">Decision Factors</h3>
          </div>
          <div className="space-y-3">
            <div className="rounded-lg border border-red-400/20 p-3" style={{ background: "rgba(239,68,68,0.06)" }}>
              <p className="text-xs uppercase tracking-wide text-slate-400 mb-1">Primary driver</p>
              <p className="text-sm text-slate-100">{factors.primaryDriver}</p>
            </div>
            <div className="rounded-lg border border-amber-400/20 p-3" style={{ background: "rgba(245,158,11,0.06)" }}>
              <p className="text-xs uppercase tracking-wide text-slate-400 mb-1">Secondary driver</p>
              <p className="text-sm text-slate-100">{factors.secondaryDriver}</p>
            </div>
            <div className="rounded-lg bg-slate-700/50 p-3">
              <p className="text-xs uppercase tracking-wide text-slate-400 mb-2">Supporting factors</p>
              <ul className="space-y-1.5">
                {factors.supportingFactors.map((f, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-slate-300">
                    <span className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-indigo-500/60" />{f}
                  </li>
                ))}
              </ul>
            </div>
            <div className="rounded-lg bg-slate-700/50 p-3">
              <p className="text-xs uppercase tracking-wide text-slate-400 mb-2">Missing information</p>
              <ul className="space-y-1.5">
                {factors.missingInformation.map((m, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-slate-400">
                    <span className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-slate-500" />{m}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        {/* ── M4-4: Decision Tree View ────────────────────────────────────── */}
        <div className="mb-6 rounded-2xl border border-slate-700/50 p-6" style={{ background: "rgba(17,26,48,0.95)" }}>
          <div className="flex items-center gap-2 mb-4">
            <ListTree className="h-5 w-5 text-indigo-400" />
            <h3 className="font-semibold text-white">Decision Tree</h3>
          </div>
          <p className="text-xs text-slate-400 mb-4">
            Each branch shows how a domain signal contributed to the final recommendation.
          </p>
          <DecisionTreeView node={tree} />
        </div>

        {/* ── M4-5: Explainability Score ──────────────────────────────────── */}
        <div className="mb-6 rounded-2xl border border-slate-700/50 p-6" style={{ background: "rgba(17,26,48,0.95)" }}>
          <div className="flex items-center gap-2 mb-3">
            <ShieldCheck className="h-5 w-5 text-indigo-400" />
            <h3 className="font-semibold text-white">Explainability Score</h3>
          </div>
          <p className="text-xs text-slate-500 mb-4 leading-relaxed">
            Measures how complete and verifiable the explanation is — distinct from Decision Confidence.
            Higher = more signals assessed, more complete answers, more consistent patterns.
          </p>
          <div className="flex items-center gap-4 mb-4">
            <div className="flex-1">
              <div className="flex justify-between text-sm mb-1.5">
                <span className="text-slate-400">Explanation completeness</span>
                <span className={cn("font-bold", scoreColor(explScore))}>{explScore}<span className="text-slate-500 font-normal">/100</span></span>
              </div>
              <div className="h-2.5 w-full rounded-full bg-slate-700">
                <div className={cn("h-2.5 rounded-full transition-all duration-700", scoreBarColor(explScore))} style={{ width: `${explScore}%` }} />
              </div>
            </div>
          </div>
          <div className="grid gap-2 sm:grid-cols-2 text-xs">
            <div className="rounded-lg bg-slate-700/50 p-2.5">
              <p className="text-slate-400 mb-0.5">Domains assessed</p>
              <p className="text-slate-200 font-semibold">3 / 6 (MVP)</p>
            </div>
            <div className="rounded-lg bg-slate-700/50 p-2.5">
              <p className="text-slate-400 mb-0.5">Questions answered</p>
              <p className="text-slate-200 font-semibold">12 / 12</p>
            </div>
            <div className="rounded-lg bg-slate-700/50 p-2.5">
              <p className="text-slate-400 mb-0.5">Decision Confidence</p>
              <p className={cn("font-semibold", scoreColor(scores.decisionConfidence))}>{scores.decisionConfidence}/100</p>
            </div>
            <div className="rounded-lg bg-slate-700/50 p-2.5">
              <p className="text-slate-400 mb-0.5">Explainability</p>
              <p className={cn("font-semibold", scoreColor(explScore))}>{explScore}/100</p>
            </div>
          </div>
        </div>

        {/* ── M4-6: Recommendation Quality (trade-off + alternative) ─────── */}
        <div className="mb-6 rounded-2xl border border-indigo-400/20 p-6" style={{ background: "rgba(22,32,58,0.95)" }}>
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="h-5 w-5 text-indigo-400" />
            <h3 className="font-semibold text-white">Recommendation Quality</h3>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {[
              { label: "Recommended action",  value: rec.nextAction,           border: "border-indigo-400/20",  },
              { label: "Primary driver",       value: rec.reason,               border: "border-blue-400/20",    },
              { label: "Expected benefit",     value: rec.expectedBenefit,      border: "border-green-400/20",   },
              { label: "Possible limitation",  value: rec.possibleLimitation,   border: "border-amber-400/20",   },
              { label: "Alternative option",   value: rec.rationale.split(".")[0] + ". Consider the alternative if the primary constraint does not improve within 3–5 days.", border: "border-slate-600/50" },
              { label: "When to reassess",     value: rec.nextReviewPoint,      border: "border-slate-600/50",   },
            ].map(({ label, value, border }) => (
              <div key={label} className={cn("rounded-lg border p-3", border)} style={{ background: "rgba(30,42,68,0.6)" }}>
                <p className="text-xs text-slate-400 uppercase tracking-wide mb-1">{label}</p>
                <p className="text-sm text-slate-200 leading-relaxed">{value}</p>
              </div>
            ))}
          </div>
        </div>

        {/* ── M4-7: Decision Evidence ─────────────────────────────────────── */}
        <div className="mb-6 rounded-2xl border border-slate-700/50 p-6" style={{ background: "rgba(17,26,48,0.95)" }}>
          <div className="flex items-center gap-2 mb-4">
            <BookOpen className="h-5 w-5 text-indigo-400" />
            <h3 className="font-semibold text-white">Evidence Used</h3>
          </div>
          <p className="text-xs text-slate-400 mb-4 leading-relaxed">
            Only signals that were actually assessed are shown. Future modules remain hidden.
          </p>
          <div className="space-y-3">
            {[
              {
                domain: "Mind Signals",
                icon: Brain,
                color: "text-blue-400",
                border: "border-blue-400/20",
                bg: "bg-blue-400/5",
                items: [
                  { label: "Mental clarity",         value: Math.round(((answers.m1 - 1) / 4) * 100), note: "Q1 — direct" },
                  { label: "Concentration",           value: Math.round(((answers.m2 - 1) / 4) * 100), note: "Q2 — direct" },
                  { label: "Cognitive overload",      value: Math.round(((answers.m3 - 1) / 4) * 100), note: "Q3 — raw (reverse-applied in score)" },
                  { label: "Emotional pressure",      value: Math.round(((answers.m4 - 1) / 4) * 100), note: "Q4 — raw (reverse-applied in score)" },
                ],
              },
              {
                domain: "Goal Signals",
                icon: Target,
                color: "text-green-400",
                border: "border-green-400/20",
                bg: "bg-green-400/5",
                items: [
                  { label: "Goal clarity",        value: Math.round(((answers.g1 - 1) / 4) * 100), note: "Q5" },
                  { label: "Personal importance", value: Math.round(((answers.g2 - 1) / 4) * 100), note: "Q6" },
                  { label: "Confidence",          value: Math.round(((answers.g3 - 1) / 4) * 100), note: "Q7" },
                  { label: "Next-step clarity",   value: Math.round(((answers.g4 - 1) / 4) * 100), note: "Q8" },
                ],
              },
              {
                domain: "Capacity Signals",
                icon: Zap,
                color: "text-amber-400",
                border: "border-amber-400/20",
                bg: "bg-amber-400/5",
                items: [
                  { label: "Energy level",    value: Math.round(((answers.c1 - 1) / 4) * 100), note: "Q9 — direct" },
                  { label: "Sleep & recovery", value: Math.round(((answers.c2 - 1) / 4) * 100), note: "Q10 — direct" },
                  { label: "Workload",         value: Math.round(((answers.c3 - 1) / 4) * 100), note: "Q11 — raw (reverse-applied in score)" },
                  { label: "Sustained focus",  value: Math.round(((answers.c4 - 1) / 4) * 100), note: "Q12 — direct" },
                ],
              },
            ].map(({ domain, icon: DIcon, color, border, bg, items }) => (
              <div key={domain} className={cn("rounded-xl border p-4", border)} style={{ background: "rgba(22,32,58,0.7)" }}>
                <div className="flex items-center gap-2 mb-3">
                  <DIcon className={cn("h-4 w-4", color)} />
                  <p className={cn("text-sm font-semibold", color)}>{domain}</p>
                </div>
                <div className="grid grid-cols-2 gap-1.5">
                  {items.map(item => (
                    <div key={item.label} className="flex items-center justify-between rounded px-2.5 py-1.5" style={{ background: "rgba(30,42,68,0.6)" }}>
                      <div>
                        <p className="text-xs text-slate-200">{item.label}</p>
                        <p className="text-xs text-slate-500">{item.note}</p>
                      </div>
                      <span className={cn("text-sm font-bold font-mono ml-2", scoreColor(item.value))}>{item.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── M4-8: Consistency Analysis ──────────────────────────────────── */}
        <div className="mb-6 rounded-2xl border border-slate-700/50 p-6" style={{ background: "rgba(17,26,48,0.95)" }}>
          <div className="flex items-center gap-2 mb-3">
            <Activity className="h-5 w-5 text-indigo-400" />
            <h3 className="font-semibold text-white">Consistency Analysis</h3>
          </div>
          <p className="text-xs text-slate-400 mb-4 leading-relaxed">
            Internal signal consistency review. Notes highlight patterns that may warrant additional attention.
            These are observations, not errors or diagnoses.
          </p>
          <div className="space-y-3">
            {consistency.map((flag, i) => (
              <div key={i} className={cn(
                "rounded-xl border p-4",
                flag.severity === "note"
                  ? "border-amber-400/20"
                  : "border-slate-700/50"
              )} style={{ background: flag.severity === "note" ? "rgba(245,158,11,0.07)" : "rgba(22,32,58,0.7)" }}>
                <div className="flex items-start gap-2 mb-1">
                  {flag.severity === "note"
                    ? <AlertTriangle className="h-4 w-4 flex-shrink-0 text-amber-400 mt-0.5" />
                    : <CheckCircle2 className="h-4 w-4 flex-shrink-0 text-slate-500 mt-0.5" />}
                  <p className={cn("text-sm font-medium", flag.severity === "note" ? "text-amber-200" : "text-slate-400")}>
                    {flag.title}
                  </p>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed ml-6">{flag.description}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Footer CTA */}
        <div className="mt-10 flex flex-col gap-3 border-t border-slate-700/50 pt-8 sm:flex-row sm:justify-between">
          <button onClick={handleRestart}
            className="flex items-center justify-center gap-2 rounded-full border border-slate-600 px-6 py-2.5 text-sm font-medium text-slate-300 hover:bg-slate-700/50 transition-colors">
            <RotateCcw className="h-4 w-4" /> Take assessment again
          </button>
          <button onClick={() => setPhase("report")}
            className="flex items-center justify-center gap-2 rounded-full px-8 py-2.5 text-sm font-semibold text-white transition-all hover:brightness-110"
            style={{ background: "#4f46e5", boxShadow: "0 1px 3px rgba(0,0,0,0.3)" }}>
            Generate ICF Report →
          </button>
        </div>
      </div>
    );
  }

  // ── REPORT (M4 expanded) ────────────────────────────────────────────────────
  if (phase === "report" && scores && rec) {
    const today = new Date().toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });
    const profileCode = buildProfileCode(scores);
    // M4 report computations
    const rptSignals    = buildSignalImportance(scores, answers);
    const rptTree       = buildDecisionTree(scores, rec);
    const rptExplScore  = computeExplainabilityScore(scores, answers);
    const rptConsistency= analyseConsistency(scores, answers);
    const rptExecSummary= buildExecutiveSummary(scores, rec);
    const rptReasoning  = buildReasoningSteps(scores, rec);
    return (
      <div className="mx-auto max-w-5xl px-6 py-10 lg:px-10">
        {/* Report toolbar — hidden when printing */}
        <div className="mb-6 flex items-center justify-between print:hidden">
          <button
            onClick={() => setPhase("dashboard")}
            className="flex items-center gap-2 text-sm text-slate-400 hover:text-white transition-colors"
            aria-label="Return to dashboard"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden="true" /> Back to dashboard
          </button>
          <button
            onClick={() => window.print()}
            className="flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold text-white transition-all hover:brightness-110"
            style={{ background: "#4f46e5", boxShadow: "0 1px 3px rgba(0,0,0,0.3)" }}
            aria-label="Print or save this report as PDF"
          >
            <Printer className="h-4 w-4" aria-hidden="true" /> Print / Save as PDF
          </button>
        </div>

        <div
          id="icf-report"
          className="rounded-2xl border border-slate-700/50 p-8 text-slate-200 print:border-0 print:bg-white print:p-0 print:text-black"
          style={{ background: "rgba(17,26,48,0.98)" }}
        >
          <div className="border-b border-slate-700/60 pb-6 mb-6 print:border-slate-300">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs uppercase tracking-widest text-indigo-400 print:text-indigo-700 mb-1">
                  ICF AI Copilot — Integrative Cognitive Framework
                </p>
                <h1 className="text-2xl font-bold text-white print:text-black">
                  Decision Intelligence Report
                </h1>
              </div>
              {isSample && (
                <span className="rounded-full border border-amber-400/30 bg-amber-400/10 px-3 py-1 text-xs text-amber-300 print:border-amber-400 print:text-amber-800">
                  Demo Mode — Sample Data
                </span>
              )}
            </div>
            <div className="mt-3 flex flex-wrap gap-4 text-sm text-slate-400 print:text-slate-600">
              <span>Date: {today}</span>
              <span>Scope: Mind · Goal · Body / Capacity (MVP)</span>
              <span>Pattern: {rec.pattern}</span>
              <span className="font-mono text-indigo-400 print:text-indigo-700">{profileCode}</span>
            </div>
          </div>

          <section className="mb-8">
            <h2 className="text-lg font-bold text-white print:text-black mb-4">Score Summary</h2>
            <div className="grid gap-3 sm:grid-cols-2">
              {[
                ["Decision Readiness", scores.decisionReadiness],
                ["Decision Confidence", scores.decisionConfidence],
                ["Focus Index",        scores.focusIndex],
                ["Goal Alignment",     scores.goalAlignment],
                ["Capacity Index",     scores.capacityIndex],
                ["Mind Domain",        scores.mindScore],
                ["Goal Domain",        scores.goalScore],
                ["Capacity Domain",    scores.capacityScore],
              ].map(([label, value]) => (
                <div key={String(label)} className="flex items-center justify-between rounded-lg border border-slate-700/60 px-4 py-3 print:border-slate-300 print:bg-slate-50" style={{ background: "rgba(22,32,58,0.8)" }}>
                  <span className="text-sm text-slate-200 print:text-slate-700">{label}</span>
                  <span className={cn("font-bold", scoreColor(Number(value)))}>{value}/100</span>
                </div>
              ))}
              <div className="flex items-center justify-between rounded-lg border border-slate-700/60 px-4 py-3 print:border-slate-300 print:bg-slate-50" style={{ background: "rgba(22,32,58,0.8)" }}>
                <span className="text-sm text-slate-200 print:text-slate-700">Risk Level</span>
                <span className={cn("font-bold", riskColor(scores.riskLevel).split(" ")[0])}>{scores.riskLevel}</span>
              </div>
            </div>
          </section>

          {/* M3: Decision Confidence in report */}
          <section className="mb-8">
            <h2 className="text-lg font-bold text-white print:text-black mb-3">Decision Confidence</h2>
            <div className="rounded-xl border border-indigo-400/20 p-5 print:border-indigo-300 print:bg-indigo-50" style={{ background: "rgba(22,32,58,0.95)" }}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-slate-200 print:text-slate-700">Signal consistency score</span>
                <span className={cn("font-bold text-lg", scoreColor(scores.decisionConfidence))}>{scores.decisionConfidence}/100</span>
              </div>
              <p className="text-xs text-slate-400 print:text-slate-600 leading-relaxed">
                Decision Confidence measures how consistent and complete the signal pattern is across all three domains.
                A high score ({'>'}70) means domains are closely aligned and pattern-matching is reliable.
                A lower score means significant spread between domains — the recommendation still applies but warrants additional judgement.
              </p>
              <div className="mt-3 grid gap-2 sm:grid-cols-3 text-xs">
                {[
                  { label: "Score spread", value: `${Math.max(scores.mindScore, scores.goalScore, scores.capacityScore) - Math.min(scores.mindScore, scores.goalScore, scores.capacityScore)} pts` },
                  { label: "Average domain score", value: `${Math.round((scores.mindScore + scores.goalScore + scores.capacityScore) / 3)}/100` },
                  { label: "Confidence band", value: scores.decisionConfidence >= 70 ? "High" : scores.decisionConfidence >= 45 ? "Moderate" : "Low" },
                ].map(({ label, value }) => (
                  <div key={label} className="rounded-lg bg-slate-700/50 px-3 py-2 print:bg-slate-100">
                    <p className="text-slate-400 mb-0.5">{label}</p>
                    <p className="font-semibold text-slate-200 print:text-slate-800">{value}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* M3: ICF Human Development Graph in report */}
          <section className="mb-8">
            <h2 className="text-lg font-bold text-white print:text-black mb-3">ICF Human Development Graph</h2>
            <HumanDevelopmentGraph mind={scores.focusIndex} goal={scores.goalAlignment} body={scores.capacityIndex} />
          </section>

          {/* M3: Cross-domain insights in report */}
          {(() => {
            const ins = crossDomainInsights(scores.focusIndex, scores.goalAlignment, scores.capacityIndex);
            return (
              <section className="mb-8">
                <h2 className="text-lg font-bold text-white print:text-black mb-3">Cross-Domain Insights</h2>
                <div className="rounded-xl border border-indigo-400/20 bg-indigo-500/5 p-4 mb-3 print:border-indigo-200 print:bg-indigo-50">
                  <p className="text-sm text-white print:text-black font-medium">{ins.narrativeInsight}</p>
                </div>
                <div className="grid gap-2 sm:grid-cols-2 text-sm">
                  <div className="rounded-lg bg-slate-800/40 p-3 print:bg-slate-50 print:border print:border-slate-200">
                    <p className="text-xs text-slate-500 uppercase mb-1">Strongest domain</p>
                    <p className="font-semibold text-green-300 print:text-green-700">{ins.strongest}</p>
                  </div>
                  <div className="rounded-lg bg-slate-800/40 p-3 print:bg-slate-50 print:border print:border-slate-200">
                    <p className="text-xs text-slate-500 uppercase mb-1">Primary constraint</p>
                    <p className="font-semibold text-red-300 print:text-red-700">{ins.weakest}</p>
                  </div>
                  <div className="rounded-lg bg-slate-800/40 p-3 print:bg-slate-50 print:border print:border-slate-200">
                    <p className="text-xs text-slate-500 uppercase mb-1">Primary tension</p>
                    <p className="text-slate-300 print:text-slate-700">{ins.primaryTension}</p>
                  </div>
                  <div className="rounded-lg bg-slate-800/40 p-3 print:bg-slate-50 print:border print:border-slate-200">
                    <p className="text-xs text-slate-500 uppercase mb-1">Best leverage point</p>
                    <p className="text-slate-300 print:text-slate-700">{ins.leverage}</p>
                  </div>
                </div>
              </section>
            );
          })()}

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

          {/* M4: Executive Summary in report */}
          <section className="mb-8">
            <h2 className="text-lg font-bold text-white print:text-black mb-3">Executive Summary</h2>
            <div className="rounded-xl border border-indigo-400/30 bg-indigo-500/10 p-5 print:border-indigo-300 print:bg-indigo-50">
              <p className="text-sm text-slate-200 print:text-slate-800 leading-relaxed">{rptExecSummary}</p>
            </div>
          </section>

          {/* M4: Decision Reasoning in report */}
          <section className="mb-8">
            <h2 className="text-lg font-bold text-white print:text-black mb-3">Decision Reasoning</h2>
            <div className="space-y-3">
              {rptReasoning.map((step, i) => (
                <div key={step.stage} className="rounded-lg border border-slate-700 bg-slate-800/40 px-4 py-3 print:border-slate-300 print:bg-slate-50">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="flex h-5 w-5 rounded-full bg-indigo-600 text-xs font-bold text-white items-center justify-center flex-shrink-0 print:bg-indigo-100 print:text-indigo-700">{i + 1}</span>
                    <p className="text-xs uppercase tracking-wide text-slate-500 print:text-slate-600">{step.stage}</p>
                  </div>
                  <p className="text-sm font-medium text-slate-200 print:text-slate-800 ml-7 mb-0.5">{step.summary}</p>
                  <p className="text-xs text-slate-500 print:text-slate-600 ml-7 leading-relaxed">{step.detail}</p>
                </div>
              ))}
            </div>
          </section>

          {/* M4: Signal Importance in report */}
          <section className="mb-8">
            <h2 className="text-lg font-bold text-white print:text-black mb-3">Signal Importance</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <p className="text-xs uppercase tracking-wide text-slate-500 print:text-slate-600 mb-2">Positive signals</p>
                <ul className="space-y-1.5">
                  {rptSignals.positive.length === 0
                    ? <li className="text-xs text-slate-500 italic">No signals above threshold</li>
                    : rptSignals.positive.map((sig, i) => (
                    <li key={i} className="flex items-center gap-2 text-sm text-slate-300 print:text-slate-700">
                      <span className="text-green-400 print:text-green-700">✓</span>
                      <span className="flex-1">{sig.label}</span>
                      <span className="font-mono text-xs">{sig.value}/100</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <p className="text-xs uppercase tracking-wide text-slate-500 print:text-slate-600 mb-2">Limiting signals</p>
                <ul className="space-y-1.5">
                  {rptSignals.limiting.length === 0
                    ? <li className="text-xs text-slate-500 italic">None</li>
                    : rptSignals.limiting.map((sig, i) => (
                    <li key={i} className="flex items-center gap-2 text-sm text-slate-300 print:text-slate-700">
                      <span className="text-amber-400 print:text-amber-700">⚠</span>
                      <span className="flex-1">{sig.label}</span>
                      <span className="font-mono text-xs">{sig.value}/100</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </section>

          {/* M4: Decision Tree in report */}
          <section className="mb-8">
            <h2 className="text-lg font-bold text-white print:text-black mb-3">Decision Tree</h2>
            <div className="rounded-xl border border-slate-700 bg-slate-800/40 p-5 print:border-slate-300 print:bg-slate-50">
              <DecisionTreeView node={rptTree} />
            </div>
          </section>

          {/* M4: Explainability Score in report */}
          <section className="mb-8">
            <h2 className="text-lg font-bold text-white print:text-black mb-3">Explainability Score</h2>
            <div className="rounded-xl border border-slate-700 bg-slate-800/40 p-5 print:border-slate-300 print:bg-slate-50">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-slate-300 print:text-slate-700">Explanation completeness</span>
                <span className={cn("font-bold text-lg", scoreColor(rptExplScore))}>{rptExplScore}/100</span>
              </div>
              <p className="text-xs text-slate-500 print:text-slate-600">
                Explainability measures how complete the explanation is, not how confident the system is.
                Decision Confidence: {scores.decisionConfidence}/100 · Explainability: {rptExplScore}/100.
              </p>
            </div>
          </section>

          {/* M4: Consistency Analysis in report */}
          <section className="mb-8">
            <h2 className="text-lg font-bold text-white print:text-black mb-3">Consistency Analysis</h2>
            <div className="space-y-2">
              {rptConsistency.map((flag, i) => (
                <div key={i} className={cn(
                  "rounded-lg border px-4 py-3 print:border-slate-300",
                  flag.severity === "note" ? "border-amber-400/20 bg-amber-400/5 print:bg-amber-50" : "border-slate-700 bg-slate-800/30 print:bg-slate-50"
                )}>
                  <p className={cn("text-sm font-medium mb-0.5", flag.severity === "note" ? "text-amber-200 print:text-amber-800" : "text-slate-400 print:text-slate-700")}>{flag.title}</p>
                  <p className="text-xs text-slate-500 print:text-slate-600 leading-relaxed">{flag.description}</p>
                </div>
              ))}
            </div>
          </section>

          {/* M4: Evidence Used in report */}
          <section className="mb-8">
            <h2 className="text-lg font-bold text-white print:text-black mb-3">Evidence Used</h2>
            <div className="grid gap-2 sm:grid-cols-3 text-xs">
              {[
                { domain: "Mind", items: ["Q1 Mental clarity", "Q2 Concentration", "Q3 Overload (rev.)", "Q4 Pressure (rev.)"] },
                { domain: "Goal", items: ["Q5 Goal clarity", "Q6 Importance", "Q7 Confidence", "Q8 Next steps"] },
                { domain: "Capacity", items: ["Q9 Energy", "Q10 Recovery", "Q11 Workload (rev.)", "Q12 Focus"] },
              ].map(({ domain, items }) => (
                <div key={domain} className="rounded-lg border border-slate-700 bg-slate-800/40 p-3 print:border-slate-300 print:bg-slate-50">
                  <p className="font-semibold text-slate-300 print:text-slate-800 mb-1.5">{domain} signals</p>
                  <ul className="space-y-0.5">
                    {items.map(item => (
                      <li key={item} className="flex items-start gap-1.5 text-slate-500 print:text-slate-600">
                        <span>•</span>{item}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
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
            <p className="text-xs text-amber-300 print:text-amber-800 leading-relaxed">
              <strong>Decision support — not a diagnosis.</strong>{" "}
              ICF AI Copilot is a decision-support and human-development tool. This report is intended
              to support human decision-making and should not be interpreted as a medical or psychological
              diagnosis. It does not provide treatment, therapy or emergency mental-health services.
              If you are experiencing distress, please contact a qualified professional.
            </p>
          </div>

          <div className="mt-8 border-t border-slate-700 pt-4 print:border-slate-300 text-xs text-slate-600">
            <p>ICF AI Copilot — Integrative Cognitive Framework · {profileCode} · Generated {today}</p>
            <p className="mt-1">Designed for integration with IBM watsonx.ai, Granite and enterprise AI governance.</p>
          </div>
        </div>
      </div>
    );
  }

  return null;
}
