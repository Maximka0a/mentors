import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { gradeAnswer } from "@/lib/grading/grade";
import { GeminiError } from "@/lib/grading/gemini";
import { ratingForScore } from "@/lib/grading/config";

export const maxDuration = 60;

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const { questionId, userAnswer, inputMode = "text", mode = "study", sessionId = null } = body ?? {};

  if (typeof questionId !== "string" || typeof userAnswer !== "string" || !userAnswer.trim()) {
    return NextResponse.json({ error: "invalid_input", message: "Пустой ответ" }, { status: 400 });
  }

  const question = await prisma.question.findUnique({ where: { id: questionId } });
  if (!question) {
    return NextResponse.json({ error: "not_found", message: "Вопрос не найден" }, { status: 404 });
  }

  try {
    const result = await gradeAnswer({
      question: question.question,
      referenceAnswer: question.answer,
      keyPoints: question.keyPoints,
      userAnswer: userAnswer.slice(0, 8000),
    });

    const attempt = await prisma.gradeAttempt.create({
      data: {
        questionId,
        userAnswer,
        inputMode: inputMode === "voice" ? "voice" : "text",
        mode: mode === "mock" ? "mock" : "study",
        sessionId: typeof sessionId === "string" ? sessionId : null,
        completenessScore: result.completenessScore,
        correctnessScore: result.correctnessScore,
        formatScore: result.formatScore,
        overallScore: result.overallScore,
        modelOverall: result.modelOverall,
        verdict: result.verdict,
        missedPoints: result.missedPoints,
        factualErrors: result.factualErrors as unknown as object,
        rewordedReference: result.rewordedReference,
        feedback: result.feedback,
        model: result.model,
      },
    });

    return NextResponse.json({ attemptId: attempt.id, suggestedRating: ratingForScore(result.overallScore), ...result });
  } catch (e) {
    if (e instanceof GeminiError) {
      console.error("grading failed", e.code, e.message, e.details?.slice(0, 1000));
      const status = e.code === "rate_limit" ? 429 : e.code === "timeout" ? 504 : 502;
      return NextResponse.json({ error: e.code, message: e.message }, { status });
    }
    console.error("grading failed", e);
    return NextResponse.json({ error: "internal", message: "Не удалось оценить ответ" }, { status: 500 });
  }
}
