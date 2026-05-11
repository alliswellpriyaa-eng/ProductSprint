/**
 * withTimeout — races a promise against a timeout.
 * Rejects with Error("Timeout") if the promise takes longer than `ms`.
 */
export async function withTimeout<T>(
  promise: Promise<T>,
  ms = 15000
): Promise<T> {
  const timeout = new Promise<never>((_, reject) =>
    setTimeout(() => reject(new Error("Timeout")), ms)
  );

  return Promise.race([promise, timeout]);
}
