import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { categoryFilter } from "@/lib/topics";

export async function GET(req: NextRequest) {
  const params = req.nextUrl.searchParams;

  const questions = await prisma.question.findMany({
    where: {
      review: { dueDate: { lte: new Date() } },
      category: categoryFilter({ pack: params.get("pack"), topic: params.get("topic") }),
    },
    include: { review: true, category: { include: { pack: true } } },
    orderBy: [{ review: { dueDate: "asc" } }],
    take: 50,
  });

  return NextResponse.json(
    questions.map((q) => ({
      id: q.id,
      question: q.question,
      answer: q.answer,
      category: q.category.name,
      pack: q.category.pack.name,
      difficulty: q.difficulty,
      lastRating: q.review?.lastRating ?? null,
    }))
  );
}
