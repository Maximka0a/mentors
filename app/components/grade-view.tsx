"use client";

import { useState } from "react";
import type { GradeResponse, Verdict } from "../types";
import { VERDICT_LABEL } from "../types";

const VERDICT_STYLE: Record<Verdict, string> = {
  green: "border-status-green/40 bg-status-green/10",
  yellow: "border-status-yellow/40 bg-status-yellow/10",
  red: "border-status-red/40 bg-status-red/10",
};

function ScoreBar({ label, value, hint }: { label: string; value: number; hint: string }) {
  return (
    <div>
      <div className="flex items-baseline justify-between text-sm">
        <span className="text-muted" title={hint}>
          {label}
        </span>
        <span className="font-mono tabular-nums">{value}</span>
      </div>
      <div className="mt-1 h-1.5 rounded-full bg-surface-2 overflow-hidden">
        <div className="h-full rounded-full bg-accent" style={{ width: `${value}%` }} />
      </div>
    </div>
  );
}

export function GradeView({ grade }: { grade: GradeResponse }) {
  const [showChecks, setShowChecks] = useState(false);

  return (
    <div className="flex flex-col gap-4">
      <div className={`rounded-xl border p-4 ${VERDICT_STYLE[grade.verdict]}`}>
        <div className="flex items-center justify-between gap-3">
          <span className="font-semibold">{VERDICT_LABEL[grade.verdict]}</span>
          <span className="font-mono text-2xl font-semibold tabular-nums">{grade.overallScore}</span>
        </div>
        {grade.feedback && <p className="mt-2 text-sm leading-relaxed">{grade.feedback}</p>}
        {grade.rewordedReference && (
          <p className="mt-2 text-xs text-muted">
            ⚠️ Ответ почти дословно повторяет эталон. На собеседовании лучше объяснять своими словами, с примером.
          </p>
        )}
      </div>

      <div className="grid gap-3">
        <ScoreBar label="Полнота" value={grade.completenessScore} hint="Названы ли все ключевые пункты" />
        <ScoreBar label="Корректность" value={grade.correctnessScore} hint="Нет ли фактических ошибок" />
        <ScoreBar label="Подача" value={grade.formatScore} hint="Структура ответа как на собеседовании" />
      </div>

      {grade.factualErrors.length > 0 && (
        <section>
          <h3 className="text-sm font-semibold text-status-red mb-2">Фактические ошибки</h3>
          <ul className="flex flex-col gap-2">
            {grade.factualErrors.map((e, i) => (
              <li key={i} className="rounded-lg border border-line bg-surface p-3 text-sm">
                <p className="line-through decoration-status-red/60 text-muted">{e.claim}</p>
                <p className="mt-1">{e.explanation}</p>
              </li>
            ))}
          </ul>
        </section>
      )}

      {grade.missedPoints.length > 0 && (
        <section>
          <h3 className="text-sm font-semibold mb-2">Не прозвучало</h3>
          <ul className="flex flex-col gap-1.5 text-sm">
            {grade.missedPoints.map((p, i) => (
              <li key={i} className="flex gap-2">
                <span className="text-status-yellow">•</span>
                <span>{p}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {grade.pointChecks.length > 0 && (
        <section>
          <button onClick={() => setShowChecks((v) => !v)} className="text-sm text-muted hover:text-fg">
            {showChecks ? "Скрыть" : "Показать"} сверку по пунктам ({grade.pointChecks.length})
          </button>
          {showChecks && (
            <ul className="mt-2 flex flex-col gap-2 text-sm">
              {grade.pointChecks.map((c, i) => (
                <li key={i} className="rounded-lg border border-line bg-surface p-3">
                  <p>
                    {c.status === "covered" ? "✅" : c.status === "partial" ? "🟡" : "❌"} {c.point}
                  </p>
                  {c.evidence && <p className="mt-1 text-muted italic">«{c.evidence}»</p>}
                </li>
              ))}
            </ul>
          )}
        </section>
      )}

      <p className="text-[11px] text-faint">Оценено моделью {grade.model}</p>
    </div>
  );
}
