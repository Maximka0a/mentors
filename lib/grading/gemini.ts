import { GRADING_CONFIG } from "./config";

const API_BASE = "https://generativelanguage.googleapis.com/v1beta";

export class GeminiError extends Error {
  constructor(
    public code: "no_key" | "timeout" | "rate_limit" | "bad_response" | "blocked" | "http",
    message: string,
    public details?: string,
    public status?: number
  ) {
    super(message);
  }
}

function apiKey(): string {
  const key = process.env.GEMINI_API_KEY;
  if (!key) throw new GeminiError("no_key", "GEMINI_API_KEY не настроен на сервере");
  return key;
}

let cachedModels: { names: string[]; at: number } | null = null;

/**
 * Stable "gemini-X.Y-flash" models the key has access to, newest first, so an outdated
 * hardcoded name can't silently break grading. GEMINI_MODEL pins the first choice.
 */
export async function resolveModels(): Promise<string[]> {
  if (!cachedModels || Date.now() - cachedModels.at >= GRADING_CONFIG.modelCacheTtlMs) {
    let names: string[] = [];
    try {
      const res = await fetch(`${API_BASE}/models?pageSize=1000`, {
        headers: { "X-goog-api-key": apiKey() },
        signal: AbortSignal.timeout(5000),
      });
      if (res.ok) {
        const data: { models?: { name: string; supportedGenerationMethods?: string[] }[] } = await res.json();
        names = (data.models ?? [])
          .filter((m) => m.supportedGenerationMethods?.includes("generateContent"))
          .map((m) => {
            const match = /^models\/(gemini-(\d+(?:\.\d+)?)-flash)$/.exec(m.name);
            return match ? { name: match[1], version: Number(match[2]) } : null;
          })
          .filter((m): m is { name: string; version: number } => m !== null)
          .sort((a, b) => b.version - a.version)
          .map((m) => m.name);
      }
    } catch (e) {
      if (e instanceof GeminiError) throw e;
    }
    if (names.length === 0) names = [GRADING_CONFIG.fallbackModel];
    cachedModels = { names, at: Date.now() };
  }

  const pinned = process.env.GEMINI_MODEL;
  const names = cachedModels.names.slice(0, GRADING_CONFIG.maxModelsToTry);
  return pinned ? [pinned, ...names.filter((n) => n !== pinned)] : names;
}

export async function resolveModel(): Promise<string> {
  return (await resolveModels())[0];
}

type Part = { text: string } | { inlineData: { mimeType: string; data: string } };

export async function generateJson<T>(opts: {
  systemInstruction?: string;
  parts: Part[];
  schema: object;
  validate: (value: unknown) => value is T;
}): Promise<{ value: T; model: string }> {
  const models = await resolveModels();
  const deadline = Date.now() + GRADING_CONFIG.totalBudgetMs;
  let lastError: GeminiError | null = null;

  // Each model gets a retry; on overload/unknown-model we move on to the previous stable version
  for (const model of models) {
    for (let attempt = 0; attempt <= GRADING_CONFIG.retries; attempt++) {
      const remaining = deadline - Date.now();
      if (remaining < 5000) throw lastError ?? new GeminiError("timeout", "Gemini не ответил вовремя");
      try {
        const value = await callOnce(model, opts, Math.min(GRADING_CONFIG.requestTimeoutMs, remaining));
        if (!opts.validate(value)) {
          throw new GeminiError("bad_response", "Модель вернула ответ не по схеме");
        }
        return { value, model };
      } catch (e) {
        lastError = e instanceof GeminiError ? e : new GeminiError("http", String(e));
        if (["no_key", "rate_limit", "blocked"].includes(lastError.code)) throw lastError;
        if (lastError.status === 503 || lastError.status === 404) break; // try the next model
        if (lastError.status && lastError.status >= 500) await sleep(1000 * (attempt + 1));
      }
    }
  }
  throw lastError ?? new GeminiError("http", "Gemini недоступен");
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function callOnce(
  model: string,
  opts: { systemInstruction?: string; parts: Part[]; schema: object },
  timeoutMs: number
): Promise<unknown> {
  let res: Response;
  try {
    res = await fetch(`${API_BASE}/models/${model}:generateContent`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-goog-api-key": apiKey() },
      body: JSON.stringify({
        ...(opts.systemInstruction ? { systemInstruction: { parts: [{ text: opts.systemInstruction }] } } : {}),
        contents: [{ role: "user", parts: opts.parts }],
        generationConfig: {
          temperature: GRADING_CONFIG.temperature,
          responseMimeType: "application/json",
          responseJsonSchema: opts.schema,
        },
      }),
      signal: AbortSignal.timeout(timeoutMs),
    });
  } catch (e) {
    if (e instanceof Error && (e.name === "TimeoutError" || e.name === "AbortError")) {
      throw new GeminiError("timeout", "Gemini не ответил вовремя");
    }
    throw new GeminiError("http", "Не удалось связаться с Gemini", String(e));
  }

  if (res.status === 429) {
    throw new GeminiError("rate_limit", "Превышен лимит запросов к Gemini, подожди минуту", await res.text(), 429);
  }
  if (res.status === 503) {
    throw new GeminiError("http", "Gemini сейчас перегружен, попробуй через минуту", await res.text(), 503);
  }
  if (!res.ok) {
    throw new GeminiError("http", `Gemini вернул ошибку ${res.status}`, await res.text(), res.status);
  }

  const data = await res.json();
  if (data?.promptFeedback?.blockReason) {
    throw new GeminiError("blocked", "Gemini отказался обрабатывать запрос", data.promptFeedback.blockReason);
  }
  const text: string | undefined = data?.candidates?.[0]?.content?.parts
    ?.map((p: { text?: string }) => p.text ?? "")
    .join("");
  if (!text) throw new GeminiError("bad_response", "Пустой ответ от Gemini");

  try {
    return JSON.parse(text);
  } catch {
    throw new GeminiError("bad_response", "Gemini вернул невалидный JSON", text.slice(0, 500));
  }
}
