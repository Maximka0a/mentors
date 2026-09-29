"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export type RecorderState = "idle" | "recording" | "transcribing";

const MAX_SECONDS = 180;
// Order matters: iOS Safari only records mp4/aac, Chrome/Android records webm/opus
const MIME_CANDIDATES = ["audio/webm;codecs=opus", "audio/webm", "audio/mp4", "audio/ogg;codecs=opus"];

function pickMimeType(): string | undefined {
  if (typeof MediaRecorder === "undefined") return undefined;
  return MIME_CANDIDATES.find((m) => MediaRecorder.isTypeSupported(m));
}

export function isVoiceSupported(): boolean {
  return typeof window !== "undefined" && !!navigator.mediaDevices?.getUserMedia && typeof MediaRecorder !== "undefined";
}

export function useVoiceRecorder(onText: (text: string) => void) {
  const [state, setState] = useState<RecorderState>("idle");
  const [seconds, setSeconds] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const onTextRef = useRef(onText);
  useEffect(() => {
    onTextRef.current = onText;
  }, [onText]);

  const cleanupTimer = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = null;
  };

  useEffect(
    () => () => {
      cleanupTimer();
      recorderRef.current?.stream.getTracks().forEach((t) => t.stop());
    },
    []
  );

  const transcribe = useCallback(async (blob: Blob) => {
    setState("transcribing");
    try {
      const form = new FormData();
      form.append("audio", blob, "answer");
      const res = await fetch("/api/transcribe", { method: "POST", body: form });
      const data = await res.json().catch(() => null);
      if (!res.ok) throw new Error(data?.message ?? "Не удалось распознать речь");
      if (data.text) onTextRef.current(data.text);
      else setError("Речь не распознана — попробуй ещё раз, ближе к микрофону");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Не удалось распознать речь");
    } finally {
      setState("idle");
    }
  }, []);

  const stop = useCallback(() => {
    cleanupTimer();
    if (recorderRef.current?.state === "recording") recorderRef.current.stop();
  }, []);

  const start = useCallback(async () => {
    setError(null);
    let stream: MediaStream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true } });
    } catch {
      setError("Нет доступа к микрофону — разреши его в настройках браузера");
      return;
    }

    const mimeType = pickMimeType();
    const recorder = new MediaRecorder(stream, mimeType ? { mimeType, audioBitsPerSecond: 32_000 } : undefined);
    const chunks: Blob[] = [];
    recorder.ondataavailable = (e) => e.data.size && chunks.push(e.data);
    recorder.onstop = () => {
      stream.getTracks().forEach((t) => t.stop());
      const blob = new Blob(chunks, { type: recorder.mimeType || mimeType || "audio/webm" });
      if (blob.size > 0) transcribe(blob);
      else setState("idle");
    };
    recorderRef.current = recorder;
    recorder.start(1000);
    setSeconds(0);
    setState("recording");
    timerRef.current = setInterval(() => {
      setSeconds((s) => {
        if (s + 1 >= MAX_SECONDS) stop();
        return s + 1;
      });
    }, 1000);
  }, [stop, transcribe]);

  return { state, seconds, error, start, stop, maxSeconds: MAX_SECONDS };
}
