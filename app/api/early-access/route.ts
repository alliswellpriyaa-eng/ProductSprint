/**
 * POST /api/early-access
 * Saves an email address to the early_access table.
 * Also tracks an email_submitted event.
 */
import { NextRequest, NextResponse } from "next/server";
import { isSupabaseConfigured } from "@/lib/supabaseConfigured";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const isDev = process.env.NODE_ENV === "development";

export async function POST(req: NextRequest) {
  try {
    const { email, source } = await req.json();

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: "Valid email is required" }, { status: 400 });
    }

    if (isDev) {
      console.log(`[early-access] Email: ${email}, Source: ${source}`);
    }

    // If Supabase isn't configured (or still has placeholder values), acknowledge without storing
    if (!isSupabaseConfigured()) {
      return NextResponse.json({ ok: true, stored: false });
    }

    // Insert into early_access table
    const insertRes = await fetch(`${SUPABASE_URL}/rest/v1/early_access`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: SUPABASE_SERVICE_KEY!,
        Authorization: `Bearer ${SUPABASE_SERVICE_KEY!}`,
        Prefer: "return=minimal",
      },
      body: JSON.stringify({ email, source: source ?? "unknown" }),
    });

    if (!insertRes.ok && isDev) {
      const text = await insertRes.text();
      // 409 = duplicate email (unique constraint), that's fine
      if (!text.includes("duplicate") && !text.includes("unique")) {
        console.warn("[early-access] Insert failed:", text);
      }
    }

    // Also track the event
    await fetch(`${SUPABASE_URL}/rest/v1/analytics_events`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: SUPABASE_SERVICE_KEY!,
        Authorization: `Bearer ${SUPABASE_SERVICE_KEY!}`,
        Prefer: "return=minimal",
      },
      body: JSON.stringify({
        event_name: "email_submitted",
        metadata: { source: source ?? "unknown" },
      }),
    }).catch(() => {});

    return NextResponse.json({ ok: true, stored: true });
  } catch (err) {
    if (isDev) console.error("[early-access] Error:", err);
    return NextResponse.json({ error: "Failed to save email" }, { status: 500 });
  }
}
