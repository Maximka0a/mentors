"use client";

import { isVoiceSupported, useVoiceRecorder } from "./use-voice-recorder";
import { useBrowserCheck } from "./use-client-value";

function formatTime(s: number) {
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
}

export function AnswerInput({
  value,
  onChange,
  onVoiceUsed,
  disabled,
  autoFocus,
}: {
  value: string;
  onChange: (v: string) => void;
  onVoiceUsed: () => void;
  disabled?: boolean;
  autoFocus?: boolean;
}) {
  const voiceAvailable = useBrowserCheck(isVoiceSupported);
  const recorder = useVoiceRecorder((text) => {
    onChange(value.trim() ? `${value.trim()}\n${text}` : text);
    onVoiceUsed();
  });

  const recording = recorder.state === "recording";
  const transcribing = recorder.state === "transcribing";

  return (
    <div className="flex flex-col gap-2">
      <div className="relative">
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled || recording || transcribing}
          autoFocus={autoFocus}
          placeholder={voiceAvailable ? "Ответь текстом или надиктуй 🎤" : "Напиши свой ответ"}
          rows={5}
          className="w-full rounded-xl border border-line bg-surface px-3.5 py-3 text-[15px] leading-relaxed placeholder:text-faint focus:outline-none focus:border-accent resize-y min-h-32 disabled:opacity-60"
        />
        {transcribing && (
          <div className="absolute inset-0 grid place-items-center rounded-xl bg-surface/80 text-sm text-muted">
            Расшифровываю запись…
          </div>
        )}
      </div>

      {voiceAvailable && (
        <button
          type="button"
          onClick={recording ? recorder.stop : recorder.start}
          disabled={disabled || transcribing}
          className={`flex items-center justify-center gap-2 rounded-xl border py-3 text-sm font-medium transition-colors disabled:opacity-50 ${
            recording
              ? "border-status-red bg-status-red/10 text-status-red"
              : "border-line bg-surface text-fg hover:bg-surface-2"
          }`}
        >
          <span className={`h-2.5 w-2.5 rounded-full ${recording ? "bg-status-red animate-pulse" : "bg-faint"}`} />
          {recording
            ? `Остановить запись · ${formatTime(recorder.seconds)} / ${formatTime(recorder.maxSeconds)}`
            : value.trim()
              ? "🎤 Дописать голосом"
              : "🎤 Ответить голосом"}
        </button>
      )}
      {recorder.error && <p className="text-xs text-status-red">{recorder.error}</p>}
    </div>
  );
}
