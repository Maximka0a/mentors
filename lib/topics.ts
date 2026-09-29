import type { Prisma } from "@prisma/client";

// Base-pack categories are named "Topic > Subtopic"; extended-pack categories are the topic itself
export function topicOf(categoryName: string): string {
  const i = categoryName.indexOf(" > ");
  return i === -1 ? categoryName : categoryName.slice(0, i);
}

export function subtopicOf(categoryName: string): string | null {
  const i = categoryName.indexOf(" > ");
  return i === -1 ? null : categoryName.slice(i + 3);
}

export function categoryFilter(opts: { pack?: string | null; topic?: string | null }): Prisma.CategoryWhereInput {
  const where: Prisma.CategoryWhereInput = opts.pack ? { pack: { slug: opts.pack } } : { pack: { enabled: true } };
  if (opts.topic) {
    where.OR = [{ name: opts.topic }, { name: { startsWith: `${opts.topic} > ` } }];
  }
  return where;
}
