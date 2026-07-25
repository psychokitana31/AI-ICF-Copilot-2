/**
 * ICF AI Copilot — Recommendation Engine
 *
 * Five deterministic recommendation patterns, selected by priority rule matching.
 * Each pattern includes: title, rationale, priority, next action, 7-day plan,
 * and the explainability text shown in the "Why this recommendation?" panel.
 */

import type { ScoreResult } from "./scoring";

export interface Recommendation {
  pattern: "A" | "B" | "C" | "D" | "E";
  title: string;
  rationale: string;
  priority: string;
  nextAction: string;
  sevenDayPlan: string[];
  whyText: string;                 // Explainability narrative
  influencingFactors: string[];
  missingInformation: string[];
  // M3 additions — recommendation quality metadata
  reason: string;                  // One-sentence primary driver
  expectedBenefit: string;         // What should improve and roughly when
  possibleLimitation: string;      // Main risk or assumption
  nextReviewPoint: string;         // When / condition to re-assess
}

/**
 * Rule table — evaluated in order; first match wins.
 *
 * Pattern A: High goal, low capacity
 *   → Protect the goal, reduce scope, prioritise recovery
 *
 * Pattern B: Low goal, adequate capacity
 *   → Clarify the goal before increasing effort
 *
 * Pattern C: Low focus, high overload (low mind score)
 *   → Reduce competing priorities, define single next action
 *
 * Pattern D: Balanced scores — proceed with structured plan
 *   → 7-day structured action plan
 *
 * Pattern E: High risk signals across any domain
 *   → Pause major decisions, seek human support
 */
export function selectRecommendation(s: ScoreResult): Recommendation {
  // Pattern E — overrides everything when risk is critical
  if (s.riskLevel === "High") {
    return PATTERNS.E(s);
  }

  // Pattern A — strong goal clarity but capacity is the bottleneck
  if (s.rawGoal >= 65 && s.rawCapacity < 50) {
    return PATTERNS.A(s);
  }

  // Pattern B — capacity available but goal is unclear
  if (s.rawGoal < 50 && s.rawCapacity >= 55) {
    return PATTERNS.B(s);
  }

  // Pattern C — mind is the bottleneck (low focus / high overload)
  if (s.rawMind < 50) {
    return PATTERNS.C(s);
  }

  // Pattern D — all domains reasonably balanced
  return PATTERNS.D(s);
}

// ── Pattern implementations ────────────────────────────────────────────────────

