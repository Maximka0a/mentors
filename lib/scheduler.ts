export type ReviewStatus = "new" | "weak" | "good" | "mastered";

export interface SchedulerInput {
  rating: number; // 0-10
  easeFactor: number;
  interval: number; // days
  repetitions: number;
}

export interface SchedulerResult {
  status: ReviewStatus;
  easeFactor: number;
  interval: number;
  repetitions: number;
  dueDate: Date;
}

export function statusForRating(rating: number | null): ReviewStatus {
  if (rating === null) return "new";
  if (rating <= 5) return "weak";
  if (rating <= 9) return "good";
  return "mastered";
}

/**
 * SM-2 adapted to a 0-10 self-rating scale (0-5 = fail/weak, 6-9 = good, 10 = mastered).
 */
export function schedule({ rating, easeFactor, interval, repetitions }: SchedulerInput): SchedulerResult {
  const status = statusForRating(rating);
  const quality = rating / 2; // map 0-10 -> 0-5 for the classic SM-2 formula

  let nextEase = easeFactor + (0.1 - (10 - rating) * (0.08 + (10 - rating) * 0.02)) * 0.5;
  if (nextEase < 1.3) nextEase = 1.3;

  let nextRepetitions: number;
  let nextInterval: number;

  if (quality < 3) {
    nextRepetitions = 0;
    nextInterval = 1;
  } else {
    nextRepetitions = repetitions + 1;
    if (nextRepetitions === 1) nextInterval = 1;
    else if (nextRepetitions === 2) nextInterval = 6;
    else nextInterval = Math.round(interval * nextEase);
  }

  if (status === "mastered") {
    nextInterval = Math.max(nextInterval, 30);
  }

  const dueDate = new Date();
  dueDate.setDate(dueDate.getDate() + nextInterval);

  return {
    status,
    easeFactor: nextEase,
    interval: nextInterval,
    repetitions: nextRepetitions,
    dueDate,
  };
}
