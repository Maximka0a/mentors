import type { GradeResponse } from "../types";

export interface GradingJob {
  index: number;
  run: () => Promise<GradeResponse>;
}

/**
 * Grades answers in the background with limited concurrency, so the interview keeps going
 * while earlier answers are evaluated. Rate-limit errors are retried after a pause.
 */
export function createGradingRunner(opts: {
  concurrency: number;
  rateLimitRetries: number;
  rateLimitDelayMs: number;
  onResult: (index: number, result: { grade: GradeResponse } | { error: string }) => void;
}) {
  const queue: GradingJob[] = [];
  let active = 0;

  async function execute(job: GradingJob) {
    for (let attempt = 0; ; attempt++) {
      try {
        opts.onResult(job.index, { grade: await job.run() });
        return;
      } catch (e) {
        const message = e instanceof Error ? e.message : "Ошибка оценки";
        if (message.includes("лимит") && attempt < opts.rateLimitRetries) {
          await new Promise((res) => setTimeout(res, opts.rateLimitDelayMs));
          continue;
        }
        opts.onResult(job.index, { error: message });
        return;
      }
    }
  }

  function pump() {
    while (active < opts.concurrency && queue.length > 0) {
      const job = queue.shift()!;
      active++;
      execute(job).finally(() => {
        active--;
        pump();
      });
    }
  }

  return {
    enqueue(job: GradingJob) {
      queue.push(job);
      pump();
    },
  };
}
