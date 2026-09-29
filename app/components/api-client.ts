import type { GradeResponse } from "../types";

async function request<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, init);
  const data = await res.json().catch(() => null);
  if (!res.ok) throw new Error(data?.message ?? "Ошибка сервера");
  return data as T;
}

export function getJson<T>(url: string): Promise<T> {
  return request<T>(url);
}

export function gradeAnswer(input: {
  questionId: string;
  userAnswer: string;
  inputMode: "text" | "voice";
  mode?: "study" | "mock";
  sessionId?: string;
}): Promise<GradeResponse> {
  return request<GradeResponse>("/api/grade", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
}

export function submitReview(questionId: string, rating: number): Promise<unknown> {
  return request("/api/review", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ questionId, rating }),
  });
}