const PATTERNS = {

  A: (s: ScoreResult): Recommendation => ({
    pattern: "A",
    title: "Protect the goal — reduce scope",
    rationale:
      "Your goal clarity and importance are strong, but your current energy and recovery are limiting your capacity to act. Pushing harder now risks burnout without progress.",
    priority: "Protect the goal by temporarily reducing the scope of commitments.",
    nextAction:
      "Identify one goal-critical task and remove or defer everything else this week.",
    sevenDayPlan: [
      "Day 1: List all current commitments and mark which ones are goal-critical.",
      "Day 2: Defer or delegate at least two non-critical tasks.",
      "Day 3: Block a 90-minute deep-work session for the one critical task.",
      "Day 4: Rest and recovery — no new decisions.",
      "Day 5: Execute the deep-work session.",
      "Day 6: Review progress; note what made focus easier or harder.",
      "Day 7: Reassess capacity and plan next week with tighter scope.",
    ],
    whyText: `Your goal clarity is high (${s.rawGoal}/100), but current capacity is low (${s.rawCapacity}/100). ` +
      `The system therefore recommends protecting the goal and reducing scope rather than adding new commitments. ` +
      `Increasing effort under low capacity typically reduces output quality and increases error rate.`,
    influencingFactors: [
      `Goal domain score: ${s.rawGoal}/100 (strong — high clarity and importance)`,
      `Capacity domain score: ${s.rawCapacity}/100 (limiting factor)`,
      `Mind domain score: ${s.rawMind}/100`,
      `Decision Readiness: ${s.decisionReadiness}/100`,
    ],
    missingInformation: [
      "Timeline pressure on the goal (not assessed)",
      "External support or resources available (not assessed)",
      "Body / Language domain signals (roadmap)",
    ],
    reason: "High goal clarity combined with low available capacity creates a scope-overload risk.",
    expectedBenefit: "Reduced strain and improved execution quality within 7 days of scope reduction.",
    possibleLimitation: "External deadlines may prevent full scope reduction; adapt the plan to real constraints.",
    nextReviewPoint: "Re-assess capacity signals after 7 days or when recovery markers improve.",
  }),

  B: (s: ScoreResult): Recommendation => ({
    pattern: "B",
    title: "Clarify the goal before increasing effort",
    rationale:
      "You have available capacity and reasonable mental clarity, but the goal itself lacks sufficient clarity or personal importance. Increasing effort toward an unclear goal wastes resources.",
    priority: "Invest capacity in goal definition and values alignment before execution.",
    nextAction:
      "Schedule a 60-minute goal-clarification session: write down what success looks like in 90 days.",
    sevenDayPlan: [
      "Day 1: Write down your current primary goal in one sentence.",
      "Day 2: Test it — does it reflect your deepest values? Revise if needed.",
      "Day 3: Identify the three most important outcomes of achieving this goal.",
      "Day 4: Talk to one trusted person about whether the goal is realistic.",
      "Day 5: Break the goal into three milestones.",
      "Day 6: Assign a target date to the first milestone.",
      "Day 7: Review and commit — or replace the goal if clarity is still low.",
    ],
    whyText: `Your capacity is adequate (${s.rawCapacity}/100), but goal clarity is low (${s.rawGoal}/100). ` +
      `Executing vigorously toward an unclear goal is likely to produce misaligned output and frustration. ` +
      `The highest-return investment right now is goal clarification, not increased effort.`,
    influencingFactors: [
      `Goal domain score: ${s.rawGoal}/100 (limiting factor — low clarity)`,
      `Capacity domain score: ${s.rawCapacity}/100 (available)`,
      `Mind domain score: ${s.rawMind}/100`,
    ],
    missingInformation: [
      "Values alignment depth (not fully assessed)",
      "External constraints on the goal (not assessed)",
      "Scenario / Language domain signals (roadmap)",
    ],
    reason: "Available capacity is being wasted because the decision target lacks sufficient clarity.",
    expectedBenefit: "Once the goal is defined, existing capacity can be directed immediately — progress within 3–5 days.",
    possibleLimitation: "Goal clarity may require external input (feedback, coaching) not captured in this assessment.",
    nextReviewPoint: "Re-assess goal domain scores after 1 week of deliberate goal-clarification work.",
  }),

  C: (s: ScoreResult): Recommendation => ({
    pattern: "C",
    title: "Reduce competing priorities — define one next action",
    rationale:
      "Your cognitive load and emotional pressure are elevated, reducing focus capacity. Multiple competing priorities are fragmenting attention and decision quality.",
    priority: "Reduce active priorities to one and protect cognitive space.",
    nextAction:
      "Choose exactly one priority for this week and write it on paper where you will see it daily.",
    sevenDayPlan: [
      "Day 1: List every active task or responsibility. Count them.",
      "Day 2: Select the single highest-impact item. Mark everything else as 'paused'.",
      "Day 3: Remove or silence one recurring distraction (notification, meeting, commitment).",
      "Day 4: Work for no more than 4 focused hours — protect recovery time.",
      "Day 5: Reflect: did single-priority focus feel different? Note it.",
      "Day 6: Light day — consolidate and review, no new decisions.",
      "Day 7: Reassess the priority list with a clearer head.",
    ],
    whyText: `Your mind domain score is ${s.rawMind}/100, indicating elevated cognitive overload or emotional pressure. ` +
      `When multiple priorities compete for attention, decision quality and execution both decline. ` +
      `The recommendation is to reduce cognitive load first before attempting to act on any goal.`,
    influencingFactors: [
      `Mind domain score: ${s.rawMind}/100 (primary constraint)`,
      `Focus Index: ${s.focusIndex}/100`,
      `Capacity score: ${s.rawCapacity}/100`,
    ],
    missingInformation: [
      "Source of cognitive overload (not specifically assessed)",
      "Sleep quality details (partially assessed)",
      "Body / Language domain signals (roadmap)",
    ],
    reason: "Cognitive overload and elevated emotional pressure are fragmenting focus and reducing decision quality.",
    expectedBenefit: "Clearer thinking and improved execution quality within 3–4 days of priority reduction.",
    possibleLimitation: "External pressures (work, family) may make full priority reduction difficult; partial reduction still helps.",
    nextReviewPoint: "Re-assess mind domain scores after 7 days of single-priority focus.",
  }),

  D: (s: ScoreResult): Recommendation => ({
    pattern: "D",
    title: "Proceed with a structured 7-day action plan",
    rationale:
      "Your scores across Mind, Goal and Capacity are reasonably balanced. This is a good window to make structured progress on your primary goal.",
    priority: "Execute the first milestone of your primary goal with a daily structure.",
    nextAction:
      "Break your primary goal into three concrete tasks and schedule the first one today.",
    sevenDayPlan: [
      "Day 1: Define three concrete tasks that move your primary goal forward.",
      "Day 2: Complete the first task. Track time and energy spent.",
      "Day 3: Review — did the task match expectations? Adjust scope if needed.",
      "Day 4: Complete the second task.",
      "Day 5: Rest or light review day.",
      "Day 6: Complete the third task.",
      "Day 7: Assess progress, celebrate small wins, plan next cycle.",
    ],
    whyText: `Your scores are reasonably balanced: Mind ${s.rawMind}/100, Goal ${s.rawGoal}/100, Capacity ${s.rawCapacity}/100. ` +
      `No single domain is critically constraining. This is a suitable window to execute structured progress. ` +
      `Decision Readiness is ${s.decisionReadiness}/100 — conditions support forward action.`,
    influencingFactors: [
      `Mind domain score: ${s.rawMind}/100`,
      `Goal domain score: ${s.rawGoal}/100`,
      `Capacity domain score: ${s.rawCapacity}/100`,
      `Decision Readiness: ${s.decisionReadiness}/100`,
    ],
    missingInformation: [
      "Specific goal content (not entered in this assessment)",
      "External dependencies and resources (not assessed)",
      "Language / Scenario / Global domains (roadmap)",
    ],
    reason: "All three domains are sufficiently balanced to support structured execution without major constraint.",
    expectedBenefit: "Meaningful progress on the primary goal's first milestone within the 7-day window.",
    possibleLimitation: "Balanced scores do not guarantee success — external disruptions may require plan adjustment mid-cycle.",
    nextReviewPoint: "Re-assess at the end of the 7-day plan to confirm continued balance before the next cycle.",
  }),

  E: (s: ScoreResult): Recommendation => ({
    pattern: "E",
    title: "Pause major decisions — seek appropriate support",
    rationale:
      "One or more domains show high-risk signals. Making significant commitments or major decisions under this level of strain carries elevated risk of poor outcomes.",
    priority: "Pause major decisions and focus on stabilising the highest-risk domain.",
    nextAction:
      "Speak with a trusted person (coach, mentor, or professional) about the primary pressure you are experiencing.",
    sevenDayPlan: [
      "Day 1: Acknowledge the current state — write down what feels most overwhelming.",
      "Day 2: Identify one person you trust to talk to this week.",
      "Day 3: Have that conversation. You do not need to have answers — listening is the goal.",
      "Day 4: Take one action to reduce the most concrete pressure (delegate, defer, say no).",
      "Day 5: Protect sleep and physical recovery — no major work decisions.",
      "Day 6: Do one thing that restores a sense of agency, however small.",
      "Day 7: Reassess. Consider re-taking this assessment next week.",
    ],
    whyText: `At least one domain has scored below 35/100: Mind ${s.rawMind}/100, Goal ${s.rawGoal}/100, Capacity ${s.rawCapacity}/100. ` +
      `This pattern indicates high risk. The system recommends pausing major decisions until conditions improve. ` +
      `This is decision support — it is not a diagnosis. Please speak with a qualified human if you are struggling.`,
    influencingFactors: [
      `Risk Level: ${s.riskLevel}`,
      `Lowest domain score: ${Math.min(s.rawMind, s.rawGoal, s.rawCapacity)}/100`,
      `Decision Readiness: ${s.decisionReadiness}/100`,
    ],
    missingInformation: [
      "Nature and duration of the high-risk signals (not assessed in detail)",
      "Available support network (not assessed)",
      "Professional assessment may be warranted",
    ],
    reason: "At least one domain is critically low — major decisions under high-risk signals have elevated failure probability.",
    expectedBenefit: "Reduced risk of poor outcomes; stabilisation of the highest-risk domain within 7–14 days.",
    possibleLimitation: "External circumstances may prevent full pause of decisions; apply the recommendation proportionally.",
    nextReviewPoint: "Re-assess after 7 days, or when the primary stressor has reduced. Seek professional support if signals persist.",
  }),
};
