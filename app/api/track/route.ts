/**
 * POST /api/track
 * Inserts an anonymous analytics event into Supabase.
 * Silently succeeds (200) even when Supabase isn't configured —
 * this keeps the frontend from throwing errors in dev mode.
 */
import { NextRequest, NextResponse } from "next/server";
import { isSupabaseConfigured } from "@/lib/supabaseConfigured";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const isDev = process.env.NODE_ENV === "development";

export async function POST(req: NextRequest) {
  try {
    const { event_name, metadata } = await req.json();
    if (!event_name) {
      return NextResponse.json({ error: "event_name is required" }, { status: 400 });
    }

    if (isDev) {
      console.log(`[track] ${event_name}`, metadata ?? {});
    }

    // If Supabase isn't configured yet (or still has placeholder values), just acknowledge
    if (!isSupabaseConfigured()) {
      return NextResponse.json({ ok: true, stored: false });
    }

    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/analytics_events`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          apikey: SUPABASE_SERVICE_KEY!,
          Authorization: `Bearer ${SUPABASE_SERVICE_KEY!}`,
          Prefer: "return=minimal",
        },
        body: JSON.stringify({
          event_name,
          metadata: metadata ?? {},
          session_id: (metadata as Record<string, unknown>)?.session_id ?? null,
        }),
      }
    );

    if (!res.ok && isDev) {
      console.warn("[track] Supabase insert failed:", await res.text());
    }

    return NextResponse.json({ ok: true, stored: res.ok });
  } catch (err) {
    if (isDev) console.error("[track] Error:", err);
    // Always return 200 — tracking errors must never break the UI
    return NextResponse.json({ ok: true, stored: false });
  }
}
