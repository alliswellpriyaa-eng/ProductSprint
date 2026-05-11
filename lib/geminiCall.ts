/**
 * geminiCall — runs a Gemini prompt through a model fallback chain.
 * Tries gemini-2.5-flash first, falls back to gemini-1.5-flash.
 * Each attempt uses retryGemini (exponential backoff) + withTimeout (15s).
 *
 * Returns { rawText, modelUsed } on success, throws if all models fail.
 */
import { GoogleGenerativeAI, type GenerateContentRequest } from "@google/generative-ai";
import { retryGemini } from "@/lib/retryGemini";
import { withTimeout } from "@/lib/withTimeout";

const MODELS = ["gemini-2.5-flash", "gemini-1.5-flash"] as const;
const TIMEOUT_MS = 15_000;

type GenerateInput = string | GenerateContentRequest;

export async function geminiCall(
  apiKey: string,
  prompt: GenerateInput,
  generationConfig?: Record<string, unknown>
): Promise<{ rawText: string; modelUsed: string }> {
  const genAI = new GoogleGenerativeAI(apiKey);
  let lastError: unknown;

  for (const modelName of MODELS) {
    try {
      const model = genAI.getGenerativeModel({
        model: modelName,
        generationConfig: generationConfig as Parameters<typeof genAI.getGenerativeModel>[0]["generationConfig"],
      });

      const result = await withTimeout(
        retryGemini(() => model.generateContent(prompt as string)),
        TIMEOUT_MS
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
