import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { statusForRating } from "@/lib/scheduler";
import { categoryFilter, subtopicOf } from "@/lib/topics";

export async function GET(req: NextRequest) {
  const params = req.nextUrl.searchParams;
  const pack = params.get("pack");
  const topic = params.get("topic");
  if (!pack || !topic) {
    return NextResponse.json({ error: "pack and topic are required" }, { status: 400 });
  }

  const questions = await prisma.question.findMany({
    where: { category: categoryFilter({ pack, topic }) },
    orderBy: [{ category: { order: "asc" } }, { order: "asc" }],
    include: { review: true, category: true },
  });

  return NextResponse.json(
    questions.map((q) => ({
      id: q.id,
      question: q.question,
      answer: q.answer,
      subtopic: subtopicOf(q.category.name),
      difficulty: q.difficulty,
      keyPoints: q.keyPoints,
      status: q.review ? statusForRating(q.review.lastRating) : "new",
      lastRating: q.review?.lastRating ?? null,
      dueDate: q.review?.dueDate ?? null,
    }))
  );
}
