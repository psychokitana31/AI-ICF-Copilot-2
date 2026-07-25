/**
 * ICF AI Copilot — Deterministic Scoring Engine
 *
 * All formulas are transparent and produce identical output for identical input.
 * No randomness. No external calls.
 *
 * Answer scale: 1–5 (1 = lowest/worst, 5 = highest/best) for all questions
 * unless noted as reverse-scored.
 *
 * MIND questions (4):
 *   m1 — mental clarity         (direct: higher = better)
 *   m2 — concentration          (direct)
 *   m3 — cognitive overload     (REVERSE: higher answer = worse, so score = 6-answer)
 *   m4 — emotional pressure     (REVERSE)
 *
 * GOAL questions (4):
 *   g1 — goal clarity           (direct)
 *   g2 — perceived importance   (direct)
 *   g3 — confidence             (direct)
 *   g4 — next-step clarity      (direct)
 *
 * CAPACITY questions (4):
 *   c1 — current energy         (direct)
 *   c2 — sleep / recovery       (direct)
 *   c3 — workload               (REVERSE)
 *   c4 — sustained focus        (direct)
 */

export interface Answers {
  m1: number; m2: number; m3: number; m4: number;
  g1: number; g2: number; g3: number; g4: number;
  c1: number; c2: number; c3: number; c4: number;
}

export interface ScoreResult {
  // Domain raw means (0–100)
  mindScore: number;
  goalScore: number;
  capacityScore: number;

  // Derived composite indices (0–100)
  focusIndex: number;       // Mind × 0.6 + Capacity × 0.4
  goalAlignment: number;    // Goal score directly
  capacityIndex: number;    // Capacity score directly

  // Decision Readiness (0–100)
  // Weighted: Goal 40% + Mind 35% + Capacity 25%
  decisionReadiness: number;

  // Decision Confidence (0–100)
  // How consistent and complete the signal pattern is.
  // High when all three domains are close together AND above 40.
  // Penalised by high spread or very low scores.
  decisionConfidence: number;

  // Risk level derived from lowest domain score
  riskLevel: "Low" | "Moderate" | "High";

  // Explanatory signals
  strongestSignal: string;
  primaryConstraint: string;
  confidenceLevel: "Low" | "Moderate" | "High";

  // Raw domain means kept for explainability
  rawMind: number;   // 0–100
  rawGoal: number;
  rawCapacity: number;
}

/** Normalise a 1–5 answer to 0–100 */
function n(v: number): number {
  return Math.round(((v - 1) / 4) * 100);
}

/** Reverse-score a 1–5 answer then normalise */
function r(v: number): number {
  return n(6 - v);
}

export function scoreAnswers(a: Answers): ScoreResult {
  // ── Mind domain ──────────────────────────────────────────────────────────────
  // m1, m2: direct  |  m3, m4: reverse (overload/pressure are negative signals)
  const mindRaw = (n(a.m1) + n(a.m2) + r(a.m3) + r(a.m4)) / 4;

  // ── Goal domain ──────────────────────────────────────────────────────────────
  // All direct — higher = better alignment
  const goalRaw = (n(a.g1) + n(a.g2) + n(a.g3) + n(a.g4)) / 4;

  // ── Capacity domain ──────────────────────────────────────────────────────────
  // c1, c2, c4: direct  |  c3: reverse (workload is a negative signal)
  const capacityRaw = (n(a.c1) + n(a.c2) + r(a.c3) + n(a.c4)) / 4;

  const mind     = Math.round(mindRaw);
  const goal     = Math.round(goalRaw);
  const capacity = Math.round(capacityRaw);

  // ── Composite indices ─────────────────────────────────────────────────────────
  // Focus Index: ability to sustain directed attention (mind-heavy)
  const focusIndex = Math.round(mind * 0.6 + capacity * 0.4);

  // Goal Alignment: how well-defined and important the goal is
  const goalAlignment = goal;

  // Capacity Index: physical/mental energy available
  const capacityIndex = capacity;

  // ── Decision Readiness ────────────────────────────────────────────────────────
  // Goal clarity drives readiness most; mind quality second; capacity third
  const decisionReadiness = Math.round(goal * 0.40 + mind * 0.35 + capacity * 0.25);

  // ── Risk Level ────────────────────────────────────────────────────────────────
  // Risk is driven by the weakest domain
  const lowestDomain = Math.min(mind, goal, capacity);
  const riskLevel: ScoreResult["riskLevel"] =
    lowestDomain < 35 ? "High" :
    lowestDomain < 55 ? "Moderate" :
    "Low";

  // ── Strongest signal & constraint ────────────────────────────────────────────
  const domainScores = { Mind: mind, Goal: goal, Capacity: capacity };
  const sorted = Object.entries(domainScores).sort((a, b) => b[1] - a[1]);
  const strongestSignal = `${sorted[0]![0]} (${sorted[0]![1]}/100)`;
  const primaryConstraint = `${sorted[2]![0]} (${sorted[2]![1]}/100)`;

  // ── Confidence ────────────────────────────────────────────────────────────────
  // Confidence in the recommendation is higher when signals are consistent
  const spread = Math.max(mind, goal, capacity) - Math.min(mind, goal, capacity);
  const confidenceLevel: ScoreResult["confidenceLevel"] =
    spread < 20 ? "High" :
    spread < 40 ? "Moderate" :
    "Low";

  // ── Decision Confidence ───────────────────────────────────────────────────────
  // Starts at 100, penalised by spread and low individual scores.
  // spread penalty: up to -35 pts  |  low-score penalty: up to -25 pts
  const avgScore = (mind + goal + capacity) / 3;
  const spreadPenalty = Math.round((spread / 100) * 35);
  const lowScorePenalty = avgScore < 40 ? 25 : avgScore < 55 ? 15 : avgScore < 70 ? 5 : 0;
  const decisionConfidence = Math.max(0, Math.min(100, 100 - spreadPenalty - lowScorePenalty));

  return {
    mindScore: mind,
    goalScore: goal,
    capacityScore: capacity,
    focusIndex,
    goalAlignment,
    capacityIndex,
    decisionReadiness,
    decisionConfidence,
    riskLevel,
    strongestSignal,
    primaryConstraint,
    confidenceLevel,
    rawMind: mind,
    rawGoal: goal,
    rawCapacity: capacity,
  };
}

/** Sample profile used by "Load sample data" button */
export const SAMPLE_ANSWERS: Answers = {
  m1: 3, m2: 3, m3: 2, m4: 2,   // moderate mind, moderate overload/pressure
  g1: 4, g2: 5, g3: 4, g4: 3,   // strong goal clarity and importance
  c1: 2, c2: 2, c3: 4, c4: 2,   // low energy and recovery, high workload
};
