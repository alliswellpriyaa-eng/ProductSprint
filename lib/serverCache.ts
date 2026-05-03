/**
 * Server-side in-memory cache for Next.js API routes.
 *
 * Lives in module scope — persists for the lifetime of the server process
 * (or until a cold start on serverless). Good for reducing repeated Gemini
 * calls for the same niche/idea combos within a deployment instance.
 *
 * Default TTL: 1 hour. Pass a custom ttlMs to override per-call.
 */

const DEFAULT_TTL = 60 * 60 * 1000; // 1 hour

interface CacheEntry<T> {
  data: T;
  expiry: number;
}

const store = new Map<string, CacheEntry<unknown>>();

export function getServerCache<T>(key: string): T | null {
  const entry = store.get(key) as CacheEntry<T> | undefined;
  if (!entry) return null;
  if (Date.now() > entry.expiry) {
    store.delete(key);
    return null;
  }
  return entry.data;
}

export function setServerCache<T>(key: string, data: T, ttlMs = DEFAULT_TTL): void {
  store.set(key, { data, expiry: Date.now() + ttlMs });
}

/** Normalise a cache key — lowercase, collapse whitespace to underscore */
export function serverCacheKey(...parts: string[]): string {
  return parts
    .map((p) => p.toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_|_$/g, ""))
    .join("__");
}

export function serverCacheSize(): number {
  return store.size;
}
