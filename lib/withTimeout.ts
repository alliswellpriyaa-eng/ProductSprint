/**
 * withTimeout — races a promise against a timeout, clearing the timer on resolution.
 * Rejects with Error("Timeout") if the promise takes longer than `ms`.
 */
export async function withTimeout<T>(
  promise: Promise<T>,
  ms: number
): Promise<T> {
  let timeoutId: NodeJS.Timeout;

  const timeoutPromise = new Promise<never>((_, reject) => {
    timeoutId = setTimeout(() => {
      reject(new Error("Timeout"));
    }, ms);
  });

  return Promise.race([
    promise,
    timeoutPromise,
  ]).finally(() => {
    clearTimeout(timeoutId);
  });
}
