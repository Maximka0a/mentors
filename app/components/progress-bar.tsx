import type { TopicSummary } from "../types";

export function ProgressBar({ t, className = "h-2" }: { t: Pick<TopicSummary, "total" | "green" | "yellow" | "red">; className?: string }) {
  const pct = (n: number) => (t.total ? (n / t.total) * 100 : 0);
  return (
    <div className={`flex w-full overflow-hidden rounded-full bg-status-new/40 ${className}`}>
      <div className="bg-status-green" style={{ width: `${pct(t.green)}%` }} />
      <div className="bg-status-yellow" style={{ width: `${pct(t.yellow)}%` }} />
      <div className="bg-status-red" style={{ width: `${pct(t.red)}%` }} />
    </div>
  );
}

export function ProgressCounts({ t }: { t: Pick<TopicSummary, "green" | "yellow" | "red" | "fresh"> }) {
  return (
    <span className="flex gap-2.5 text-xs tabular-nums text-muted">
      <span>🟢 {t.green}</span>
      <span>🟡 {t.yellow}</span>
      <span>🔴 {t.red}</span>
      <span className="text-faint">⚪ {t.fresh}</span>
    </span>
  );
}
