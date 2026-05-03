/**
 * ProductSprint — Pre-Monetization Analytics & Soft Limits
 *
 * All functions are safe to call server-side (they no-op) and
 * fail silently on the client when Supabase isn't configured.
 */

// ─── Soft Daily Limits ────────────────────────────────────────────────────────

export const SOFT_LIMITS: Record<string, number> = {
  ideas:   3,
  planner: 1,
  seo:     3,
  tags:    3,
};

function todayKey(): string {
  return new Date().toISOString().split("T")[0]; // "2026-05-03"
}

function storageKey(feature: string): string {
  return `ps_limit_${todayKey()}_${feature}`;
}

export function getTodayUsage(feature: string): number {
  if (typeof window === "undefined") return 0;
  try {
    return parseInt(localStorage.getItem(storageKey(feature)) ?? "0", 10);
  } catch { return 0; }
}

export function incrementTodayUsage(feature: string): void {
  if (typeof window === "undefined") return;
  try {
    const n = getTodayUsage(feature) + 1;
    localStorage.setItem(storageKey(feature), String(n));
  } catch {}
}

export function isAtLimit(feature: string): boolean {
  const limit = SOFT_LIMITS[feature];
  if (limit === undefined) return false;          // unknown feature → unlimited
  return getTodayUsage(feature) >= limit;
}

export function remainingToday(feature: string): number {
  const limit = SOFT_LIMITS[feature] ?? Infinity;
  return Math.max(0, limit - getTodayUsage(feature));
}

// ─── Anonymous Session ID ─────────────────────────────────────────────────────

export function getSessionId(): string {
  if (typeof window === "undefined") return "ssr";
  try {
    let id = localStorage.getItem("ps_session_id");
    if (!id) {
      id = crypto.randomUUID();
      localStorage.setItem("ps_session_id", id);
    }
    return id;
  } catch { return "unknown"; }
}

// ─── Event Tracking ───────────────────────────────────────────────────────────

export async function trackEvent(
  eventName: string,
  metadata: Record<string, unknown> = {}
): Promise<void> {
  if (typeof window === "undefined") return; // server-side no-op
  try {
    fetch("/api/track", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        event_name: eventName,
        metadata: { session_id: getSessionId(), ...metadata },
      }),
    }).catch(() => {}); // fire-and-forget, never throw
  } catch {}
}
