"use client";

import { useQuery } from "@tanstack/react-query";
import type { PackTopics } from "../types";
import { getJson } from "./api-client";

// Packs are never mixed: a session always runs inside exactly one pack
export const DEFAULT_PACK = "extended";

export interface Scope {
  pack: string | null;
  topic: string | null; // null = all topics
}

// Pack + topic selector shared by the study and mock-interview setup screens
export function ScopePicker({ value, onChange }: { value: Scope; onChange: (s: Scope) => void }) {
  const { data: packs } = useQuery({ queryKey: ["topics"], queryFn: () => getJson<PackTopics[]>("/api/topics") });
  const enabledPacks = packs?.filter((p) => p.enabled) ?? [];
  const selectedPack = packs?.find((p) => p.slug === value.pack);

  return (
    <div className="flex flex-col gap-4">
      <div>
        <p className="mb-2 text-sm text-muted">Пак</p>
        <div className="flex flex-wrap gap-2">
          {enabledPacks.map((p) => (
            <Chip key={p.slug} active={value.pack === p.slug} onClick={() => onChange({ pack: p.slug, topic: null })}>
              {p.name}
            </Chip>
          ))}
        </div>
        {packs && enabledPacks.length === 0 && (
          <p className="mt-2 text-sm text-status-red">Все паки выключены — включи хотя бы один на главной.</p>
        )}
      </div>

      {selectedPack && (
        <div>
          <p className="mb-2 text-sm text-muted">Тема</p>
          <select
            value={value.topic ?? ""}
            onChange={(e) => onChange({ ...value, topic: e.target.value || null })}
            className="w-full rounded-xl border border-line bg-surface px-3.5 py-3 text-[15px] focus:outline-none focus:border-accent"
          >
            <option value="">Все темы</option>
            {selectedPack.topics.map((t) => (
              <option key={t.name} value={t.name}>
                {t.name} ({t.total}, к повторению {t.due})
              </option>
            ))}
          </select>
        </div>
      )}
    </div>
  );
}

function Chip({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={`rounded-lg border px-3 py-2 text-sm transition-colors ${
        active ? "border-accent bg-accent-soft text-accent" : "border-line bg-surface text-muted hover:text-fg"
      }`}
    >
      {children}
    </button>
  );
}

export function scopeQuery(scope: Scope): string {
  const params = new URLSearchParams();
  if (scope.pack) params.set("pack", scope.pack);
  if (scope.topic) params.set("topic", scope.topic);
  const s = params.toString();
  return s ? `?${s}` : "";
}
