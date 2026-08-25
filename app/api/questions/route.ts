import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { statusForRating } from "@/lib/scheduler";

export async function GET() {
  const categories = await prisma.category.findMany({
    orderBy: { order: "asc" },
    include: {
      questions: {
        orderBy: { order: "asc" },
        include: { review: true },
      },
    },
  });

  const result = categories.map((c) => ({
    id: c.id,
    name: c.name,
    slug: c.slug,
    questions: c.questions.map((q) => ({
      id: q.id,
      question: q.question,
      answer: q.answer,
      status: q.review ? statusForRating(q.review.lastRating) : "new",
      lastRating: q.review?.lastRating ?? null,
      dueDate: q.review?.dueDate ?? null,
    })),
  }));

  return NextResponse.json(result);
}
