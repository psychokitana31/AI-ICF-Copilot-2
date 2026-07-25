/**
 * ICF AI Copilot — Explainability Engine (Milestone 4)
 *
 * All functions are deterministic, pure, and dependency-free.
 * They consume existing ScoreResult + Recommendation types and return
 * structured explanation objects consumed by UI components.
 *
 * No API calls. No randomness. No new dependencies.
 */

import type { ScoreResult } from "./scoring";
import type { Answers } from "./scoring";
import type { Recommendation } from "./recommendations";

// ── Signal importance ─────────────────────────────────────────────────────────

export interface SignalItem {
  label: string;
  value: number;   // 0–100
  polarity: "positive" | "limiting";
  weight: "primary" | "secondary" | "supporting";
}

/**
 * Returns ordered positive and limiting signals derived from raw answers.
 * "Positive" = score >= 65; "Limiting" = score < 50.
 * Between 50–64 = supporting (can appear in either list based on polarity).
 */
export function buildSignalImportance(s: ScoreResult, a: Answers): {
  positive: SignalItem[];
  limiting: SignalItem[];
} {
  // Normalise 1–5 to 0–100 (same formula as scoring.ts)
  const n = (v: number) => Math.round(((v - 1) / 4) * 100);
  const r = (v: number) => n(6 - v);

  const raw: { label: string; value: number }[] = [
    { label: "Mental clarity",       value: n(a.m1) },
    { label: "Concentration",        value: n(a.m2) },
    { label: "Low cognitive overload", value: r(a.m3) },
    { label: "Emotional stability",  value: r(a.m4) },
    { label: "Goal clarity",         value: n(a.g1) },
    { label: "Motivation",           value: n(a.g2) },
    { label: "Confidence",           value: n(a.g3) },
    { label: "Next-step clarity",    value: n(a.g4) },
    { label: "Energy level",         value: n(a.c1) },
    { label: "Sleep & recovery",     value: n(a.c2) },
    { label: "Low workload",         value: r(a.c3) },
    { label: "Sustained focus",      value: n(a.c4) },
  ];

  const sorted = [...raw].sort((a, b) => b.value - a.value);
  const positive = sorted
    .filter(x => x.value >= 50)
    .slice(0, 4)
    .map((x, i): SignalItem => ({
      label: x.label,
      value: x.value,
      polarity: "positive",
      weight: i === 0 ? "primary" : i === 1 ? "secondary" : "supporting",
    }));

  const limiting = [...raw]
    .sort((a, b) => a.value - b.value)
    .filter(x => x.value < 55)
    .slice(0, 4)
    .map((x, i): SignalItem => ({
      label: x.label,
      value: x.value,
      polarity: "limiting",
      weight: i === 0 ? "primary" : i === 1 ? "secondary" : "supporting",
    }));

  return { positive, limiting };
}

// ── Decision factors ──────────────────────────────────────────────────────────

export interface DecisionFactors {
  primaryDriver: string;
  secondaryDriver: string;
  supportingFactors: string[];
  missingInformation: string[];
}

export function buildDecisionFactors(s: ScoreResult, rec: Recommendation): DecisionFactors {
  // Primary driver = lowest domain (binding constraint)
  const min = Math.min(s.rawMind, s.rawGoal, s.rawCapacity);
  const max = Math.max(s.rawMind, s.rawGoal, s.rawCapacity);

  const domainName = (v: number) =>
    v === s.rawMind ? "Mind / Focus" :
    v === s.rawGoal ? "Goal Alignment" :
    "Body / Capacity";

  const primaryDriver = `${domainName(min)} is the primary constraint (${min}/100)`;

  // Secondary = highest domain driving the pattern
  const secondaryDriver = `${domainName(max)} is the strongest available signal (${max}/100) and drives the recommendation direction`;

  // Supporting = middle domain + readiness
  const mid = [s.rawMind, s.rawGoal, s.rawCapacity].find(v => v !== min && v !== max) ?? s.rawMind;
  const supportingFactors = [
    `${domainName(mid)} provides moderate support (${mid}/100)`,
    `Decision Readiness at ${s.decisionReadiness}/100 — ${s.decisionReadiness >= 60 ? "conditions are suitable for action" : "conditions are constrained"}`,
    `Risk level is ${s.riskLevel} — pattern ${rec.pattern} selected`,
  ];

  return {
    primaryDriver,
    secondaryDriver,
    supportingFactors,
    missingInformation: rec.missingInformation,
  };
}

// ── Decision tree ─────────────────────────────────────────────────────────────

export interface TreeNode {
  label: string;
  value?: string;
  status?: "good" | "moderate" | "low" | "result";
  children?: TreeNode[];
}

