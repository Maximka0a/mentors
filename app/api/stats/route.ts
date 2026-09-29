import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { topicOf } from "@/lib/topics";

export async function GET(req: NextRequest) {
  const days = Math.max(1, Math.min(365, Number(req.nextUrl.searchParams.get("days")) || 30));
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

  const attempts = await prisma.gradeAttempt.findMany({
    where: { createdAt: { gte: since } },
    select: {
      overallScore: true,
      completenessScore: true,
      correctnessScore: true,
      formatScore: true,
      verdict: true,
      mode: true,
      createdAt: true,
      question: { select: { category: { select: { name: true, pack: { select: { name: true, slug: true } } } } } },
    },
    orderBy: { createdAt: "asc" },
  });

  type Acc = { pack: string; packSlug: string; topic: string; n: number; overall: number; completeness: number; correctness: number; format: number; red: number };
  const topics = new Map<string, Acc>();
  const daily = new Map<string, { n: number; overall: number }>();

  for (const a of attempts) {
    const pack = a.question.category.pack.name;
    const packSlug = a.question.category.pack.slug;
    const topic = topicOf(a.question.category.name);
    const key = `${packSlug}::${topic}`;
    const t = topics.get(key) ?? { pack, packSlug, topic, n: 0, overall: 0, completeness: 0, correctness: 0, format: 0, red: 0 };
    t.n++;
    t.overall += a.overallScore;
    t.completeness += a.completenessScore;
    t.correctness += a.correctnessScore;
    t.format += a.formatScore;
    if (a.verdict === "red") t.red++;
    topics.set(key, t);

    const day = a.createdAt.toISOString().slice(0, 10);
    const d = daily.get(day) ?? { n: 0, overall: 0 };
    d.n++;
    d.overall += a.overallScore;
    daily.set(day, d);
  }

  const avg = (sum: number, n: number) => (n ? Math.round(sum / n) : 0);
  const byTopic = [...topics.values()]
    .map((t) => ({
      pack: t.pack,
      packSlug: t.packSlug,
      topic: t.topic,
      attempts: t.n,
      avgOverall: avg(t.overall, t.n),
      avgCompleteness: avg(t.completeness, t.n),
      avgCorrectness: avg(t.correctness, t.n),
      avgFormat: avg(t.format, t.n),
      redShare: t.n ? Math.round((t.red / t.n) * 100) : 0,
    }))
    .sort((a, b) => a.avgOverall - b.avgOverall);

  const total = attempts.length;
  return NextResponse.json({
    days,
    totals: {
      attempts: total,
      mockAttempts: attempts.filter((a) => a.mode === "mock").length,
      avgOverall: avg(attempts.reduce((s, a) => s + a.overallScore, 0), total),
      avgCompleteness: avg(attempts.reduce((s, a) => s + a.completenessScore, 0), total),
      avgCorrectness: avg(attempts.reduce((s, a) => s + a.correctnessScore, 0), total),
      avgFormat: avg(attempts.reduce((s, a) => s + a.formatScore, 0), total),
    },
    byTopic,
    daily: [...daily.entries()].map(([day, d]) => ({ day, attempts: d.n, avgOverall: avg(d.overall, d.n) })),
  });
}
