"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import type { StudyQuestion } from "../types";
import { getJson } from "../components/api-client";
import { PracticeCard, type PracticeOutcome } from "../components/practice-card";
import { HistoryBar, type HistoryEntry } from "../components/history-bar";
import { DEFAULT_PACK, ScopePicker, scopeQuery, type Scope } from "../components/scope-picker";

const HISTORY_LIMIT = 10;

export function StudyClient() {
  const params = useSearchParams();
  const router = useRouter();
  const started = params.get("start") === "1" || params.has("topic") || params.has("pack");
  const scope: Scope = { pack: params.get("pack"), topic: params.get("topic") };

  if (!started) {
    return (
      <Setup
        onStart={(s) => {
          const q = new URLSearchParams(scopeQuery(s));
          q.set("start", "1");
          router.push(`/study?${q}`);
        }}
      />
    );
  }
  return <Session scope={scope} onChangeScope={() => router.push("/study")} />;
}

function Setup({ onStart }: { onStart: (s: Scope) => void }) {
  const [scope, setScope] = useState<Scope>({ pack: DEFAULT_PACK, topic: null });
  return (
    <div className="flex flex-col gap-6 pt-6">
      <div>
        <h1 className="text-xl font-semibold">Тренировка</h1>
        <p className="text-sm text-muted">
          Вопросы, у которых подошёл срок повторения. Слабые возвращаются чаще, уверенные — реже.
        </p>
      </div>
      <ScopePicker value={scope} onChange={setScope} />
      <button onClick={() => onStart(scope)} className="rounded-xl bg-accent text-accent-fg py-3 font-medium">
        Начать
      </button>
    </div>
  );
}

function Session({ scope, onChangeScope }: { scope: Scope; onChangeScope: () => void }) {
  const { data, isLoading, error, dataUpdatedAt } = useQuery({
    queryKey: ["study-queue", scope.pack, scope.topic],
    queryFn: () => getJson<StudyQuestion[]>(`/api/study/queue${scopeQuery(scope)}`),
    staleTime: Infinity,
  });

  if (isLoading) return <p className="py-16 text-center text-muted">Загрузка…</p>;
  if (error || !data) return <p className="py-16 text-center text-status-red">Не удалось загрузить очередь</p>;
  // Remount on refetch so the local queue starts from fresh server data
  return <SessionQueue key={dataUpdatedAt} initial={data} onChangeScope={onChangeScope} />;
}

function SessionQueue({ initial, onChangeScope }: { initial: StudyQuestion[]; onChangeScope: () => void }) {
  const queryClient = useQueryClient();
  const [queue, setQueue] = useState<StudyQuestion[]>(initial);
  const [history, setHistory] = useState<HistoryEntry[]>([]);

  const current = queue[0];

  function record(outcome: PracticeOutcome) {
    if (!current) return;
    setHistory((h) => [...h, { id: current.id, question: current.question, outcome }].slice(-HISTORY_LIMIT));
  }

  function done(outcome: PracticeOutcome) {
    record(outcome);
    setQueue((q) => q.slice(1));
    window.scrollTo({ top: 0 });
  }

  function skip() {
    record("skipped");
    setQueue((q) => (q.length > 1 ? [...q.slice(1), q[0]] : q));
    window.scrollTo({ top: 0 });
  }

  return (
    <div className="flex flex-col gap-5 pt-5">
      <div className="flex items-center justify-between gap-3">
        <HistoryBar history={history} hasCurrent={!!current} />
        <div className="flex items-center gap-3 text-xs text-faint shrink-0">
          <span>Осталось {queue.length}</span>
          <button onClick={onChangeScope} className="text-muted hover:text-fg">
            Сменить
          </button>
        </div>
      </div>

      {current ? (
        <PracticeCard
          key={current.id}
          question={{ ...current, label: `${current.pack} · ${current.category}` }}
          onDone={done}
          onSkip={queue.length > 1 ? skip : undefined}
        />
      ) : (
        <div className="flex flex-col items-center gap-4 py-16 text-center">
          <p className="text-3xl">🎉</p>
          <p className="text-muted">Всё, что было к повторению, пройдено</p>
          <div className="flex gap-2">
            <button
              onClick={() => queryClient.invalidateQueries({ queryKey: ["study-queue"] })}
              className="rounded-lg border border-line px-4 py-2 text-sm hover:bg-surface-2"
            >
              Обновить
            </button>
            <button onClick={onChangeScope} className="rounded-lg bg-accent px-4 py-2 text-sm text-accent-fg">
              Другая тема
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
