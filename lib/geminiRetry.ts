/**
 * withGeminiRetry — wraps a Gemini generateContent call with automatic
 * retry on 503 Service Unavailable (server overload). Waits `delayMs`
 * before the second attempt. Any other error is re-thrown immediately.
 */

const is503 = (e: unknown): boolean => {
  const msg = e instanceof Error ? e.message : String(e);
  return (
    msg.includes("503") ||
    msg.includes("high demand") ||
    msg.includes("Service Unavailable") ||
    msg.includes("temporarily")
  );
};

export async function withGeminiRetry<T>(
  fn: () => Promise<T>,
  { retries = 1, delayMs = 5000, label = "gemini" } = {}
): Promise<T> {
  let attempt = 0;
  while (true) {
    try {
      return await fn();
    } catch (err: unknown) {
      if (is503(err) && attempt < retries) {
        attempt++;
        console.log(`[${label}] 503 on attempt ${attempt}, retrying in ${delayMs}ms…`);
        await new Promise((r) => setTimeout(r, delayMs));
      } else {
        throw err;
      }
    }
  }
}
