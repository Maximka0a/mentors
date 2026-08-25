import fs from "node:fs";
import path from "node:path";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

interface SeedQuestion {
  question: string;
  answer: string;
}

interface SeedCategory {
  name: string;
  declaredCount: number;
  questions: SeedQuestion[];
}

function slugify(name: string): string {
  return name
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^\w\s>-]/g, "")
    .trim()
    .replace(/\s*>\s*/g, "--")
    .replace(/\s+/g, "-");
}

async function main() {
  const dataPath = path.join(process.cwd(), "prisma", "seed-data.json");
  const categories: SeedCategory[] = JSON.parse(fs.readFileSync(dataPath, "utf-8"));

  let categoryOrder = 0;
  for (const cat of categories) {
    if (cat.questions.length === 0) continue;
    const slug = slugify(cat.name);

    const category = await prisma.category.upsert({
      where: { slug },
      update: { name: cat.name, order: categoryOrder },
      create: { name: cat.name, slug, order: categoryOrder },
    });
    categoryOrder += 1;

    let questionOrder = 0;
    for (const q of cat.questions) {
      const existing = await prisma.question.findFirst({
        where: { categoryId: category.id, order: questionOrder },
      });

      const question = existing
        ? await prisma.question.update({
            where: { id: existing.id },
            data: { question: q.question, answer: q.answer },
          })
        : await prisma.question.create({
            data: {
              categoryId: category.id,
              question: q.question,
              answer: q.answer,
              order: questionOrder,
            },
          });

      await prisma.reviewState.upsert({
        where: { questionId: question.id },
        update: {},
        create: { questionId: question.id },
      });

      questionOrder += 1;
    }
  }

  const total = await prisma.question.count();
  console.log(`Seed complete. ${total} questions in DB.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
