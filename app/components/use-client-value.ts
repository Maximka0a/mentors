"use client";

import { useCallback, useSyncExternalStore } from "react";

const LOCAL_EVENT = "local-storage-change";

function subscribeStorage(callback: () => void) {
  window.addEventListener("storage", callback);
  window.addEventListener(LOCAL_EVENT, callback);
  return () => {
    window.removeEventListener("storage", callback);
    window.removeEventListener(LOCAL_EVENT, callback);
  };
}

function readStorage(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

// Per-viewer convenience value in localStorage; null on the server and when storage is unavailable
export function useLocalStorage(key: string): [string | null, (value: string) => void] {
  const value = useSyncExternalStore(
    subscribeStorage,
    () => readStorage(key),
    () => null
  );
  const set = useCallback(
    (next: string) => {
      try {
        localStorage.setItem(key, next);
      } catch {}
      window.dispatchEvent(new Event(LOCAL_EVENT));
    },
    [key]
  );
  return [value, set];
}

const noopSubscribe = () => () => {};

// A browser-only fact that never changes after load (e.g. feature detection); false during SSR
export function useBrowserCheck(check: () => boolean): boolean {
  return useSyncExternalStore(noopSubscribe, check, () => false);
}
