import { NextRequest, NextResponse } from "next/server";
import { generateJson, GeminiError } from "@/lib/grading/gemini";

export const maxDuration = 60;

// Vercel caps request bodies at ~4.5 MB; opus audio is ~1 MB for several minutes
const MAX_BYTES = 4 * 1024 * 1024;

const SCHEMA = {
  type: "object",
  properties: { text: { type: "string" } },
  required: ["text"],
};

const PROMPT = `Расшифруй эту аудиозапись дословно. Это ответ на техническом собеседовании по Android/Kotlin на русском языке с английскими терминами.
Правила:
- Английские технические термины, названия классов, методов и аннотаций пиши латиницей в каноническом виде: ViewModel, LaunchedEffect, onCreate(), @Composable, Dispatchers.IO, HashMap.
- Не исправляй смысл, не добавляй ничего от себя, не сокращай. Убери только слова-паразиты («эээ», «ну»).
- Расставь пунктуацию и разбей на абзацы по смыслу.
- Если речи нет — верни пустую строку.`;

export async function POST(req: NextRequest) {
  const form = await req.formData().catch(() => null);
  const file = form?.get("audio");
  if (!(file instanceof Blob) || file.size === 0) {
    return NextResponse.json({ error: "invalid_input", message: "Нет аудио" }, { status: 400 });
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json({ error: "too_large", message: "Запись слишком длинная" }, { status: 413 });
  }

  const mimeType = (file.type || "audio/webm").split(";")[0];
  const data = Buffer.from(await file.arrayBuffer()).toString("base64");

  try {
    const { value } = await generateJson({
      parts: [{ inlineData: { mimeType, data } }, { text: PROMPT }],
      schema: SCHEMA,
      validate: (v): v is { text: string } => !!v && typeof (v as { text?: unknown }).text === "string",
    });
    return NextResponse.json({ text: value.text.trim() });
  } catch (e) {
    if (e instanceof GeminiError) {
      console.error("transcription failed", e.code, e.message, e.details?.slice(0, 1000));
      const status = e.code === "rate_limit" ? 429 : e.code === "timeout" ? 504 : 502;
      return NextResponse.json({ error: e.code, message: e.message }, { status });
    }
    console.error("transcription failed", e);
    return NextResponse.json({ error: "internal", message: "Не удалось распознать речь" }, { status: 500 });
  }
}
