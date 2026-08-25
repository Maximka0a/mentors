"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";

interface StudyQuestion {
  id: string;
  question: string;
  answer: string;
  category: string;
  lastRating: number | null;
}

const RATING_BUCKETS = [
  { label: "Не знаю", value: 1, className: "bg-red-500/20 text-red-300 hover:bg-red-500/30" },
  { label: "Слабо", value: 4, className: "bg-orange-500/20 text-orange-300 hover:bg-orange-500/30" },
  { label: "Хорошо", value: 7, className: "bg-amber-400/20 text-amber-300 hover:bg-amber-400/30" },
  { label: "Отлично", value: 9, className: "bg-emerald-400/20 text-emerald-300 hover:bg-emerald-400/30" },
  { label: "На 10", value: 10, className: "bg-violet-500/20 text-violet-300 hover:bg-violet-500/30" },
];

async function fetchQueue(): Promise<StudyQuestion[]> {
  const res = await fetch("/api/study/queue");
  if (!res.ok) throw new Error("failed");
  return res.json();
}

export default function StudyPage() {
  const queryClient = useQueryClient();
  const { data, isLoading } = useQuery({ queryKey: ["study-queue"], queryFn: fetchQueue });
  const [flipped, setFlipped] = useState(false);
  const [userAnswer, setUserAnswer] = useState("");
  const [grade, setGrade] = useState<{ score: number; feedback: string } | null>(null);

  const mutation = useMutation({
    mutationFn: async ({ questionId, rating }: { questionId: string; rating: number }) => {
      const res = await fetch("/api/review", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ questionId, rating }),
      });
      if (!res.ok) throw new Error("failed");
      return res.json();
    },
    onSuccess: () => {
      setFlipped(false);
      setUserAnswer("");
      setGrade(null);
      queryClient.invalidateQueries({ queryKey: ["study-queue"] });
      queryClient.invalidateQueries({ queryKey: ["questions"] });
    },
  });

  const gradeMutation = useMutation({
    mutationFn: async ({ questionId, userAnswer }: { questionId: string; userAnswer: string }) => {
      const res = await fetch("/api/grade", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ questionId, userAnswer }),
      });
      if (!res.ok) throw new Error("failed");
      return res.json() as Promise<{ score: number; feedback: string }>;
    },
    onSuccess: (result) => {
      setGrade(result);
      setFlipped(true);
    },
  });

  if (isLoading) {
    return <div className="flex-1 flex items-center justify-center text-white/50">Загрузка...</div>;
  }

  const current = data?.[0];

  function skip() {
    setFlipped(false);
    setUserAnswer("");
    setGrade(null);
    if (!data || data.length < 2) return;
    const [first, ...rest] = data;
    queryClient.setQueryData<StudyQuestion[]>(["study-queue"], [...rest, first]);
  }

  if (!current) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center text-center gap-2 px-4">
        <p className="text-2xl">🎉</p>
        <p className="text-white/70">Все вопросы на сегодня повторены</p>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col items-center justify-center px-4 py-10 gap-6">
      <p className="text-xs uppercase tracking-wide text-white/40">{current.category}</p>
      <div className="w-full max-w-xl rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl shadow-2xl p-8">
        <div className="flip-card min-h-[220px]">
          <div className={`flip-card-inner relative min-h-[220px] ${flipped ? "flipped" : ""}`}>
            <div className="flip-card-face absolute inset-0 flex items-center justify-center text-center p-4">
              <p className="text-lg font-medium">{current.question}</p>
            </div>
            <div className="flip-card-face flip-card-back absolute inset-0 flex items-center justify-center text-center p-4 overflow-y-auto">
              <p className="text-sm text-white/80 whitespace-pre-line leading-relaxed">{current.answer}</p>
            </div>
          </div>
        </div>

        {!flipped ? (
          <div className="mt-6 flex flex-col gap-3">
            <textarea
              value={userAnswer}
              onChange={(e) => setUserAnswer(e.target.value)}
              placeholder="Можешь напечатать свой ответ, и AI (Gemini) его оценит — необязательно"
              rows={3}
              className="w-full rounded-xl border border-white/10 bg-white/5 p-3 text-sm placeholder:text-white/30 focus:outline-none focus:border-white/30 resize-none"
            />
            <div className="flex gap-2">
              <button
                onClick={() => setFlipped(true)}
                className="flex-1 rounded-xl bg-white/10 hover:bg-white/15 py-3 font-medium transition"
              >
                Показать ответ
              </button>
              {userAnswer.trim() && (
                <button
                  onClick={() => gradeMutation.mutate({ questionId: current.id, userAnswer })}
                  disabled={gradeMutation.isPending}
                  className="flex-1 rounded-xl bg-violet-500/20 text-violet-300 hover:bg-violet-500/30 py-3 font-medium transition disabled:opacity-40"
                >
                  {gradeMutation.isPending ? "Проверяю..." : "Проверить с AI"}
                </button>
              )}
              <button
                onClick={skip}
                disabled={!data || data.length < 2}
                className="rounded-xl border border-white/10 px-4 text-sm text-white/60 hover:text-white hover:bg-white/5 transition disabled:opacity-30"
              >
                Пропустить
              </button>
            </div>
            {gradeMutation.isError && (
              <p className="text-xs text-red-400">Не удалось получить оценку от AI. Проверь GEMINI_API_KEY.</p>
            )}
          </div>
        ) : (
          <div className="mt-6 flex flex-col gap-2">
            {grade && (
              <div className="rounded-xl border border-violet-400/20 bg-violet-500/10 p-3 mb-1">
                <p className="text-sm font-medium text-violet-300">Оценка AI: {grade.score}/10</p>
                <p className="text-xs text-white/60 mt-1">{grade.feedback}</p>
              </div>
            )}
            <div className="grid grid-cols-5 gap-2">
              {RATING_BUCKETS.map((b, i) => {
                const isSuggested =
                  grade != null &&
                  RATING_BUCKETS.reduce((closest, cur, ci) =>
                    Math.abs(cur.value - grade.score) < Math.abs(RATING_BUCKETS[closest].value - grade.score) ? ci : closest,
                  0) === i;
                return (
                  <button
                    key={b.value}
                    disabled={mutation.isPending}
                    onClick={() => mutation.mutate({ questionId: current.id, rating: b.value })}
                    className={`rounded-xl py-2.5 text-xs font-medium transition disabled:opacity-40 ${b.className} ${
                      isSuggested ? "ring-2 ring-violet-400" : ""
                    }`}
                  >
                    {b.label}
                  </button>
                );
              })}
            </div>
            <button
              onClick={skip}
              disabled={!data || data.length < 2}
              className="rounded-xl border border-white/10 py-2 text-sm text-white/60 hover:text-white hover:bg-white/5 transition disabled:opacity-30"
            >
              Пропустить
            </button>
          </div>
        )}
      </div>
      <p className="text-xs text-white/30">Осталось в очереди: {data.length}</p>
    </div>
  );
}
