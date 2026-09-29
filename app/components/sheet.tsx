"use client";

import { useEffect } from "react";

// Full-screen on phones, centered panel on larger screens
export function Sheet({ onClose, children }: { onClose: () => void; children: React.ReactNode }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = overflow;
    };
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex sm:items-center sm:justify-center sm:p-6 bg-black/40" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        className="relative w-full sm:max-w-2xl max-h-full sm:max-h-[90vh] overflow-y-auto bg-bg sm:rounded-2xl sm:border sm:border-line shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 z-10 flex justify-end bg-bg/90 backdrop-blur px-3 pt-[max(0.75rem,env(safe-area-inset-top))] pb-1">
          <button onClick={onClose} className="rounded-lg px-3 py-1.5 text-sm text-muted hover:text-fg hover:bg-surface-2">
            Закрыть
          </button>
        </div>
        <div className="px-4 pb-[max(1.5rem,env(safe-area-inset-bottom))] sm:px-6">{children}</div>
      </div>
    </div>
  );
}
