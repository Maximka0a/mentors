import type { PracticeOutcome } from "./practice-card";

export interface HistoryEntry {
  id: string;
  question: string;
  outcome: PracticeOutcome;
}

const DOT: Record<PracticeOutcome, string> = {
  green: "bg-status-green",
  yellow: "bg-status-yellow",
  red: "bg-status-red",
  skipped: "bg-status-new",
};

const LABEL: Record<PracticeOutcome, string> = {
  green: "🟢",
  yellow: "🟡",
  red: "🔴",
  skipped: "пропущен",
};

// Last answered questions; hover (or long-press title on mobile) shows which question it was
export function HistoryBar({ history, hasCurrent }: { history: HistoryEntry[]; hasCurrent: boolean }) {
  if (history.length === 0 && !hasCurrent) return null;
  return (
    <div className="flex items-center gap-1.5" aria-label="Последние ответы">
      {history.map((h, i) => (
        <div key={`${h.id}-${i}`} className="group relative">
          <div className={`h-2.5 w-2.5 rounded-full ${DOT[h.outcome]}`} title={`${LABEL[h.outcome]} ${h.question}`} />
          <div className="pointer-events-none absolute top-full left-1/2 z-20 mt-2 w-56 -translate-x-1/2 rounded-lg border border-line bg-surface px-2.5 py-1.5 text-xs text-muted opacity-0 shadow-lg transition-opacity group-hover:opacity-100">
            {LABEL[h.outcome]} {h.question}
          </div>
        </div>
      ))}
      {hasCurrent && <div className="pulse-ring h-2.5 w-2.5 rounded-full border-2 border-accent" />}
    </div>
  );
}
