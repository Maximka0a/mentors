"use client";

import { useEffect, useRef, useState } from "react";
import { createGradingRunner } from "./grading-runner";
import { useQueryClient } from "@tanstack/react-query";
import type { GradeResponse, StudyQuestion } from "../types";
import { VERDICT_LABEL } from "../types";
import { getJson, gradeAnswer, submitReview } from "../components/api-client";
import { AnswerInput } from "../components/answer-input";
import { GradeView } from "../components/grade-view";
import { Markdown } from "../components/markdown";
import { DEFAULT_PACK, ScopePicker, scopeQuery, type Scope } from "../components/scope-picker";
import { verdictForScore } from "@/lib/grading/config";

type Phase = "setup" | "interview" | "results";

interface AnswerRecord {
  question: StudyQuestion;
  answer: string;
  inputMode: "text" | "voice";
  status: "empty" | "pending" | "done" | "error";
  grade?: GradeResponse;
  error?: string;
}

// Unanswered questions go to the scheduler as a failed answer
const UNANSWERED_RATING = 1;
const CONCURRENCY = 2;
const RATE_LIMIT_RETRIES = 3;
const RATE_LIMIT_DELAY_MS = 20_000;

export default function MockPage() {
  const [phase, setPhase] = useState<Phase>("setup");
  const [scope, setScope] = useState<Scope>({ pack: DEFAULT_PACK, topic: null });
  const [count, setCount] = useState(10);
  const [questions, setQuestions] = useState<StudyQuestion[]>([]);
  const [records, setRecords] = useState<AnswerRecord[]>([]);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [sessionId, setSessionId] = useState("");

  async function start() {
    setLoadError(null);
    try {
      const q = new URLSearchParams(scopeQuery(scope));
      q.set("n", String(count));
      const list = await getJson<StudyQuestion[]>(`/api/mock/questions?${q}`);
      if (list.length === 0) throw new Error("В выбранной области нет вопросов");
      setSessionId(crypto.randomUUID());
      setQuestions(list);
      setRecords([]);
      setPhase("interview");
    } catch (e) {
      setLoadError(e instanceof Error ? e.message : "Не удалось начать");
    }
  }

  if (phase === "setup") {
    return (
      <div className="flex flex-col gap-6 pt-6">
        <div>
          <h1 className="text-xl font-semibold">Мок-собеседование</h1>
          <p className="text-sm text-muted">
            Вопросы идут подряд, оценок по ходу нет — как на настоящем собеседовании. Разбор всех ответов — в конце.
          </p>
        </div>
        <ScopePicker value={scope} onChange={setScope} />
        <div>
          <p className="mb-2 text-sm text-muted">Количество вопросов</p>
          <div className="grid grid-cols-4 gap-2">
            {[5, 10, 15, 20].map((n) => (
              <button
                key={n}
                onClick={() => setCount(n)}
                className={`rounded-lg border py-2 text-sm ${
                  count === n ? "border-accent bg-accent-soft text-accent" : "border-line bg-surface text-muted"
                }`}
              >
                {n}
              </button>
            ))}
          </div>
        </div>
        <button onClick={start} className="rounded-xl bg-accent text-accent-fg py-3 font-medium">
          Начать собеседование
        </button>
        {loadError && <p className="text-sm text-status-red">{loadError}</p>}
      </div>
    );
  }

  return (
    <Interview
      key={sessionId}
      questions={questions}
      sessionId={sessionId}
      records={records}
      setRecords={setRecords}
      phase={phase}
      onFinish={() => setPhase("results")}
      onRestart={() => setPhase("setup")}
    />
  );
}

