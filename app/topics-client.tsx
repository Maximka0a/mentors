"use client";

import Link from "next/link";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { useLocalStorage } from "./components/use-client-value";
import type { PackTopics, QuestionDTO } from "./types";
import { STATUS_DOT } from "./types";
import { getJson } from "./components/api-client";
import { ProgressBar, ProgressCounts } from "./components/progress-bar";
import { Sheet } from "./components/sheet";
import { PracticeCard } from "./components/practice-card";

const PACK_KEY = "home-pack";

export function TopicsClient() {
  const queryClient = useQueryClient();
  const { data: packs, isLoading, error } = useQuery({
    queryKey: ["topics"],
    queryFn: () => getJson<PackTopics[]>("/api/topics"),
  });
  const [packSlug, setPackSlug] = useLocalStorage(PACK_KEY);
  const [openTopic, setOpenTopic] = useState<string | null>(null);

  const toggleMutation = useMutation({
    mutationFn: (p: { slug: string; enabled: boolean }) =>
      fetch("/api/packs", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(p),
      }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["topics"] }),
  });

  if (isLoading) return <p className="py-16 text-center text-muted">Загрузка…</p>;
  if (error || !packs) return <p className="py-16 text-center text-status-red">Не удалось загрузить темы</p>;

  const pack = packs.find((p) => p.slug === packSlug) ?? packs.find((p) => p.slug === "extended") ?? packs[0];
  const totals = pack.topics.reduce(
    (acc, t) => ({
      total: acc.total + t.total,
      green: acc.green + t.green,
      yellow: acc.yellow + t.yellow,
      red: acc.red + t.red,
      fresh: acc.fresh + t.fresh,
      due: acc.due + t.due,
    }),
    { total: 0, green: 0, yellow: 0, red: 0, fresh: 0, due: 0 }
  );

  function selectPack(slug: string) {
    setPackSlug(slug);
    setOpenTopic(null);
  }

  return (
    <div className="flex flex-col gap-6 pt-6">
      <div className="flex gap-1 overflow-x-auto rounded-xl bg-surface-2 p-1">
        {packs.map((p) => (
          <button
            key={p.slug}
            onClick={() => selectPack(p.slug)}
            className={`flex-1 whitespace-nowrap rounded-lg px-3 py-2 text-sm transition-colors ${
              p.slug === pack.slug ? "bg-surface text-fg shadow-sm" : "text-muted hover:text-fg"
            }`}
          >
            {p.name}
          </button>
        ))}
      </div>

      <section className="rounded-2xl border border-line bg-surface p-4 sm:p-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-lg font-semibold">{pack.name}</h1>
            <p className="text-sm text-muted">
              {totals.total} вопросов · {totals.due} к повторению
            </p>
          </div>
          <label className="flex items-center gap-2 text-sm text-muted shrink-0">
            <input
              type="checkbox"
              className="h-4 w-4 accent-[var(--accent)]"
              checked={pack.enabled}
              disabled={toggleMutation.isPending}
              onChange={(e) => toggleMutation.mutate({ slug: pack.slug, enabled: e.target.checked })}
            />
            В тренировках
          </label>
        </div>
        <ProgressBar t={totals} className="mt-4 h-2.5" />
        <div className="mt-2">
          <ProgressCounts t={totals} />
        </div>
      </section>

      <ul className="flex flex-col gap-2">
        {pack.topics.map((t) => (
          <li key={t.name} className="rounded-2xl border border-line bg-surface">
            <button
              onClick={() => setOpenTopic(openTopic === t.name ? null : t.name)}
              className="w-full text-left p-4"
              aria-expanded={openTopic === t.name}
            >
              <div className="flex items-baseline justify-between gap-3">
                <span className="font-medium">{t.name}</span>
                <span className="text-xs text-faint tabular-nums shrink-0">
                  {t.total} · {t.due} к повт.
                </span>
              </div>
              <ProgressBar t={t} className="mt-3 h-1.5" />
              <div className="mt-2">
                <ProgressCounts t={t} />
              </div>
            </button>
            {openTopic === t.name && <TopicQuestions pack={pack.slug} topic={t.name} />}
          </li>
        ))}
      </ul>
    </div>
  );
}

function TopicQuestions({ pack, topic }: { pack: string; topic: string }) {
  const { data, isLoading } = useQuery({
    queryKey: ["topic-questions", pack, topic],
    queryFn: () =>
      getJson<QuestionDTO[]>(`/api/questions?pack=${encodeURIComponent(pack)}&topic=${encodeURIComponent(topic)}`),
  });
  const [selected, setSelected] = useState<QuestionDTO | null>(null);

  return (
    <div className="border-t border-line px-2 pb-3">
      <div className="flex justify-end px-2 py-2">
        <Link
          href={`/study?pack=${encodeURIComponent(pack)}&topic=${encodeURIComponent(topic)}`}
          className="rounded-lg bg-accent-soft px-3 py-1.5 text-sm font-medium text-accent"
        >
          Тренировать тему →
        </Link>
      </div>
      {isLoading && <p className="px-2 py-3 text-sm text-muted">Загрузка…</p>}
      <ul>
        {data?.map((q) => (
          <li key={q.id}>
            <button
              onClick={() => setSelected(q)}
              className="w-full flex items-start gap-3 rounded-lg px-2 py-2.5 text-left hover:bg-surface-2"
            >
              <span className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${STATUS_DOT[q.status]}`} />
              <span className="flex-1 text-sm leading-snug">
                {q.subtopic && <span className="text-faint">{q.subtopic} · </span>}
                {q.question}
              </span>
              {q.difficulty && <span className="shrink-0 text-[11px] text-faint">{q.difficulty}</span>}
            </button>
          </li>
        ))}
      </ul>
      {selected && (
        <Sheet onClose={() => setSelected(null)}>
          <PracticeCard
            key={selected.id}
            question={{
              ...selected,
              label: selected.subtopic ? `${topic} · ${selected.subtopic}` : topic,
            }}
            onDone={() => setSelected(null)}
          />
        </Sheet>
      )}
    </div>
  );
}
