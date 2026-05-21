/**
 * geminiCall — runs a Gemini prompt through a model fallback chain.
 * Tries gemini-2.5-flash first, falls back to gemini-2.5-flash-lite.
 * Each attempt uses retryGemini (exponential backoff) + withTimeout (15s).
 *
 * Returns { rawText, modelUsed } on success, throws if all models fail.
 */
import { GoogleGenerativeAI, type GenerateContentRequest } from "@google/generative-ai";
import { retryGemini } from "@/lib/retryGemini";
import { withTimeout } from "@/lib/withTimeout";

const DEFAULT_MODELS = ["gemini-2.5-flash-lite", "gemini-2.5-flash"] as const;
const DEFAULT_TIMEOUT_MS = 15_000;

type GenerateInput = string | GenerateContentRequest;

interface GeminiCallOptions {
  /** Override the model fallback list (e.g. ["gemini-2.5-flash-lite"] for faster routes) */
  models?: readonly string[];
  /** Per-attempt timeout in ms (default: 15 000) */
  timeoutMs?: number;
}

export async function geminiCall(
  apiKey: string,
  prompt: GenerateInput,
  generationConfig?: Record<string, unknown>,
  options?: GeminiCallOptions
): Promise<{ rawText: string; modelUsed: string }> {
  const genAI = new GoogleGenerativeAI(apiKey);
  const models = options?.models ?? DEFAULT_MODELS;
  const timeoutMs = options?.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  let lastError: unknown;

  for (const modelName of models) {
    try {
      const model = genAI.getGenerativeModel({
        model: modelName,
        generationConfig: generationConfig as Parameters<typeof genAI.getGenerativeModel>[0]["generationConfig"],
      });

      const result = await withTimeout(
        retryGemini(() => model.generateContent(prompt as string)),
        timeoutMs
      );

      const rawText = result.response.text();
      if (!rawText || rawText.trim().length < 5) {
        throw new Error(`Empty response from ${modelName}`);
      }

      return { rawText, modelUsed: modelName };

    } catch (err) {
      console.error(`[geminiCall] Model failed: ${modelName}`, err instanceof Error ? err.message : err);
      lastError = err;
    }
  }

  throw lastError ?? new Error("All Gemini models failed");
}