export function buildDecisionTree(s: ScoreResult, rec: Recommendation): TreeNode {
  const tier = (v: number): "good" | "moderate" | "low" =>
    v >= 65 ? "good" : v >= 40 ? "moderate" : "low";
  const label = (v: number): string =>
    v >= 65 ? "Strong" : v >= 40 ? "Moderate" : "Low";

  return {
    label: "Decision",
    children: [
      {
        label: "Focus Index",
        value: `${s.focusIndex}/100`,
        status: tier(s.focusIndex),
        children: [{ label: label(s.focusIndex), status: tier(s.focusIndex) }],
      },
      {
        label: "Goal Alignment",
        value: `${s.goalAlignment}/100`,
        status: tier(s.goalAlignment),
        children: [{ label: label(s.goalAlignment), status: tier(s.goalAlignment) }],
      },
      {
        label: "Body / Capacity",
        value: `${s.capacityIndex}/100`,
        status: tier(s.capacityIndex),
        children: [{ label: label(s.capacityIndex), status: tier(s.capacityIndex) }],
      },
      {
        label: "Result",
        status: "result",
        children: [{ label: rec.title, status: "result" }],
      },
    ],
  };
}

// ── Explainability score ──────────────────────────────────────────────────────

/**
 * Measures how COMPLETE the explanation is — not how confident we are.
 * Distinct from decisionConfidence.
 *
 * Scoring breakdown (100 pts total):
 *   +30  three domains assessed (MVP covers all three)
 *   +25  all 12 questions answered (completeness)
 *   +20  consistency bonus (spread < 30)
 *   +15  readiness above threshold (>= 50)
 *   +10  risk level clearly determined (not borderline)
 */
export function computeExplainabilityScore(s: ScoreResult, a: Answers): number {
  let score = 0;

  // Three domains present — always true in MVP
  score += 30;

  // All 12 questions answered
  const answered = Object.values(a).filter(v => v > 0).length;
  score += Math.round((answered / 12) * 25);

  // Consistency bonus — low spread between domains
  const spread = Math.max(s.rawMind, s.rawGoal, s.rawCapacity) - Math.min(s.rawMind, s.rawGoal, s.rawCapacity);
  if (spread < 15)      score += 20;
  else if (spread < 30) score += 12;
  else if (spread < 45) score += 6;

  // Decision readiness above threshold
  if (s.decisionReadiness >= 60)      score += 15;
  else if (s.decisionReadiness >= 40) score += 8;

  // Risk clearly determined (not borderline — i.e., not within 5 pts of boundary)
  const lowestDomain = Math.min(s.rawMind, s.rawGoal, s.rawCapacity);
  const borderline35 = Math.abs(lowestDomain - 35) < 5;
  const borderline55 = Math.abs(lowestDomain - 55) < 5;
  if (!borderline35 && !borderline55) score += 10;

  return Math.min(100, score);
}

// ── Consistency analysis ──────────────────────────────────────────────────────

export interface ConsistencyFlag {
  severity: "info" | "note";  // never "error" or "diagnosis"
  title: string;
  description: string;
}

/**
 * Detects internal signal tensions using deterministic rules only.
 * Never frames findings as errors or diagnoses.
 */
export function analyseConsistency(s: ScoreResult, a: Answers): ConsistencyFlag[] {
  const flags: ConsistencyFlag[] = [];

  // High motivation + very low goal clarity
  const motivation = Math.round(((a.g2 - 1) / 4) * 100);
  const clarity    = Math.round(((a.g1 - 1) / 4) * 100);
  if (motivation >= 75 && clarity < 35) {
    flags.push({
      severity: "note",
      title: "High motivation with low goal clarity",
      description:
        "Strong personal importance combined with unclear goal definition may lead to misdirected effort. Consider spending focused time defining the goal before acting.",
    });
  }

  // High capacity + very high workload (contradictory signals)
  const energy   = Math.round(((a.c1 - 1) / 4) * 100);
  const workload = Math.round(((a.c3 - 1) / 4) * 100); // raw (not reversed)
  if (energy >= 65 && workload >= 75) {
    flags.push({
      severity: "note",
      title: "High energy alongside heavy workload",
      description:
        "Good energy levels paired with a heavy workload often indicates unsustainable output. Additional assessment may clarify whether the workload is temporary or structural.",
    });
  }

  // High focus + low capacity (cognitive vs physical mismatch)
  if (s.focusIndex >= 65 && s.capacityIndex < 35) {
    flags.push({
      severity: "info",
      title: "Mental clarity without physical capacity",
      description:
        "Strong cognitive focus without supporting physical energy and recovery is a pattern that often precedes fatigue. Protecting recovery time is advisable.",
    });
  }

  // Strong goal + very low confidence
  const confidence = Math.round(((a.g3 - 1) / 4) * 100);
  if (s.goalScore >= 65 && confidence < 30) {
    flags.push({
      severity: "note",
      title: "Clear goal with low execution confidence",
      description:
        "A well-defined goal paired with low confidence in making progress may indicate skill gaps, resource constraints, or past setbacks. Additional exploration of this gap is recommended.",
    });
  }

  // No flags detected
  if (flags.length === 0) {
    flags.push({
      severity: "info",
      title: "No significant signal tensions detected",
      description: "The three assessed domains show internally consistent patterns. No further consistency notes apply at this time.",
    });
  }

  return flags;
}

