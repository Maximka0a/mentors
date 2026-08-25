import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { schedule } from "@/lib/scheduler";

export async function POST(req: NextRequest) {
  const { questionId, rating } = await req.json();

  if (typeof questionId !== "string" || typeof rating !== "number" || rating < 0 || rating > 10) {
    return NextResponse.json({ error: "invalid input" }, { status: 400 });
  }

  const review = await prisma.reviewState.findUnique({ where: { questionId } });
  if (!review) {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }

  const result = schedule({
    rating,
    easeFactor: review.easeFactor,
    interval: review.interval,
    repetitions: review.repetitions,
  });

  const updated = await prisma.reviewState.update({
    where: { questionId },
    data: {
      lastRating: rating,
      status: result.status,
      easeFactor: result.easeFactor,
      interval: result.interval,
      repetitions: result.repetitions,
      dueDate: result.dueDate,
    },
  });

  return NextResponse.json(updated);
}
