/**
 * Sets the initial review state for "Топ-100" questions from scripts/data/progress-import.ts.
 *
 *   npx tsx --env-file=.env scripts/import-progress.ts            # dry run
 *   npx tsx --env-file=.env scripts/import-progress.ts --write
 *
 * Only listed questions are touched. The state is computed from scheduler defaults, so
 * re-running gives the same result instead of stacking reviews.
 */
import { schedule } from "../lib/scheduler";
import { PROGRESS, UNMATCHED, type ImportStatus } from "./data/progress-import";
import { createScriptClient } from "./db";

// Same ratings as the manual 🔴/🟡/🟢 buttons
const RATING: Record<ImportStatus, number> = { red: 3, yellow: 6, green: 9 };

async function main() {
  const write = process.argv.includes("--write");
  const prisma = createScriptClient();
  try {
    const questions = await prisma.question.findMany({
      where: { id: { in: PROGRESS.map((p) => p.id) } },
      select: { id: true, question: true },
    });
    const byId = new Map(questions.map((q) => [q.id, q.question]));

    const missing = PROGRESS.filter((p) => !byId.has(p.id));
    if (missing.length) throw new Error(`Unknown question ids: ${missing.map((m) => m.id).join(", ")}`);

    for (const p of PROGRESS) {
      console.log(`${p.status.padEnd(6)} ${p.id.padEnd(22)} ${p.topic}  →  ${byId.get(p.id)}`);
    }
    const counts = PROGRESS.reduce<Record<string, number>>((acc, p) => ({ ...acc, [p.status]: (acc[p.status] ?? 0) + 1 }), {});
    console.log(`\n${PROGRESS.length} questions: green ${counts.green ?? 0}, yellow ${counts.yellow ?? 0}, red ${counts.red ?? 0}`);
    console.log(`Not in bank, skipped: ${UNMATCHED.join("; ")}`);

    if (!write) {
      console.log("\nDry run. Pass --write to apply.");
      return;
    }

    await prisma.$transaction(
      PROGRESS.map((p) => {
        const rating = RATING[p.status];
        const next = schedule({ rating, easeFactor: 2.5, interval: 0, repetitions: 0 });
        return prisma.reviewState.update({
          where: { questionId: p.id },
          data: {
            lastRating: rating,
            status: next.status,
            easeFactor: next.easeFactor,
            interval: next.interval,
            repetitions: next.repetitions,
            dueDate: next.dueDate,
          },
        });
      })
    );
    console.log("\nApplied.");
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
