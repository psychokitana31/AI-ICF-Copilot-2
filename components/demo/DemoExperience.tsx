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
  FlaskConical,
} from "lucide-react";

// ── Question definitions ────────────────────────────────────────────────────────

const QUESTIONS = [
  // MIND
  { id: "m1", section: "mind", text: "How clear and sharp does your thinking feel right now?", reverse: false },
  { id: "m2", section: "mind", text: "How well are you able to concentrate on one thing at a time?", reverse: false },
  { id: "m3", section: "mind", text: "How much does mental overload feel like a problem for you today?", reverse: true, reverseNote: "(1 = not at all, 5 = extremely)" },
  { id: "m4", section: "mind", text: "How much emotional pressure are you carrying right now?", reverse: true, reverseNote: "(1 = none, 5 = overwhelming)" },
  // GOAL
  { id: "g1", section: "goal", text: "How clearly can you describe your main goal right now?", reverse: false },
  { id: "g2", section: "goal", text: "How personally important is achieving this goal to you?", reverse: false },
  { id: "g3", section: "goal", text: "How confident are you that you can make meaningful progress on it?", reverse: false },
  { id: "g4", section: "goal", text: "How clear are the next concrete steps you need to take?", reverse: false },
  // CAPACITY
  { id: "c1", section: "capacity", text: "How would you rate your current physical and mental energy level?", reverse: false },
  { id: "c2", section: "capacity", text: "How well have you slept and recovered in recent days?", reverse: false },
  { id: "c3", section: "capacity", text: "How heavy is your current workload feeling?", reverse: true, reverseNote: "(1 = light, 5 = crushing)" },
  { id: "c4", section: "capacity", text: "How well can you sustain focused work for 60+ minutes right now?", reverse: false },
] as const;

type QuestionId = typeof QUESTIONS[number]["id"];

const SECTIONS = [
  { id: "mind",     label: "Mind",            icon: Brain,  color: "text-blue-400",   bg: "bg-blue-400/10",  border: "border-blue-400/30",  questions: ["m1","m2","m3","m4"] },
  { id: "goal",     label: "Goal",            icon: Target, color: "text-green-400",  bg: "bg-green-400/10", border: "border-green-400/30", questions: ["g1","g2","g3","g4"] },
  { id: "capacity", label: "Body / Capacity", icon: Zap,    color: "text-amber-400",  bg: "bg-amber-400/10", border: "border-amber-400/30", questions: ["c1","c2","c3","c4"] },
] as const;

const SCALE_LABELS = ["Strongly disagree", "Disagree", "Neutral", "Agree", "Strongly agree"];

type Phase = "intro" | "assessment" | "dashboard" | "report";

const EMPTY_ANSWERS: Answers = { m1:0, m2:0, m3:0, m4:0, g1:0, g2:0, g3:0, g4:0, c1:0, c2:0, c3:0, c4:0 };

// ── Score colour helpers ────────────────────────────────────────────────────────

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
  if (r === "Low") return "text-green-400 bg-green-400/10 border-green-400/30";
  if (r === "Moderate") return "text-amber-400 bg-amber-400/10 border-amber-400/30";
  return "text-red-400 bg-red-400/10 border-red-400/30";
}

// ── Sub-components ──────────────────────────────────────────────────────────────

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

// ── Main component ──────────────────────────────────────────────────────────────

