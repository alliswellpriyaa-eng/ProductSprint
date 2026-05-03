/**
 * API authentication + usage-limit middleware.
 *
 * Set MONETIZATION_ENABLED=true in .env.local to enforce auth & limits.
 * When false (default during development), all routes work without login.
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "./supabase/server";
import { canUseFeature, trackUsage, ensureUserExists } from "./usage";

const MONETIZATION_ENABLED = process.env.MONETIZATION_ENABLED === "true";

export async function withUsageCheck(
  _req: NextRequest,
  feature: string,
  handler: (userId: string | null) => Promise<NextResponse>
): Promise<NextResponse> {
  // ── Dev bypass: run without auth when monetization is disabled ────────────
  if (!MONETIZATION_ENABLED) {
    return handler(null);
  }

  // ── Verify auth session ───────────────────────────────────────────────────
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    return NextResponse.json(
      {
        error: "UNAUTHENTICATED",
        message: "Please sign in to continue.",
        signInRequired: true,
      },
      { status: 401 }
    );
  }

  // Ensure user row exists (first-login auto-provision)
  await ensureUserExists(user.id, user.email!);

  // ── Check usage limit ─────────────────────────────────────────────────────
  const { allowed, plan, used, limit } = await canUseFeature(user.id, feature);

  if (!allowed) {
    return NextResponse.json(
      {
        error: "LIMIT_REACHED",
        message:
          "You've reached your free daily limit. Upgrade to Sprint Pro for unlimited access.",
        upgradeRequired: true,
        plan,
        used,
        limit,
      },
      { status: 403 }
    );
  }

  // ── Call the handler ──────────────────────────────────────────────────────
  const response = await handler(user.id);

  // Track usage after a successful (non-error) response
  if (response.status < 400) {
    trackUsage(user.id, feature).catch(console.error);
  }

  return response;
}
