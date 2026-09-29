import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { categoryFilter } from "@/lib/topics";

export async function GET(req: NextRequest) {
  const params = req.nextUrl.searchParams;
  const n = Math.max(1, Math.min(20, Number(params.get("n")) || 10));

  const pool = await prisma.question.findMany({
    where: { category: categoryFilter({ pack: params.get("pack"), topic: params.get("topic") }) },
    select: { id: true },
  });

  // Fisher–Yates on ids, then load only the picked questions
  const ids = pool.map((q) => q.id);
  for (let i = ids.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [ids[i], ids[j]] = [ids[j], ids[i]];
  }
  const picked = ids.slice(0, n);

  const questions = await prisma.question.findMany({
    where: { id: { in: picked } },
    include: { category: { include: { pack: true } } },
  });
  const byId = new Map(questions.map((q) => [q.id, q]));

  return NextResponse.json(
    picked.map((id) => {
      const q = byId.get(id)!;
      return {
        id: q.id,
        question: q.question,
        answer: q.answer,
        category: q.category.name,
        pack: q.category.pack.name,
        difficulty: q.difficulty,
        lastRating: null,
      };
    })
  );
}
