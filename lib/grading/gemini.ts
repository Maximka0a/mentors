import { GRADING_CONFIG } from "./config";

const API_BASE = "https://generativelanguage.googleapis.com/v1beta";

export class GeminiError extends Error {
  constructor(
    public code: "no_key" | "timeout" | "rate_limit" | "bad_response" | "blocked" | "http",
    message: string,
    public details?: string
  ) {
    super(message);
  }
}

function apiKey(): string {
  const key = process.env.GEMINI_API_KEY;
  if (!key) throw new GeminiError("no_key", "GEMINI_API_KEY не настроен на сервере");
  return key;
}

let cachedModel: { name: string; at: number } | null = null;

/**
 * Picks the newest stable "gemini-X.Y-flash" model the key has access to, so an
 * outdated hardcoded name can't silently break grading. GEMINI_MODEL overrides it.
 */
export async function resolveModel(): Promise<string> {
  if (process.env.GEMINI_MODEL) return process.env.GEMINI_MODEL;
  if (cachedModel && Date.now() - cachedModel.at < GRADING_CONFIG.modelCacheTtlMs) return cachedModel.name;

  try {
    const res = await fetch(`${API_BASE}/models?pageSize=1000`, {
      headers: { "X-goog-api-key": apiKey() },
      signal: AbortSignal.timeout(5000),
    });
    if (res.ok) {
      const data: { models?: { name: string; supportedGenerationMethods?: string[] }[] } = await res.json();
      const candidates = (data.models ?? [])
        .filter((m) => m.supportedGenerationMethods?.includes("generateContent"))
        .map((m) => {
          const match = /^models\/(gemini-(\d+(?:\.\d+)?)-flash)$/.exec(m.name);
          return match ? { name: match[1], version: Number(match[2]) } : null;
        })
        .filter((m): m is { name: string; version: number } => m !== null)
        .sort((a, b) => b.version - a.version);
      if (candidates[0]) {
        cachedModel = { name: candidates[0].name, at: Date.now() };
        return cachedModel.name;
      }
    }
  } catch (e) {
    if (e instanceof GeminiError) throw e;
    // fall through to fallback model
  }
  return GRADING_CONFIG.fallbackModel;
}

type Part = { text: string } | { inlineData: { mimeType: string; data: string } };

export async function generateJson<T>(opts: {
  systemInstruction?: string;
  parts: Part[];
  schema: object;
  validate: (value: unknown) => value is T;
}): Promise<{ value: T; model: string }> {
  const model = await resolveModel();
  let lastError: GeminiError | null = null;

  for (let attempt = 0; attempt <= GRADING_CONFIG.retries; attempt++) {
    try {
      const value = await callOnce(model, opts);
      if (!opts.validate(value)) {
        throw new GeminiError("bad_response", "Модель вернула ответ не по схеме");
      }
      return { value, model };
    } catch (e) {
      lastError = e instanceof GeminiError ? e : new GeminiError("http", String(e));
      // Retrying won't help for these
      if (["no_key", "rate_limit", "blocked"].includes(lastError.code)) break;
    }
  }
  throw lastError!;
}

async function callOnce(
  model: string,
  opts: { systemInstruction?: string; parts: Part[]; schema: object }
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
      signal: AbortSignal.timeout(GRADING_CONFIG.requestTimeoutMs),
    });
  } catch (e) {
    if (e instanceof Error && (e.name === "TimeoutError" || e.name === "AbortError")) {
      throw new GeminiError("timeout", "Gemini не ответил вовремя");
    }
    throw new GeminiError("http", "Не удалось связаться с Gemini", String(e));
  }

  if (res.status === 429) {
    throw new GeminiError("rate_limit", "Превышен лимит запросов к Gemini, подожди минуту", await res.text());
  }
  if (!res.ok) {
    throw new GeminiError("http", `Gemini вернул ошибку ${res.status}`, await res.text());
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
