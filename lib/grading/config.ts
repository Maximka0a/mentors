export type Verdict = "green" | "yellow" | "red";

export const GRADING_CONFIG = {
  // overall = sum(score * weight); weights must sum to 1
  weights: {
    completeness: 0.45,
    correctness: 0.4,
    format: 0.15,
  },
  // overall >= green -> 🟢, overall >= yellow -> 🟡, otherwise 🔴
  thresholds: {
    green: 80,
    yellow: 55,
  },
  // A single factual error caps the verdict: an answer with wrong facts can't be 🟢
  maxVerdictWithFactualErrors: "yellow" as Verdict,
  requestTimeoutMs: 25_000,
  retries: 1,
  temperature: 0.2,
  // Used only if model discovery via models.list fails and GEMINI_MODEL is unset
  fallbackModel: "gemini-3.6-flash",
  modelCacheTtlMs: 60 * 60 * 1000,
} as const;

export const VERDICT_EMOJI: Record<Verdict, string> = {
  green: "🟢",
  yellow: "🟡",
  red: "🔴",
};

export function verdictForScore(score: number): Verdict {
  if (score >= GRADING_CONFIG.thresholds.green) return "green";
  if (score >= GRADING_CONFIG.thresholds.yellow) return "yellow";
  return "red";
}

export function computeOverall(scores: { completeness: number; correctness: number; format: number }): number {
  const w = GRADING_CONFIG.weights;
  return Math.round(scores.completeness * w.completeness + scores.correctness * w.correctness + scores.format * w.format);
}

export function applyVerdictCaps(verdict: Verdict, factualErrorCount: number): Verdict {
  if (factualErrorCount === 0) return verdict;
  const cap = GRADING_CONFIG.maxVerdictWithFactualErrors;
  const rank: Record<Verdict, number> = { red: 0, yellow: 1, green: 2 };
  return rank[verdict] > rank[cap] ? cap : verdict;
}

// Scheduler works on a 0-10 rating; the AI score maps to it linearly.
export function ratingForScore(score: number): number {
  return Math.max(0, Math.min(10, Math.round(score / 10)));
}
