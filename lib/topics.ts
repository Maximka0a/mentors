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

// Packs are never mixed in one session; without an explicit pack we use the extended one
export const DEFAULT_PACK_SLUG = "extended";

export function categoryFilter(opts: { pack?: string | null; topic?: string | null }): Prisma.CategoryWhereInput {
  const where: Prisma.CategoryWhereInput = { pack: { slug: opts.pack || DEFAULT_PACK_SLUG } };
  if (opts.topic) {
    where.OR = [{ name: opts.topic }, { name: { startsWith: `${opts.topic} > ` } }];
  }
  return where;
}
