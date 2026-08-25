import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const maxDuration = 60;
export const runtime = "nodejs";

const MODEL = "gemini-2.0-flash";

export async function POST(req: NextRequest) {
  const { questionId, userAnswer } = await req.json();

  if (typeof questionId !== "string" || typeof userAnswer !== "string" || !userAnswer.trim()) {
    return NextResponse.json({ error: "invalid input" }, { status: 400 });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "GEMINI_API_KEY не настроен" }, { status: 500 });
  }

  const question = await prisma.question.findUnique({ where: { id: questionId } });
  if (!question) {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }

  const prompt = `Ты — строгий, но справедливый технический интервьюер. Оцени ответ кандидата на вопрос собеседования по шкале от 0 до 10, где 10 — идеальный, исчерпывающий ответ, 0 — ответ отсутствует или полностью неверный.

Вопрос: ${question.question}

Эталонный ответ: ${question.answer}

Ответ кандидата: ${userAnswer}

Верни ТОЛЬКО JSON без markdown-обрамления в формате:
{"score": <целое число 0-10>, "feedback": "<краткий комментарий на русском, 1-2 предложения: что верно, чего не хватает>"}`;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 25000);

  let res: Response;
  try {
    res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-goog-api-key": apiKey,
        },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { responseMimeType: "application/json" },
        }),
        signal: controller.signal,
      }
    );
  } catch (e) {
    const message = e instanceof Error ? `${e.name}: ${e.message}` : String(e);
    console.error("gemini fetch failed", message);
    return NextResponse.json({ error: "gemini fetch failed", details: message }, { status: 502 });
  } finally {
    clearTimeout(timeout);
  }

  if (!res.ok) {
    const text = await res.text();
    console.error("gemini request failed", res.status, text);
    return NextResponse.json({ error: "gemini request failed", details: text }, { status: 502 });
  }

  const data = await res.json();
  const raw: string | undefined = data?.candidates?.[0]?.content?.parts?.[0]?.text;

  if (!raw) {
    return NextResponse.json({ error: "empty gemini response" }, { status: 502 });
  }

  let parsed: { score: number; feedback: string };
  try {
    parsed = JSON.parse(raw);
  } catch {
    return NextResponse.json({ error: "bad gemini response" }, { status: 502 });
  }

  const score = Math.max(0, Math.min(10, Math.round(Number(parsed.score))));

  return NextResponse.json({ score, feedback: parsed.feedback ?? "" });
}
