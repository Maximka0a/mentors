"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import type { GradeResponse } from "../types";
import { AnswerInput } from "./answer-input";
import { GradeView } from "./grade-view";
import { Markdown } from "./markdown";
import { gradeAnswer, submitReview } from "./api-client";
import { verdictForScore } from "@/lib/grading/config";

export interface PracticeQuestion {
  id: string;
  question: string;
  answer: string;
  label?: string;
  difficulty?: string | null;
}

export type PracticeOutcome = "green" | "yellow" | "red" | "skipped";

// Manual self-assessment, mapped onto the 0-10 scheduler scale (same thresholds as the AI verdict)
const MANUAL = [
  { label: "🔴 Не знаю", rating: 3, outcome: "red" as const },
  { label: "🟡 Частично", rating: 6, outcome: "yellow" as const },
  { label: "🟢 Знаю", rating: 9, outcome: "green" as const },
];

function outcomeForRating(rating: number): PracticeOutcome {
  return verdictForScore(rating * 10);
}

export function PracticeCard({
  question,
  onDone,
  onSkip,
}: {
  question: PracticeQuestion;
  onDone: (outcome: PracticeOutcome) => void;
  onSkip?: () => void;
}) {
  const queryClient = useQueryClient();
  const [answer, setAnswer] = useState("");
  const [voiceUsed, setVoiceUsed] = useState(false);
  const [showReference, setShowReference] = useState(false);
  const [grade, setGrade] = useState<GradeResponse | null>(null);

  const gradeMutation = useMutation({
    mutationFn: () =>
      gradeAnswer({ questionId: question.id, userAnswer: answer, inputMode: voiceUsed ? "voice" : "text" }),
    onSuccess: (g) => {
      setGrade(g);
      setShowReference(true);
    },
  });

  const reviewMutation = useMutation({
    mutationFn: (rating: number) => submitReview(question.id, rating),
    onSuccess: (_r, rating) => {
      queryClient.invalidateQueries({ queryKey: ["topics"] });
      queryClient.invalidateQueries({ queryKey: ["topic-questions"] });
      onDone(outcomeForRating(rating));
    },
  });

  const busy = gradeMutation.isPending || reviewMutation.isPending;

  return (
    <div className="flex flex-col gap-5">
      <div>
        <div className="flex flex-wrap items-center gap-2 text-xs text-faint">
          {question.label && <span>{question.label}</span>}
          {question.difficulty && (
            <span className="rounded-md border border-line px-1.5 py-0.5 text-muted">{question.difficulty}</span>
          )}
        </div>
        <h2 className="mt-2 text-xl font-semibold leading-snug">{question.question}</h2>
      </div>

      {!grade && (
        <AnswerInput
          value={answer}
          onChange={setAnswer}
          onVoiceUsed={() => setVoiceUsed(true)}
          disabled={gradeMutation.isPending}
        />
      )}

      {!grade && (
        <div className="flex flex-col gap-2">
          <button
            onClick={() => gradeMutation.mutate()}
            disabled={!answer.trim() || busy}
            className="rounded-xl bg-accent text-accent-fg py-3 font-medium disabled:opacity-40 transition-opacity"
          >
            {gradeMutation.isPending ? "Интервьюер оценивает…" : "Проверить ответ"}
          </button>
          {gradeMutation.isError && (
            <p className="text-sm text-status-red">
              {gradeMutation.error.message}. Можно повторить или оценить себя вручную ниже.
            </p>
          )}
        </div>
      )}

      {grade && <GradeView grade={grade} />}

      <div className="rounded-xl border border-line bg-surface">
        <button
          onClick={() => setShowReference((v) => !v)}
          className="w-full flex items-center justify-between px-4 py-3 text-sm font-medium"
        >
          Эталонный ответ
          <span className="text-faint">{showReference ? "Скрыть" : "Показать"}</span>
        </button>
        {showReference && (
          <div className="border-t border-line px-4 py-3">
            <Markdown>{question.answer}</Markdown>
          </div>
        )}
      </div>

      <div className="flex flex-col gap-2">
        {grade && (
          <button
            onClick={() => reviewMutation.mutate(grade.suggestedRating)}
            disabled={busy}
            className="rounded-xl bg-accent text-accent-fg py-3 font-medium disabled:opacity-40"
          >
            Принять оценку и дальше
          </button>
        )}
        <div className="grid grid-cols-3 gap-2">
          {MANUAL.map((m) => (
            <button
              key={m.rating}
              onClick={() => reviewMutation.mutate(m.rating)}
              disabled={busy}
              className="rounded-xl border border-line bg-surface py-2.5 text-sm hover:bg-surface-2 disabled:opacity-40"
            >
              {m.label}
            </button>
          ))}
        </div>
        {onSkip && (
          <button onClick={onSkip} disabled={busy} className="py-2 text-sm text-muted hover:text-fg disabled:opacity-40">
            Пропустить
          </button>
        )}
        {reviewMutation.isError && <p className="text-sm text-status-red">{reviewMutation.error.message}</p>}
      </div>
    </div>
  );
}
