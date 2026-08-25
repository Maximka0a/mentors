export type QuestionStatus = "new" | "weak" | "good" | "mastered";

export interface QuestionDTO {
  id: string;
  question: string;
  answer: string;
  status: QuestionStatus;
  lastRating: number | null;
  dueDate: string | null;
}

export interface CategoryDTO {
  id: string;
  name: string;
  slug: string;
  questions: QuestionDTO[];
}

export const STATUS_COLOR: Record<QuestionStatus, string> = {
  new: "bg-white/30",
  weak: "bg-red-500",
  good: "bg-amber-400",
  mastered: "bg-emerald-400",
};
