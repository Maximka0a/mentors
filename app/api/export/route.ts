import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { topicOf } from "@/lib/topics";

function csvCell(value: unknown): string {
  const s = value === null || value === undefined ? "" : String(value);
  return /[",\n;]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

export async function GET(req: NextRequest) {
  const format = req.nextUrl.searchParams.get("format") === "json" ? "json" : "csv";

  const attempts = await prisma.gradeAttempt.findMany({
    orderBy: { createdAt: "asc" },
    include: { question: { include: { category: { include: { pack: true } } } } },
  });

  const rows = attempts.map((a) => ({
    date: a.createdAt.toISOString(),
    pack: a.question.category.pack.name,
    topic: topicOf(a.question.category.name),
    category: a.question.category.name,
    question: a.question.question,
    difficulty: a.question.difficulty,
    mode: a.mode,
    inputMode: a.inputMode,
    answer: a.userAnswer,
    overall: a.overallScore,
    completeness: a.completenessScore,
    correctness: a.correctnessScore,
    format: a.formatScore,
    verdict: a.verdict,
    missedPoints: a.missedPoints,
    factualErrors: a.factualErrors,
    rewordedReference: a.rewordedReference,
    feedback: a.feedback,
    model: a.model,
  }));

  const stamp = new Date().toISOString().slice(0, 10);

  if (format === "json") {
    const reviews = await prisma.reviewState.findMany({
      where: { lastRating: { not: null } },
      include: { question: { include: { category: { include: { pack: true } } } } },
    });
    const body = JSON.stringify(
      {
        exportedAt: new Date().toISOString(),
        attempts: rows,
        reviews: reviews.map((r) => ({
          pack: r.question.category.pack.name,
          category: r.question.category.name,
          question: r.question.question,
          lastRating: r.lastRating,
          intervalDays: r.interval,
          dueDate: r.dueDate.toISOString(),
        })),
      },
      null,
      2
    );
    return new Response(body, {
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        "Content-Disposition": `attachment; filename="mentors-history-${stamp}.json"`,
      },
    });
  }

  const header = ["date", "pack", "topic", "category", "question", "difficulty", "mode", "inputMode", "answer", "overall", "completeness", "correctness", "format", "verdict", "missedPoints", "factualErrors", "feedback", "model"];
  const lines = rows.map((r) =>
    [
      r.date, r.pack, r.topic, r.category, r.question, r.difficulty, r.mode, r.inputMode, r.answer,
      r.overall, r.completeness, r.correctness, r.format, r.verdict,
      r.missedPoints.join(" | "),
      (r.factualErrors as { claim?: string; explanation?: string }[]).map((e) => `${e.claim} → ${e.explanation}`).join(" | "),
      r.feedback, r.model,
    ].map(csvCell).join(",")
  );
  // BOM so Excel opens Cyrillic correctly
  const body = "﻿" + [header.join(","), ...lines].join("\n");
  return new Response(body, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="mentors-history-${stamp}.csv"`,
    },
  });
}
