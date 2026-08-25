"use client";

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { QuestionDTO, STATUS_COLOR } from "./types";

const RATING_BUCKETS: { label: string; value: number; className: string }[] = [
  { label: "Не знаю", value: 1, className: "bg-red-500/20 text-red-300 hover:bg-red-500/30" },
  { label: "Слабо", value: 4, className: "bg-orange-500/20 text-orange-300 hover:bg-orange-500/30" },
  { label: "Хорошо", value: 7, className: "bg-amber-400/20 text-amber-300 hover:bg-amber-400/30" },
  { label: "Отлично", value: 9, className: "bg-emerald-400/20 text-emerald-300 hover:bg-emerald-400/30" },
  { label: "На 10", value: 10, className: "bg-violet-500/20 text-violet-300 hover:bg-violet-500/30" },
];

export function FlashCardModal({
  question,
  onClose,
}: {
  question: QuestionDTO;
  onClose: () => void;
}) {
  const [flipped, setFlipped] = useState(false);
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async (rating: number) => {
      const res = await fetch("/api/review", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ questionId: question.id, rating }),
      });
      if (!res.ok) throw new Error("failed");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["questions"] });
      queryClient.invalidateQueries({ queryKey: ["study-queue"] });
      onClose();
    },
  });

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-xl rounded-2xl border border-white/10 bg-[#13131e]/90 shadow-2xl p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <span className={`h-2.5 w-2.5 rounded-full ${STATUS_COLOR[question.status]}`} />
          <button onClick={onClose} className="text-white/40 hover:text-white text-sm">
            Закрыть ✕
          </button>
        </div>

        <div className="flip-card min-h-[220px]">
          <div
            className={`flip-card-inner relative min-h-[220px] ${flipped ? "flipped" : ""}`}
          >
            <div className="flip-card-face absolute inset-0 flex items-center justify-center text-center p-4">
              <p className="text-lg font-medium">{question.question}</p>
            </div>
            <div className="flip-card-face flip-card-back absolute inset-0 flex items-center justify-center text-center p-4 overflow-y-auto">
              <p className="text-sm text-white/80 whitespace-pre-line leading-relaxed">{question.answer}</p>
            </div>
          </div>
        </div>

        {!flipped ? (
          <button
            onClick={() => setFlipped(true)}
            className="mt-6 w-full rounded-xl bg-white/10 hover:bg-white/15 py-3 font-medium transition"
          >
            Показать ответ
          </button>
        ) : (
          <div className="mt-6 grid grid-cols-5 gap-2">
            {RATING_BUCKETS.map((b) => (
              <button
                key={b.value}
                disabled={mutation.isPending}
                onClick={() => mutation.mutate(b.value)}
                className={`rounded-xl py-2.5 text-xs font-medium transition disabled:opacity-40 ${b.className}`}
              >
                {b.label}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
