import { Suspense } from "react";
import { StudyClient } from "./study-client";

export default function StudyPage() {
  return (
    <Suspense fallback={<p className="py-16 text-center text-muted">Загрузка…</p>}>
      <StudyClient />
    </Suspense>
  );
}
