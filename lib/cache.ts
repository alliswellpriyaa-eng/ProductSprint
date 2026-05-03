/**
 * Client-side localStorage cache with 24-hour TTL.
 * All keys are namespaced with "ps_cache_" to avoid collisions.
 */

const CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours
const NS = "ps_cache_";

export function cacheKey(...parts: string[]): string {
  return parts
    .map((p) => p.toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_|_$/g, ""))
    .join("__");
}

export function getCache<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(`${NS}${key}`);
    if (!raw) return null;
    const parsed: { data: T; expiry: number } = JSON.parse(raw);
    if (Date.now() > parsed.expiry) {
      localStorage.removeItem(`${NS}${key}`);
      return null;
    }
    return parsed.data;
  } catch {
    return null;
  }
}

export function setCache<T>(key: string, data: T, ttlMs = CACHE_TTL): void {
  try {
    localStorage.setItem(
      `${NS}${key}`,
      JSON.stringify({ data, expiry: Date.now() + ttlMs })
    );
  } catch {
    // localStorage full or unavailable — silently skip
  }
}

export function isCached(key: string): boolean {
  return getCache(key) !== null;
}

export function clearCache(key: string): void {
  try {
    localStorage.removeItem(`${NS}${key}`);
  } catch { /* no-op */ }
}