export function DemoExperience() {
  const [phase, setPhase] = useState<Phase>("intro");
  const [answers, setAnswers] = useState<Answers>(EMPTY_ANSWERS);
  const [currentSection, setCurrentSection] = useState(0);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [scores, setScores] = useState<ScoreResult | null>(null);
  const [rec, setRec] = useState<Recommendation | null>(null);
  const [whyOpen, setWhyOpen] = useState(true);
  const [isSample, setIsSample] = useState(false);

  const section = SECTIONS[currentSection]!;
  const sectionQIds = section.questions as readonly string[];
  const sectionQuestions = QUESTIONS.filter(q => sectionQIds.includes(q.id));

  // Total answered in current section
  const sectionAnswered = sectionQuestions.filter(q => (answers[q.id as QuestionId] ?? 0) > 0).length;
  const totalAnswered = QUESTIONS.filter(q => (answers[q.id as QuestionId] ?? 0) > 0).length;
  const overallProgress = Math.round((totalAnswered / 12) * 100);

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
  }

  function loadSample() {
    const s = scoreAnswers(SAMPLE_ANSWERS);
    const r = selectRecommendation(s);
    setAnswers(SAMPLE_ANSWERS);
    setScores(s);
    setRec(r);
    setIsSample(true);
    setPhase("dashboard");
  }

  // ── INTRO ───────────────────────────────────────────────────────────────────

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
          <button
            onClick={() => setPhase("assessment")}
            className="inline-flex items-center justify-center gap-2 rounded-full bg-white px-8 py-3 font-semibold text-slate-950 hover:bg-slate-200"
          >
            Start assessment <ArrowRight className="h-4 w-4" />
          </button>
          <button
            onClick={loadSample}
            className="inline-flex items-center justify-center gap-2 rounded-full border border-white/20 px-8 py-3 text-sm font-medium text-slate-300 hover:bg-white/10"
          >
            <FlaskConical className="h-4 w-4" /> Load sample profile
          </button>
        </div>
      </div>
    );
  }

  // ── ASSESSMENT ──────────────────────────────────────────────────────────────

  if (phase === "assessment") {
    const Icon = section.icon;
    return (
      <div className="mx-auto max-w-xl px-4 py-8">
        {/* Overall progress */}
        <div className="mb-2 flex items-center justify-between text-xs text-slate-500">
          <span>{totalAnswered} / 12 answered</span>
          <button onClick={handleRestart} className="flex items-center gap-1 hover:text-slate-300">
            <RotateCcw className="h-3 w-3" /> Restart
          </button>
        </div>
        <div className="mb-6 h-1 w-full overflow-hidden rounded-full bg-slate-800">
          <div className="h-full rounded-full bg-indigo-500 transition-all" style={{ width: `${overallProgress}%` }} />
        </div>

        {/* Section header */}
        <div className={cn("mb-6 flex items-center gap-3 rounded-xl border p-4", section.bg, section.border)}>
          <Icon className={cn("h-6 w-6 flex-shrink-0", section.color)} />
          <div>
            <p className={cn("font-bold", section.color)}>{section.label}</p>
            <p className="text-xs text-slate-400">Section {currentSection + 1} of {SECTIONS.length} · 4 questions</p>
          </div>
        </div>

        {/* Questions */}
        <div className="space-y-8">
          {sectionQuestions.map((q, qi) => {
            const ans = answers[q.id as QuestionId] ?? 0;
            return (
              <div key={q.id}>
                <p className="mb-1 text-xs text-slate-500">Question {currentSection * 4 + qi + 1} of 12</p>
                <p className="mb-3 font-medium text-white leading-snug">
                  {q.text}
                  {"reverseNote" in q && (
                    <span className="ml-1 text-xs text-slate-500">{q.reverseNote}</span>
                  )}
                </p>
                <div className="grid grid-cols-5 gap-2">
                  {[1,2,3,4,5].map(v => (
                    <button
                      key={v}
                      onClick={() => setAnswer(q.id as QuestionId, v)}
                      aria-label={`${v} — ${SCALE_LABELS[v-1]}`}
                      className={cn(
                        "flex flex-col items-center gap-1 rounded-xl border py-3 text-xs transition-all",
                        ans === v
                          ? "border-indigo-500 bg-indigo-600 text-white font-semibold"
                          : "border-slate-700 bg-slate-800/60 text-slate-400 hover:border-slate-500 hover:text-slate-200"
                      )}
                    >
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

        {/* Navigation */}
        <div className="mt-8 flex gap-3">
          <button
            onClick={handleBack}
            className="flex items-center gap-2 rounded-full border border-slate-700 px-5 py-2.5 text-sm font-medium text-slate-300 hover:bg-slate-800"
          >
            <ArrowLeft className="h-4 w-4" /> Back
          </button>
          <button
            onClick={handleContinue}
            className="ml-auto flex items-center gap-2 rounded-full bg-indigo-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-indigo-500"
          >
            {currentSection < SECTIONS.length - 1 ? "Continue" : "See my results"}
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    );
  }

  // ── DASHBOARD ───────────────────────────────────────────────────────────────

  if (phase === "dashboard" && scores && rec) {
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

        {/* Decision Readiness hero */}
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

        {/* Recommendation */}
        <div className="mb-6 rounded-2xl border border-indigo-400/30 bg-slate-800/60 p-6">
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs uppercase tracking-wide text-slate-500">Recommendation · Pattern {rec.pattern}</p>
            <span className={cn("rounded-full border px-2.5 py-0.5 text-xs font-semibold",
              scores.confidenceLevel === "High" ? "border-green-400/30 text-green-300 bg-green-400/10" :
              scores.confidenceLevel === "Moderate" ? "border-amber-400/30 text-amber-300 bg-amber-400/10" :
              "border-slate-600 text-slate-400 bg-slate-700/50"
            )}>Confidence: {scores.confidenceLevel}</span>
          </div>
          <h2 className="text-xl font-bold text-white mb-2">{rec.title}</h2>
          <p className="text-slate-300 text-sm leading-relaxed mb-4">{rec.rationale}</p>
          <div className="rounded-xl bg-slate-700/50 p-4">
            <p className="text-xs uppercase tracking-wide text-slate-500 mb-1">Recommended next action</p>
            <p className="text-white font-medium">{rec.nextAction}</p>
          </div>
        </div>

        {/* Explainability panel */}
        <div className="mb-6 rounded-2xl border border-slate-700 bg-slate-800/40 p-6">
          <button
            onClick={() => setWhyOpen(o => !o)}
            className="flex w-full items-center justify-between text-left"
          >
            <div className="flex items-center gap-2">
              <Info className="h-5 w-5 text-indigo-400" />
              <h3 className="font-semibold text-white">Why this recommendation?</h3>
            </div>
            {whyOpen ? <ChevronUp className="h-4 w-4 text-slate-500" /> : <ChevronDown className="h-4 w-4 text-slate-500" />}
          </button>

          {whyOpen && (
            <div className="mt-5 space-y-5 text-sm">
              <p className="text-slate-300 leading-relaxed italic border-l-2 border-indigo-500 pl-4">
                {rec.whyText}
              </p>

              <div>
                <p className="text-xs uppercase tracking-wide text-slate-500 mb-2">Influencing factors</p>
                <ul className="space-y-1.5">
                  {rec.influencingFactors.map((f, i) => (
                    <li key={i} className="flex items-start gap-2 text-slate-300">
                      <CheckCircle2 className="mt-0.5 h-4 w-4 flex-shrink-0 text-indigo-400" />
                      {f}
                    </li>
                  ))}
                </ul>
              </div>

              <div>
                <p className="text-xs uppercase tracking-wide text-slate-500 mb-2">Missing information</p>
                <ul className="space-y-1.5">
                  {rec.missingInformation.map((m, i) => (
                    <li key={i} className="flex items-start gap-2 text-slate-400">
                      <span className="mt-1 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-slate-600" />
                      {m}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="rounded-lg border border-amber-400/20 bg-amber-400/5 p-3 text-amber-200 text-xs">
                <AlertTriangle className="mb-1 h-3.5 w-3.5 text-amber-400" />
                This is decision support, not an objective diagnosis. The recommendation is based on
                your self-reported answers and deterministic rules — always apply your own judgement.
              </div>
            </div>
          )}
        </div>

        {/* 6-Domain ICF overview */}
        <div className="mb-6">
          <h3 className="mb-4 font-semibold text-white">ICF Domain Overview</h3>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {[
              { name: "Mind",          score: scores.mindScore,     color: "text-blue-400",   bg: "bg-blue-400/10",   border: "border-blue-400/20",   assessed: true  },
              { name: "Goal",          score: scores.goalScore,     color: "text-green-400",  bg: "bg-green-400/10",  border: "border-green-400/20",  assessed: true  },
              { name: "Body/Capacity", score: scores.capacityScore, color: "text-amber-400",  bg: "bg-amber-400/10",  border: "border-amber-400/20",  assessed: true  },
              { name: "Language",      score: null,                 color: "text-slate-500",  bg: "bg-slate-800/40",  border: "border-slate-700",     assessed: false },
              { name: "Scenario",      score: null,                 color: "text-slate-500",  bg: "bg-slate-800/40",  border: "border-slate-700",     assessed: false },
              { name: "Global",        score: null,                 color: "text-slate-500",  bg: "bg-slate-800/40",  border: "border-slate-700",     assessed: false },
            ].map(d => (
              <div key={d.name} className={cn("rounded-xl border p-4", d.bg, d.border)}>
                <div className="flex items-center justify-between mb-2">
                  <p className={cn("text-sm font-semibold", d.color)}>{d.name}</p>
                  {d.assessed
                    ? <span className="text-xs text-green-400 bg-green-400/10 px-2 py-0.5 rounded-full">Assessed</span>
                    : <span className="text-xs text-slate-600 bg-slate-700/50 px-2 py-0.5 rounded-full">Not assessed yet</span>
                  }
                </div>
                {d.assessed && d.score !== null ? (
                  <div>
                    <p className={cn("text-2xl font-bold", scoreColor(d.score))}>{d.score}<span className="text-sm text-slate-500 font-normal">/100</span></p>
                    <div className="mt-2 h-1.5 w-full rounded-full bg-slate-700">
                      <div className={cn("h-1.5 rounded-full", scoreBarColor(d.score))} style={{ width: `${d.score}%` }} />
                    </div>
                  </div>
                ) : (
                  <p className="text-xs text-slate-600 mt-1">Roadmap — not yet implemented</p>
                )}
              </div>
            ))}
          </div>
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

  // ── REPORT ──────────────────────────────────────────────────────────────────

  if (phase === "report" && scores && rec) {
    const today = new Date().toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });

    return (
      <div className="mx-auto max-w-3xl px-4 py-8">
        {/* Controls — hidden on print */}
        <div className="mb-6 flex items-center justify-between print:hidden">
          <button onClick={() => setPhase("dashboard")} className="flex items-center gap-2 text-sm text-slate-400 hover:text-white">
            <ArrowLeft className="h-4 w-4" /> Back to dashboard
          </button>
          <button
            onClick={() => window.print()}
            className="flex items-center gap-2 rounded-full bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-indigo-500"
          >
            <Printer className="h-4 w-4" /> Print / Save as PDF
          </button>
        </div>

        {/* Report body */}
        <div id="icf-report" className="rounded-2xl border border-slate-700 bg-slate-900 p-8 text-slate-200 print:border-0 print:bg-white print:text-black">

          {/* Report header */}
          <div className="border-b border-slate-700 pb-6 mb-6 print:border-slate-300">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs uppercase tracking-widest text-indigo-400 print:text-indigo-600 mb-1">ICF AI Copilot</p>
                <h1 className="text-2xl font-bold text-white print:text-black">Decision Intelligence Report</h1>
              </div>
              {isSample && (
                <span className="rounded-full border border-amber-400/30 bg-amber-400/10 px-3 py-1 text-xs text-amber-300 print:text-amber-700">
                  Sample data
                </span>
              )}
            </div>
            <div className="mt-3 flex gap-6 text-sm text-slate-400 print:text-slate-600">
              <span>Date: {today}</span>
              <span>Assessment scope: Mind · Goal · Body/Capacity</span>
              <span>Pattern: {rec.pattern}</span>
            </div>
          </div>

          {/* Score summary */}
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

          {/* Signal interpretation */}
          <section className="mb-8">
            <h2 className="text-lg font-bold text-white print:text-black mb-3">Signal Interpretation</h2>
            <div className="space-y-3 text-sm leading-relaxed text-slate-300 print:text-slate-700">
              <p><strong className="text-white print:text-black">Strongest signal:</strong> {scores.strongestSignal} — this domain is your current foundation for action.</p>
              <p><strong className="text-white print:text-black">Primary constraint:</strong> {scores.primaryConstraint} — this is limiting your overall decision readiness most.</p>
              <p><strong className="text-white print:text-black">Confidence:</strong> {scores.confidenceLevel} — {
                scores.confidenceLevel === "High" ? "your domain scores are consistent, so the recommendation is reliable." :
                scores.confidenceLevel === "Moderate" ? "some variation across domains; apply your own judgement." :
                "significant spread between domains; this result should be interpreted cautiously."
              }</p>
            </div>
          </section>

          {/* Recommendation */}
          <section className="mb-8">
            <h2 className="text-lg font-bold text-white print:text-black mb-3">Decision Priority</h2>
            <div className="rounded-xl border border-indigo-400/30 bg-indigo-500/10 p-5 print:border-indigo-300 print:bg-indigo-50">
              <p className="font-semibold text-white print:text-black mb-2">{rec.title}</p>
              <p className="text-sm text-slate-300 print:text-slate-700 leading-relaxed">{rec.rationale}</p>
            </div>
          </section>

          {/* Next action */}
          <section className="mb-8">
            <h2 className="text-lg font-bold text-white print:text-black mb-3">Recommended Next Action</h2>
            <div className="rounded-xl border border-green-400/20 bg-green-400/5 p-5 print:border-green-300 print:bg-green-50">
              <p className="text-white print:text-black">{rec.nextAction}</p>
            </div>
          </section>

          {/* 7-day plan */}
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

          {/* Explainability */}
          <section className="mb-8">
            <h2 className="text-lg font-bold text-white print:text-black mb-3">Why this recommendation?</h2>
            <p className="text-sm italic text-slate-300 print:text-slate-600 leading-relaxed border-l-2 border-indigo-500 pl-4 mb-4">
              {rec.whyText}
            </p>
            <p className="text-xs text-slate-500 print:text-slate-500">
              <strong>Scoring method:</strong> Mind = average of clarity, concentration (direct) and overload, emotional pressure (reverse-scored).
              Goal = average of clarity, importance, confidence and next-step clarity.
              Capacity = average of energy, recovery, sustained focus (direct) and workload (reverse).
              All scores normalised 0–100. Decision Readiness = Goal×40% + Mind×35% + Capacity×25%.
            </p>
          </section>

          {/* Limitations */}
          <section className="mb-8">
            <h2 className="text-lg font-bold text-white print:text-black mb-3">Limitations</h2>
            <ul className="space-y-2 text-sm text-slate-400 print:text-slate-600">
              <li className="flex gap-2"><span>•</span> This assessment covers Mind, Goal and Body/Capacity only. Language, Scenario and Global domains are not yet assessed.</li>
              <li className="flex gap-2"><span>•</span> Scores are based on self-reported answers at a single point in time. They may not reflect sustained patterns.</li>
              <li className="flex gap-2"><span>•</span> The recommendation engine uses deterministic rules, not machine learning. In production, IBM Granite would enrich these outputs.</li>
              <li className="flex gap-2"><span>•</span> This prototype does not store data, authenticate users or connect to any external service.</li>
            </ul>
          </section>

          {/* Safety disclaimer */}
          <div className="rounded-xl border border-amber-400/20 bg-amber-400/5 p-4 print:border-amber-300 print:bg-amber-50">
            <p className="text-xs text-amber-300 print:text-amber-700 leading-relaxed">
              <strong>Safety disclaimer:</strong> ICF AI Copilot is a decision-support and human-development tool.
              It does not provide medical diagnosis, treatment or emergency mental-health services.
              If you are in distress or need clinical support, please contact a qualified professional.
            </p>
          </div>

          {/* Report footer */}
          <div className="mt-8 border-t border-slate-700 pt-4 print:border-slate-300 text-xs text-slate-600">
            <p>ICF AI Copilot — Demo Prototype · Generated {today}</p>
            <p>Designed for integration with IBM watsonx.ai, Granite and enterprise AI governance.</p>
          </div>
        </div>
      </div>
    );
  }

  return null;
}
