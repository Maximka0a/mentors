import { applyVerdictCaps, computeOverall, verdictForScore, type Verdict } from "./config";
import { generateJson } from "./gemini";

export interface FactualError {
  claim: string;
  explanation: string;
}

export interface PointCheck {
  point: string;
  status: "covered" | "partial" | "missed";
  evidence: string;
}

interface ModelGrade {
  point_checks: PointCheck[];
  factual_errors: FactualError[];
  reworded_reference: boolean;
  completeness_score: number;
  correctness_score: number;
  format_score: number;
  overall_score: number;
  missed_points: string[];
  feedback: string;
}

export interface GradeResult {
  completenessScore: number;
  correctnessScore: number;
  formatScore: number;
  overallScore: number;
  modelOverall: number;
  verdict: Verdict;
  missedPoints: string[];
  factualErrors: FactualError[];
  pointChecks: PointCheck[];
  rewordedReference: boolean;
  feedback: string;
  model: string;
}

const SYSTEM_PROMPT = `Ты — строгий, но справедливый технический интервьюер на позицию Junior+ Android-разработчика (Kotlin, Android SDK, Jetpack, Compose, корутины, Java, многопоточность, архитектура).

Твоя задача — оценить устный или письменный ответ кандидата так, как это сделал бы опытный интервьюер: не занижать и не завышать. Решает построчная сверка с эталоном, а не общее впечатление «звучит похоже».

Порядок работы:
1. point_checks: пройди по КАЖДОМУ ключевому пункту (если пункты не даны — выдели 2–5 главных мыслей эталона сам) и отметь covered / partial / missed. В evidence процитируй или перескажи фразу кандидата, которая закрывает пункт; для missed оставь пустую строку. Засчитывай пункт, если мысль передана своими словами — дословность не нужна. Не засчитывай, если кандидат лишь назвал термин без объяснения, когда пункт требует объяснения.
2. factual_errors: только реальные фактические ошибки кандидата (неверное утверждение, перепутанные понятия, неверная сложность, неверный порядок вызовов). Для каждой — claim (что сказал кандидат) и explanation (как на самом деле). Неполнота — это не ошибка. Если эталон сам содержит неточность, а кандидат сказал верно по факту — это НЕ ошибка кандидата; ориентируйся на реальные факты.
3. reworded_reference: true, если ответ — почти дословный пересказ эталона (те же формулировки и порядок, без собственных примеров и связок), что похоже на заучивание без понимания.
4. Оценки 0–100:
   - completeness_score — доля закрытых ключевых пунктов (partial = половина).
   - correctness_score — 100, если ошибок нет; каждая существенная ошибка сильно снижает оценку; грубая ошибка в сути вопроса — ниже 50.
   - format_score — насколько ответ звучит как хороший ответ на собеседовании: сначала суть, затем детали/пример, чёткие формулировки, без «воды» и потока сознания. Если reworded_reference = true — не выше 60. Ответ может быть надиктован голосом: не снижай за опечатки, пунктуацию и транслитерацию терминов («вью модел» = ViewModel).
   - overall_score — твоя итоговая оценка 0–100.
5. missed_points — формулировки пунктов со статусом missed (и partial — с пометкой «частично: …»).
6. feedback — 1–3 предложения на русском: что сказать кандидату, чтобы следующий ответ был сильнее.

Пустой, бессмысленный или не относящийся к вопросу ответ — все оценки около 0.`;

const RESPONSE_SCHEMA = {
  type: "object",
  properties: {
    point_checks: {
      type: "array",
      items: {
        type: "object",
        properties: {
          point: { type: "string" },
          status: { type: "string", enum: ["covered", "partial", "missed"] },
          evidence: { type: "string" },
        },
        required: ["point", "status", "evidence"],
      },
    },
    factual_errors: {
      type: "array",
      items: {
        type: "object",
        properties: {
          claim: { type: "string" },
          explanation: { type: "string" },
        },
        required: ["claim", "explanation"],
      },
    },
    reworded_reference: { type: "boolean" },
    completeness_score: { type: "integer", minimum: 0, maximum: 100 },
    correctness_score: { type: "integer", minimum: 0, maximum: 100 },
    format_score: { type: "integer", minimum: 0, maximum: 100 },
    overall_score: { type: "integer", minimum: 0, maximum: 100 },
    missed_points: { type: "array", items: { type: "string" } },
    feedback: { type: "string" },
  },
  required: [
    "point_checks",
    "factual_errors",
    "reworded_reference",
    "completeness_score",
    "correctness_score",
    "format_score",
    "overall_score",
    "missed_points",
    "feedback",
  ],
};

function isScore(v: unknown): v is number {
  return typeof v === "number" && Number.isFinite(v);
}

function isModelGrade(v: unknown): v is ModelGrade {
  if (!v || typeof v !== "object") return false;
  const g = v as Record<string, unknown>;
  return (
    Array.isArray(g.point_checks) &&
    Array.isArray(g.factual_errors) &&
    Array.isArray(g.missed_points) &&
    typeof g.reworded_reference === "boolean" &&
    typeof g.feedback === "string" &&
    isScore(g.completeness_score) &&
    isScore(g.correctness_score) &&
    isScore(g.format_score) &&
    isScore(g.overall_score)
  );
}

const clamp = (n: number) => Math.max(0, Math.min(100, Math.round(n)));

export async function gradeAnswer(input: {
  question: string;
  referenceAnswer: string;
  keyPoints: string[];
  userAnswer: string;
}): Promise<GradeResult> {
  const keyPointsBlock = input.keyPoints.length
    ? input.keyPoints.map((p, i) => `${i + 1}. ${p}`).join("\n")
    : "(не заданы — выдели 2–5 главных мыслей эталона сам)";

  const prompt = `ВОПРОС:
${input.question}

ЭТАЛОННЫЙ ОТВЕТ:
${input.referenceAnswer}

КЛЮЧЕВЫЕ ПУНКТЫ (критерии полноты):
${keyPointsBlock}

ОТВЕТ КАНДИДАТА:
${input.userAnswer}`;

  const { value, model } = await generateJson({
    systemInstruction: SYSTEM_PROMPT,
    parts: [{ text: prompt }],
    schema: RESPONSE_SCHEMA,
    validate: isModelGrade,
  });

  const completenessScore = clamp(value.completeness_score);
  const correctnessScore = clamp(value.correctness_score);
  const formatScore = clamp(value.format_score);
  // The final score and verdict are computed here, from config, not taken from the model
  const overallScore = computeOverall({
    completeness: completenessScore,
    correctness: correctnessScore,
    format: formatScore,
  });
  const factualErrors = value.factual_errors.filter((e) => e && typeof e.claim === "string");
  const verdict = applyVerdictCaps(verdictForScore(overallScore), factualErrors.length);

  return {
    completenessScore,
    correctnessScore,
    formatScore,
    overallScore,
    modelOverall: clamp(value.overall_score),
    verdict,
    missedPoints: value.missed_points.filter((p) => typeof p === "string"),
    factualErrors,
    pointChecks: value.point_checks,
    rewordedReference: value.reworded_reference,
    feedback: value.feedback,
    model,
  };
}
