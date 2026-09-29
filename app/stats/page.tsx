"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import type { PackTopics } from "../types";
import { getJson } from "../components/api-client";
import { ProgressBar } from "../components/progress-bar";
import { verdictForScore } from "@/lib/grading/config";

interface Stats {
  days: number;
  totals: {
    attempts: number;
    mockAttempts: number;
    avgOverall: number;
    avgCompleteness: number;
    avgCorrectness: number;
    avgFormat: number;
  };
  byTopic: {
    pack: string;
    packSlug: string;
    topic: string;
    attempts: number;
    avgOverall: number;
    avgCompleteness: number;
    avgCorrectness: number;
    avgFormat: number;
    redShare: number;
  }[];
  daily: { day: string; attempts: number; avgOverall: number }[];
}

const SCORE_COLOR = { green: "bg-status-green", yellow: "bg-status-yellow", red: "bg-status-red" };

function trainHref(pack: string, topic: string) {
  return `/study?pack=${encodeURIComponent(pack)}&topic=${encodeURIComponent(topic)}`;
}

export default function StatsPage() {
  const [days, setDays] = useState(30);
  const stats = useQuery({ queryKey: ["stats", days], queryFn: () => getJson<Stats>(`/api/stats?days=${days}`) });
  const topics = useQuery({ queryKey: ["topics"], queryFn: () => getJson<PackTopics[]>("/api/topics") });

  // Topics ranked by share of 🔴 among answered questions (spaced-repetition state)
  const weakByStatus = (topics.data ?? [])
    .flatMap((p) => p.topics.map((t) => ({ ...t, pack: p.name, packSlug: p.slug })))
    .filter((t) => t.green + t.yellow + t.red > 0)
    .map((t) => ({ ...t, redShare: Math.round((t.red / (t.green + t.yellow + t.red)) * 100) }))
    .sort((a, b) => b.redShare - a.redShare || b.red - a.red)
    .slice(0, 8);

  const s = stats.data;
  const maxDaily = Math.max(1, ...(s?.daily.map((d) => d.attempts) ?? [1]));

  return (
    <div className="flex flex-col gap-6 pt-6">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-xl font-semibold">Статистика</h1>
        <div className="flex gap-1 rounded-lg bg-surface-2 p-1">
          {[7, 30, 90].map((d) => (
            <button
              key={d}
              onClick={() => setDays(d)}
              className={`rounded-md px-2.5 py-1 text-xs ${days === d ? "bg-surface text-fg shadow-sm" : "text-muted"}`}
            >
              {d} дн
            </button>
          ))}
        </div>
      </div>

      {stats.isLoading && <p className="text-muted">Загрузка…</p>}
      {stats.error && <p className="text-status-red">Не удалось загрузить статистику</p>}

      {s && (
        <>
          <section className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {[
              { label: "Ответов с AI", value: s.totals.attempts, sub: `из них в собесе ${s.totals.mockAttempts}` },
              { label: "Средний балл", value: s.totals.avgOverall },
              { label: "Полнота", value: s.totals.avgCompleteness },
              { label: "Корректность", value: s.totals.avgCorrectness },
            ].map((c) => (
              <div key={c.label} className="rounded-xl border border-line bg-surface p-3">
                <p className="text-xs text-muted">{c.label}</p>
                <p className="mt-1 font-mono text-2xl font-semibold tabular-nums">{c.value}</p>
                {c.sub && <p className="text-[11px] text-faint">{c.sub}</p>}
              </div>
            ))}
          </section>

          {s.daily.length > 0 && (
            <section className="rounded-2xl border border-line bg-surface p-4">
              <h2 className="text-sm font-semibold mb-3">Активность</h2>
              <div className="flex items-end gap-1 h-24">
                {s.daily.map((d) => (
                  <div key={d.day} className="flex-1 flex flex-col justify-end" title={`${d.day}: ${d.attempts} отв., ср. ${d.avgOverall}`}>
                    <div
                      className={`rounded-t ${SCORE_COLOR[verdictForScore(d.avgOverall)]}`}
                      style={{ height: `${(d.attempts / maxDaily) * 100}%`, minHeight: 4 }}
                    />
                  </div>
                ))}
              </div>
              <p className="mt-2 text-[11px] text-faint">Высота — число ответов за день, цвет — средний балл</p>
            </section>
          )}

          <section>
            <h2 className="text-sm font-semibold mb-2">Слабые темы по оценкам AI</h2>
            {s.byTopic.length === 0 ? (
              <p className="text-sm text-muted">
                Пока нет ответов с проверкой AI за этот период — ответь на пару вопросов в тренировке или собеседовании.
              </p>
            ) : (
              <ul className="flex flex-col gap-2">
                {s.byTopic.map((t) => (
                  <li key={`${t.packSlug}-${t.topic}`} className="rounded-xl border border-line bg-surface p-3">
                    <div className="flex items-baseline justify-between gap-3">
                      <span className="font-medium">
                        {t.topic} <span className="text-xs text-faint">· {t.pack}</span>
                      </span>
                      <span className="font-mono tabular-nums">{t.avgOverall}</span>
                    </div>
                    <div className="mt-2 h-1.5 rounded-full bg-surface-2 overflow-hidden">
                      <div
                        className={`h-full ${SCORE_COLOR[verdictForScore(t.avgOverall)]}`}
                        style={{ width: `${t.avgOverall}%` }}
                      />
                    </div>
                    <div className="mt-2 flex flex-wrap items-center justify-between gap-2 text-xs text-muted">
                      <span>
                        {t.attempts} отв. · 🔴 {t.redShare}% · полнота {t.avgCompleteness} · корректность {t.avgCorrectness} · подача {t.avgFormat}
                      </span>
                      <Link href={trainHref(t.packSlug, t.topic)} className="text-accent">
                        Тренировать →
                      </Link>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </>
      )}

      {weakByStatus.length > 0 && (
        <section>
          <h2 className="text-sm font-semibold mb-2">Больше всего 🔴 в повторении</h2>
          <ul className="flex flex-col gap-2">
            {weakByStatus.map((t) => (
              <li key={`${t.packSlug}-${t.name}`} className="rounded-xl border border-line bg-surface p-3">
                <div className="flex items-baseline justify-between gap-3 text-sm">
                  <span>
                    {t.name} <span className="text-xs text-faint">· {t.pack}</span>
                  </span>
                  <Link href={trainHref(t.packSlug, t.name)} className="text-xs text-accent shrink-0">
                    🔴 {t.red} · тренировать →
                  </Link>
                </div>
                <ProgressBar t={t} className="mt-2 h-1.5" />
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="rounded-2xl border border-line bg-surface p-4">
        <h2 className="text-sm font-semibold">Экспорт истории</h2>
        <p className="mt-1 text-xs text-muted">Все ответы с оценками AI: баллы, упущенные пункты, ошибки.</p>
        <div className="mt-3 grid grid-cols-2 gap-2">
          <a href="/api/export?format=csv" className="rounded-lg border border-line py-2 text-center text-sm hover:bg-surface-2">
            CSV (Excel)
          </a>
          <a href="/api/export?format=json" className="rounded-lg border border-line py-2 text-center text-sm hover:bg-surface-2">
            JSON
          </a>
        </div>
      </section>
    </div>
  );
}
