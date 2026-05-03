/**
 * GET /api/user
 * Returns the current user's plan + today's usage counts.
 * Used by the frontend AuthProvider to display usage badges.
 */
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getUserPlan, getAllTodayUsage, ensureUserExists, FREE_LIMITS } from "@/lib/usage";

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    return NextResponse.json({ error: "UNAUTHENTICATED" }, { status: 401 });
  }

  await ensureUserExists(user.id, user.email!);

  const [plan, usage] = await Promise.all([
    getUserPlan(user.id),
    getAllTodayUsage(user.id),
  ]);

  return NextResponse.json({
    id: user.id,
    email: user.email,
    plan,
    usage,
    limits: FREE_LIMITS,
  });
}
