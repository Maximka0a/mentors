import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const categorySlug = req.nextUrl.searchParams.get("category");

  const questions = await prisma.question.findMany({
    where: {
      review: { dueDate: { lte: new Date() } },
      ...(categorySlug ? { category: { slug: categorySlug } } : {}),
    },
    include: { review: true, category: true },
    orderBy: [{ review: { dueDate: "asc" } }],
    take: 50,
  });

  return NextResponse.json(
    questions.map((q) => ({
      id: q.id,
      question: q.question,
      answer: q.answer,
      category: q.category.name,
      lastRating: q.review?.lastRating ?? null,
    }))
  );
}
