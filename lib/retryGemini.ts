/**
 * retryGemini — retries a Gemini API call with exponential backoff.
 * Retries on transient errors: 503, RATE_LIMIT, high demand, overloaded.
 * Throws immediately on non-retryable errors (auth, safety, etc.).
 */
export async function retryGemini<T>(
  fn: () => Promise<T>,
  retries = 3
): Promise<T> {
  let lastError: unknown;

  for (let i = 0; i < retries; i++) {
    try {
      return await fn();
    } catch (error: unknown) {
      lastError = error;

      const msg = String((error as Error)?.message || "");

      const retryable =
        msg.includes("503") ||
        msg.includes("RATE_LIMIT") ||
        msg.includes("high demand") ||
        msg.includes("overloaded") ||
        msg.includes("Service Unavailable") ||
        msg.includes("temporarily") ||
        msg.includes("429");

      if (!retryable || i === retries - 1) {
        throw error;
      }

      const delay = 1000 * Math.pow(2, i); // 1s, 2s, 4s
      console.log(`[retryGemini] attempt ${i + 1} failed (retryable), retrying in ${delay}ms…`);
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }

  throw lastError;
}
