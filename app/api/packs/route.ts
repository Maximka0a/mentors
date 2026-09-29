import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const packs = await prisma.pack.findMany({
    orderBy: { order: "asc" },
    include: { categories: { select: { _count: { select: { questions: true } } } } },
  });
  return NextResponse.json(
    packs.map((p) => ({
      id: p.id,
      slug: p.slug,
      name: p.name,
      enabled: p.enabled,
      count: p.categories.reduce((sum, c) => sum + c._count.questions, 0),
    }))
  );
}

export async function PATCH(req: NextRequest) {
  const body = await req.json().catch(() => null);
  if (typeof body?.slug !== "string" || typeof body?.enabled !== "boolean") {
    return NextResponse.json({ error: "invalid_input" }, { status: 400 });
  }
  const pack = await prisma.pack.update({ where: { slug: body.slug }, data: { enabled: body.enabled } });
  return NextResponse.json(pack);
}
