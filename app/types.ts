export type QuestionStatus = "new" | "weak" | "good" | "mastered";
export type Verdict = "green" | "yellow" | "red";

export interface QuestionDTO {
  id: string;
  question: string;
  answer: string;
  subtopic: string | null;
  difficulty: string | null;
  keyPoints: string[];
  status: QuestionStatus;
  lastRating: number | null;
  dueDate: string | null;
}

export interface TopicSummary {
  name: string;
  total: number;
  green: number;
  yellow: number;
  red: number;
  fresh: number;
  due: number;
}

export interface PackTopics {
  slug: string;
  name: string;
  enabled: boolean;
  topics: TopicSummary[];
}

export interface StudyQuestion {
  id: string;
  question: string;
  answer: string;
  category: string;
  pack: string;
  difficulty: string | null;
  lastRating: number | null;
}

export interface FactualError {
  claim: string;
  explanation: string;
}

export interface PointCheck {
  point: string;
  status: "covered" | "partial" | "missed";
  evidence: string;
}

export interface GradeResponse {
  attemptId: string;
  suggestedRating: number;
  completenessScore: number;
  correctnessScore: number;
  formatScore: number;
  overallScore: number;
  modelOverall: number;
  verdict: Verdict;
  missedPoints: string[];
  factualErrors: FactualError[];
  pointChecks: PointCheck[];
  rewordedReference: boolean;
  feedback: string;
  model: string;
}

export const STATUS_DOT: Record<QuestionStatus, string> = {
  new: "bg-status-new",
  weak: "bg-status-red",
  good: "bg-status-yellow",
  mastered: "bg-status-green",
};

export const VERDICT_LABEL: Record<Verdict, string> = {
  green: "🟢 Уверенно",
  yellow: "🟡 Есть пробелы",
  red: "🔴 Слабо",
};
