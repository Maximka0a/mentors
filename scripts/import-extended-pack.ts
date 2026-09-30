/**
 * Imports the "100 вопросов — расширенный банк" pack.
 *
 *   npx tsx scripts/import-extended-pack.ts            # parse + report only
 *   npx tsx scripts/import-extended-pack.ts --write    # also upsert into the DB
 *
 * Idempotent: question ids are deterministic (ext-<topic>-NN), so re-running updates
 * texts/key points without touching review progress.
 */
import fs from "node:fs";
import path from "node:path";
import { ANNOTATIONS } from "./data/extended-annotations";
import { createScriptClient } from "./db";

const SOURCE = path.join(process.cwd(), "scripts", "data", "extended-100.txt");
const PACK = { slug: "extended", name: "Топ-100 — расширенный банк", order: 1 };

const TOPICS: { name: string; slug: string }[] = [
  { name: "Android", slug: "android" },
  { name: "Jetpack", slug: "jetpack" },
  { name: "Compose", slug: "compose" },
  { name: "Kotlin", slug: "kotlin" },
  { name: "Collections", slug: "collections" },
  { name: "Coroutines", slug: "coroutines" },
  { name: "Java", slug: "java" },
  { name: "Многопоточность", slug: "concurrency" },
  { name: "Архитектура", slug: "architecture" },
  { name: "Алгоритмы", slug: "algorithms" },
];

interface ParsedQuestion {
  id: string;
  topic: string;
  question: string;
  answer: string;
}

function parse(text: string): ParsedQuestion[] {
  const out: ParsedQuestion[] = [];
  const counters = new Map<string, number>();
  let topic: (typeof TOPICS)[number] | null = null;
  let current: ParsedQuestion | null = null;
  const answerLines: string[] = [];

  const flush = () => {
    if (current) {
      current.answer = answerLines.join("\n").trim();
      out.push(current);
    }
    current = null;
    answerLines.length = 0;
  };

  for (const raw of text.split(/\r?\n/)) {
    const line = raw.trim();
    if (!line) continue;

    const header = TOPICS.find((t) => t.name === line);
    if (header) {
      flush();
      topic = header;
      continue;
    }
    if (!topic) throw new Error(`Line before first topic header: "${line}"`);

    if (line.endsWith("?")) {
      flush();
      const n = (counters.get(topic.slug) ?? 0) + 1;
      counters.set(topic.slug, n);
      current = { id: `ext-${topic.slug}-${String(n).padStart(2, "0")}`, topic: topic.name, question: line, answer: "" };
      continue;
    }

    if (!current) throw new Error(`Answer line without a question: "${line}"`);
    // "• item" bullets become markdown list items
    answerLines.push(line.replace(/^[•·●]\s*/, "- "));
  }
  flush();
  return out;
}

function report(questions: ParsedQuestion[]) {
  console.log(`Parsed ${questions.length} questions\n`);
  const byTopic = new Map<string, ParsedQuestion[]>();
  for (const q of questions) byTopic.set(q.topic, [...(byTopic.get(q.topic) ?? []), q]);

  console.log("topic".padEnd(18), "count  junior  junior+  middle");
  for (const t of TOPICS) {
    const qs = byTopic.get(t.name) ?? [];
    const count = (d: string) => qs.filter((q) => ANNOTATIONS[q.id]?.difficulty === d).length;
    console.log(t.name.padEnd(18), String(qs.length).padEnd(6), String(count("junior")).padEnd(7), String(count("junior+")).padEnd(8), count("middle"));
  }

  const missing = questions.filter((q) => !ANNOTATIONS[q.id]);
  const orphan = Object.keys(ANNOTATIONS).filter((id) => !questions.some((q) => q.id === id));
  const badPoints = questions.filter((q) => {
    const n = ANNOTATIONS[q.id]?.keyPoints.length ?? 0;
    return n < 2 || n > 5;
  });
  const emptyAnswers = questions.filter((q) => !q.answer);
  if (missing.length) console.log("\nNO ANNOTATION:", missing.map((q) => q.id).join(", "));
  if (orphan.length) console.log("\nORPHAN ANNOTATIONS:", orphan.join(", "));
  if (badPoints.length) console.log("\nKEY POINTS NOT 2-5:", badPoints.map((q) => q.id).join(", "));
  if (emptyAnswers.length) console.log("\nEMPTY ANSWERS:", emptyAnswers.map((q) => q.id).join(", "));

  return missing.length === 0 && orphan.length === 0 && badPoints.length === 0 && emptyAnswers.length === 0;
}

async function write(questions: ParsedQuestion[]) {
  const prisma = createScriptClient();
  try {
    const pack = await prisma.pack.upsert({
      where: { slug: PACK.slug },
      update: { name: PACK.name, order: PACK.order },
      create: PACK,
    });

    for (const [i, t] of TOPICS.entries()) {
      const category = await prisma.category.upsert({
        where: { slug: `ext-${t.slug}` },
        update: { name: t.name, order: 1000 + i, packId: pack.id },
        create: { slug: `ext-${t.slug}`, name: t.name, order: 1000 + i, packId: pack.id },
      });

      const topicQuestions = questions.filter((q) => q.topic === t.name);
      await prisma.$transaction(
        topicQuestions.flatMap((q, order) => {
          const meta = ANNOTATIONS[q.id];
          const data = {
            question: q.question,
            answer: q.answer,
            order,
            difficulty: meta.difficulty,
            keyPoints: meta.keyPoints,
            categoryId: category.id,
          };
          return [
            prisma.question.upsert({ where: { id: q.id }, update: data, create: { id: q.id, ...data } }),
            prisma.reviewState.upsert({ where: { questionId: q.id }, update: {}, create: { questionId: q.id } }),
          ];
        })
      );
      console.log(`  ${t.name}: ${topicQuestions.length}`);
    }
    console.log(`\nWrote pack "${PACK.name}"`);
  } finally {
    await prisma.$disconnect();
  }
}

async function main() {
  const questions = parse(fs.readFileSync(SOURCE, "utf-8"));
  const ok = report(questions);
  if (!ok) {
    console.error("\nValidation failed, nothing written.");
    process.exit(1);
  }
  if (process.argv.includes("--write")) await write(questions);
  else console.log("\nDry run. Pass --write to import.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