// ── Executive summary ─────────────────────────────────────────────────────────

/**
 * Generates a concise ≤120-word executive summary suitable for non-specialist readers.
 * Structured: Situation → Constraint → Opportunity → Next Step.
 * Fully deterministic from scores.
 */
export function buildExecutiveSummary(s: ScoreResult, rec: Recommendation): string {
  const domainName = (v: number) =>
    v === s.rawMind ? "cognitive focus" :
    v === s.rawGoal ? "goal clarity" :
    "available capacity";

  const lowestVal = Math.min(s.rawMind, s.rawGoal, s.rawCapacity);
  const highestVal = Math.max(s.rawMind, s.rawGoal, s.rawCapacity);
  const constraint  = domainName(lowestVal);
  const opportunity = domainName(highestVal);

  const readinessDesc =
    s.decisionReadiness >= 70 ? "favourable" :
    s.decisionReadiness >= 50 ? "moderate" :
    "constrained";

  const situation = `Decision readiness is ${readinessDesc} at ${s.decisionReadiness}/100 with ${s.riskLevel.toLowerCase()} risk.`;
  const constraintSentence = `The primary constraint is ${constraint} (${lowestVal}/100), which is limiting execution quality.`;
  const opportunitySentence = `The best available opportunity is ${opportunity} (${highestVal}/100) — this is the most reliable signal to build on.`;
  const nextStep = `Immediate priority: ${rec.nextAction}`;

  const words = [situation, constraintSentence, opportunitySentence, nextStep].join(" ");
  // Trim to ≤ 120 words
  const wordArray = words.split(" ");
  return wordArray.length > 120 ? wordArray.slice(0, 120).join(" ") + "…" : words;
}

// ── Decision reasoning steps ──────────────────────────────────────────────────

export interface ReasoningStep {
  stage: string;
  summary: string;
  detail: string;
}

/**
 * Returns the full reasoning pipeline as a list of labelled steps.
 * Every step corresponds to a real stage in the engine.
 */
export function buildReasoningSteps(s: ScoreResult, rec: Recommendation): ReasoningStep[] {
  return [
    {
      stage: "Collected Signals",
      summary: "12 self-reported answers across Mind, Goal, and Body/Capacity",
      detail: `Mind: clarity ${s.mindScore}/100 · Goal: alignment ${s.goalScore}/100 · Capacity: ${s.capacityScore}/100. All 12 questions answered on a 1–5 scale. Reverse-scored items (overload, pressure, workload) were inverted before aggregation.`,
    },
    {
      stage: "Signal Strength",
      summary: `Strongest — ${s.strongestSignal} · Primary constraint — ${s.primaryConstraint}`,
      detail: `Domain scores were compared to identify the strongest and weakest signals. Spread between highest and lowest domain: ${Math.max(s.rawMind, s.rawGoal, s.rawCapacity) - Math.min(s.rawMind, s.rawGoal, s.rawCapacity)} points.`,
    },
    {
      stage: "Cross-domain Analysis",
      summary: `Risk level: ${s.riskLevel} · Decision Readiness: ${s.decisionReadiness}/100`,
      detail: `Risk is derived from the lowest domain score (${Math.min(s.rawMind, s.rawGoal, s.rawCapacity)}/100). Decision Readiness is computed as Goal×40% + Mind×35% + Capacity×25%.`,
    },
    {
      stage: "Decision Logic",
      summary: "Priority rules evaluated in order: E → A → B → C → D",
      detail: `Rule E (High risk): ${s.riskLevel === "High" ? "MATCHED — overrides all other rules." : "not matched."} Rule A (High goal, low capacity): ${s.rawGoal >= 65 && s.rawCapacity < 50 ? "MATCHED." : "not matched."} Rule B (Low goal, adequate capacity): ${s.rawGoal < 50 && s.rawCapacity >= 55 ? "MATCHED." : "not matched."} Rule C (Low mind): ${s.rawMind < 50 ? "MATCHED." : "not matched."}`,
    },
    {
      stage: "Priority Selection",
      summary: `Pattern ${rec.pattern} selected`,
      detail: rec.reason,
    },
    {
      stage: "Recommendation",
      summary: rec.title,
      detail: rec.rationale,
    },
  ];
}
