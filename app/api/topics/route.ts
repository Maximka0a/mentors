import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { statusForRating } from "@/lib/scheduler";
import { topicOf } from "@/lib/topics";
import type { TopicSummary } from "@/app/types";

export async function GET() {
  const packs = await prisma.pack.findMany({
    orderBy: { order: "asc" },
    include: {
      categories: {
        orderBy: { order: "asc" },
        select: {
          name: true,
          questions: { select: { review: { select: { lastRating: true, dueDate: true } } } },
        },
      },
    },
  });

  const now = Date.now();
  return NextResponse.json(
    packs.map((p) => {
      const topics = new Map<string, TopicSummary>();
      for (const c of p.categories) {
        const name = topicOf(c.name);
        const t = topics.get(name) ?? { name, total: 0, green: 0, yellow: 0, red: 0, fresh: 0, due: 0 };
        for (const q of c.questions) {
          t.total++;
          const status = q.review ? statusForRating(q.review.lastRating) : "new";
          if (status === "mastered") t.green++;
          else if (status === "good") t.yellow++;
          else if (status === "weak") t.red++;
          else t.fresh++;
          if (q.review && q.review.dueDate.getTime() <= now) t.due++;
        }
        topics.set(name, t);
      }
      return { slug: p.slug, name: p.name, enabled: p.enabled, topics: [...topics.values()] };
    })
  );
}
