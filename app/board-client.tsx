"use client";

import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { CategoryDTO, QuestionDTO, STATUS_COLOR } from "./types";
import { FlashCardModal } from "./flash-card-modal";

async function fetchCategories(): Promise<CategoryDTO[]> {
  const res = await fetch("/api/questions");
  if (!res.ok) throw new Error("failed to load");
  return res.json();
}

export function BoardClient() {
  const { data, isLoading, error } = useQuery({ queryKey: ["questions"], queryFn: fetchCategories });
  const [selected, setSelected] = useState<QuestionDTO | null>(null);

  if (isLoading) {
    return <div className="flex-1 flex items-center justify-center text-white/50">Загрузка...</div>;
  }
  if (error || !data) {
    return <div className="flex-1 flex items-center justify-center text-red-400">Ошибка загрузки</div>;
  }

  const masteredQuestions = data.flatMap((c) =>
    c.questions.filter((q) => q.status === "mastered").map((q) => ({ ...q, categoryName: c.name }))
  );

  return (
    <div className="flex-1 overflow-x-auto">
      <div className="flex gap-4 p-6 min-w-max h-full">
        {data.map((category) => (
          <Column
            key={category.id}
            title={category.name}
            questions={category.questions.filter((q) => q.status !== "mastered")}
            onSelect={setSelected}
          />
        ))}
        <Column
          title="🏆 Освоено"
          questions={masteredQuestions}
          onSelect={setSelected}
          accent
        />
      </div>
      {selected && <FlashCardModal question={selected} onClose={() => setSelected(null)} />}
    </div>
  );
}

function Column({
  title,
  questions,
  onSelect,
  accent,
}: {
  title: string;
  questions: QuestionDTO[];
  onSelect: (q: QuestionDTO) => void;
  accent?: boolean;
}) {
  return (
    <div
      className={`w-72 shrink-0 rounded-2xl border backdrop-blur-xl flex flex-col ${
        accent ? "border-emerald-400/30 bg-emerald-400/5" : "border-white/10 bg-white/5"
      }`}
    >
      <div className="px-4 py-3 border-b border-white/10 flex items-center justify-between sticky top-0">
        <span className="text-sm font-medium truncate">{title}</span>
        <span className="text-xs text-white/40 shrink-0 ml-2">{questions.length}</span>
      </div>
      <div className="flex-1 overflow-y-auto p-2 space-y-2 max-h-[calc(100vh-180px)]">
        {questions.map((q) => (
          <button
            key={q.id}
            onClick={() => onSelect(q)}
            className="w-full text-left rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 p-3 transition"
          >
            <div className="flex items-start justify-between gap-2">
              <p className="text-sm text-white/85 line-clamp-3">{q.question}</p>
              <span className={`mt-1 h-2 w-2 rounded-full shrink-0 ${STATUS_COLOR[q.status]}`} />
            </div>
          </button>
        ))}
        {questions.length === 0 && (
          <p className="text-xs text-white/30 text-center py-6">Пусто</p>
        )}
      </div>
    </div>
  );
}