function Interview({
  questions,
  sessionId,
  records,
  setRecords,
  phase,
  onFinish,
  onRestart,
}: {
  questions: StudyQuestion[];
  sessionId: string;
  records: AnswerRecord[];
  setRecords: React.Dispatch<React.SetStateAction<AnswerRecord[]>>;
  phase: Phase;
  onFinish: () => void;
  onRestart: () => void;
}) {
  const [index, setIndex] = useState(0);
  const [answer, setAnswer] = useState("");
  const [voiceUsed, setVoiceUsed] = useState(false);
  const [runner] = useState(() =>
    createGradingRunner({
      concurrency: CONCURRENCY,
      rateLimitRetries: RATE_LIMIT_RETRIES,
      rateLimitDelayMs: RATE_LIMIT_DELAY_MS,
      onResult: (i, result) =>
        setRecords((rs) =>
          rs.map((r, j) =>
            j !== i ? r : "grade" in result ? { ...r, status: "done", grade: result.grade } : { ...r, status: "error", error: result.error }
          )
        ),
    })
  );

  function submit(skipped: boolean) {
    const q = questions[index];
    const text = skipped ? "" : answer.trim();
    const record: AnswerRecord = {
      question: q,
      answer: text,
      inputMode: voiceUsed ? "voice" : "text",
      status: text ? "pending" : "empty",
    };
    setRecords([...records, record]);
    if (text) {
      runner.enqueue({
        index: records.length,
        run: () =>
          gradeAnswer({ questionId: q.id, userAnswer: text, inputMode: record.inputMode, mode: "mock", sessionId }),
      });
    }
    setAnswer("");
    setVoiceUsed(false);
    window.scrollTo({ top: 0 });
    if (index + 1 < questions.length) setIndex(index + 1);
    else onFinish();
  }

  if (phase === "results") return <Results records={records} onRestart={onRestart} />;

  const q = questions[index];
  return (
    <div className="flex flex-col gap-5 pt-5">
      <div className="flex items-center gap-3">
        <div className="flex-1 h-1.5 rounded-full bg-surface-2 overflow-hidden">
          <div className="h-full bg-accent transition-all" style={{ width: `${(index / questions.length) * 100}%` }} />
        </div>
        <span className="text-xs text-faint tabular-nums">
          {index + 1} / {questions.length}
        </span>
      </div>
      <div>
        <p className="text-xs text-faint">
          {q.pack} · {q.category}
        </p>
        <h2 className="mt-2 text-xl font-semibold leading-snug">{q.question}</h2>
      </div>
      <AnswerInput key={q.id} value={answer} onChange={setAnswer} onVoiceUsed={() => setVoiceUsed(true)} autoFocus />
      <div className="flex flex-col gap-2">
        <button
          onClick={() => submit(false)}
          disabled={!answer.trim()}
          className="rounded-xl bg-accent text-accent-fg py-3 font-medium disabled:opacity-40"
        >
          {index + 1 < questions.length ? "Ответить и дальше" : "Завершить собеседование"}
        </button>
        <button onClick={() => submit(true)} className="py-2 text-sm text-muted hover:text-fg">
          Не знаю — следующий вопрос
        </button>
      </div>
    </div>
  );
}

function Results({ records, onRestart }: { records: AnswerRecord[]; onRestart: () => void }) {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState<number | null>(null);
  const applied = useRef(false);
  const pending = records.filter((r) => r.status === "pending").length;
  const graded = records.filter((r) => r.grade);

  // Once every answer is graded, feed the results into spaced repetition
  useEffect(() => {
    if (pending > 0 || applied.current) return;
    applied.current = true;
    Promise.all(
      records.map((r) =>
        r.grade
          ? submitReview(r.question.id, r.grade.suggestedRating)
          : r.status === "empty"
            ? submitReview(r.question.id, UNANSWERED_RATING)
            : Promise.resolve()
      )
    ).finally(() => queryClient.invalidateQueries({ queryKey: ["topics"] }));
  }, [pending, records, queryClient]);

  const scores = records.map((r) => (r.grade ? r.grade.overallScore : r.status === "empty" ? 0 : null));
  const counted = scores.filter((s): s is number => s !== null);
  const average = counted.length ? Math.round(counted.reduce((a, b) => a + b, 0) / counted.length) : 0;
  const verdict = verdictForScore(average);

  return (
    <div className="flex flex-col gap-5 pt-6">
      <section className="rounded-2xl border border-line bg-surface p-5">
        <h1 className="text-lg font-semibold">Итог собеседования</h1>
        {pending > 0 ? (
          <p className="mt-2 text-sm text-muted">
            Интервьюер ещё оценивает ответы: {records.length - pending} из {records.length}…
          </p>
        ) : (
          <>
            <div className="mt-3 flex items-baseline gap-3">
              <span className="font-mono text-4xl font-semibold tabular-nums">{average}</span>
              <span>{VERDICT_LABEL[verdict]}</span>
            </div>
            <p className="mt-2 text-sm text-muted">
              Оценено {graded.length} из {records.length}, без ответа — {records.filter((r) => r.status === "empty").length}.
              Результаты учтены в интервалах повторения.
            </p>
          </>
        )}
      </section>

      <ul className="flex flex-col gap-2">
        {records.map((r, i) => (
          <li key={i} className="rounded-2xl border border-line bg-surface">
            <button onClick={() => setOpen(open === i ? null : i)} className="w-full flex items-start gap-3 p-4 text-left">
              <span className="font-mono text-sm tabular-nums w-8 shrink-0">
                {r.grade ? r.grade.overallScore : r.status === "empty" ? "—" : r.status === "pending" ? "…" : "!"}
              </span>
              <span className="flex-1 text-sm leading-snug">{r.question.question}</span>
              <span className="shrink-0">
                {r.grade ? VERDICT_LABEL[r.grade.verdict].split(" ")[0] : r.status === "empty" ? "🔴" : ""}
              </span>
            </button>
            {open === i && (
              <div className="flex flex-col gap-4 border-t border-line p-4">
                <div>
                  <p className="text-xs text-faint mb-1">Твой ответ</p>
                  <p className="text-sm whitespace-pre-line">{r.answer || "— без ответа —"}</p>
                </div>
                {r.grade && <GradeView grade={r.grade} />}
                {r.status === "error" && <p className="text-sm text-status-red">{r.error}</p>}
                <div>
                  <p className="text-xs text-faint mb-1">Эталон</p>
                  <Markdown>{r.question.answer}</Markdown>
                </div>
              </div>
            )}
          </li>
        ))}
      </ul>

      <button onClick={onRestart} className="rounded-xl bg-accent text-accent-fg py-3 font-medium">
        Новое собеседование
      </button>
    </div>
  );
}
