import { createAdminClient } from "./supabase/admin";

// ─── Free tier limits (per day) ───────────────────────────────────────────────
export const FREE_LIMITS: Record<string, number> = {
  generate_ideas: 3,
  generate_planner: 1,
  generate_seo: 3,
  generate_tags: 3,
  create_product: 1,
  export_pdf: 0, // Premium only
};

export type Plan = "free" | "premium";

// ─── Get user plan from DB ────────────────────────────────────────────────────
export async function getUserPlan(userId: string): Promise<Plan> {
  const supabase = createAdminClient();
  const { data } = await supabase
    .from("users")
    .select("plan")
    .eq("id", userId)
    .single();
  return (data?.plan as Plan) ?? "free";
}

// ─── Count today's usage for a feature ───────────────────────────────────────
export async function getTodayUsage(
  userId: string,
  feature: string
): Promise<number> {
  const supabase = createAdminClient();
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  const { count } = await supabase
    .from("usage_events")
    .select("*", { count: "exact", head: true })
    .eq("user_id", userId)
    .eq("feature", feature)
    .gte("created_at", todayStart.toISOString());

  return count ?? 0;
}

// ─── Get all today's usage for a user ────────────────────────────────────────
export async function getAllTodayUsage(
  userId: string
): Promise<Record<string, number>> {
  const supabase = createAdminClient();
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  const { data } = await supabase
    .from("usage_events")
    .select("feature")
    .eq("user_id", userId)
    .gte("created_at", todayStart.toISOString());

  const counts: Record<string, number> = {};
  for (const row of data ?? []) {
    counts[row.feature] = (counts[row.feature] ?? 0) + 1;
  }
  return counts;
}

// ─── Check if user can use a feature ─────────────────────────────────────────
export async function canUseFeature(
  userId: string,
  feature: string
): Promise<{ allowed: boolean; plan: Plan; used: number; limit: number }> {
  const plan = await getUserPlan(userId);

  if (plan === "premium") {
    return { allowed: true, plan, used: 0, limit: -1 };
  }

  const limit = FREE_LIMITS[feature] ?? 0;
  if (limit === 0) {
    return { allowed: false, plan, used: 0, limit: 0 };
  }

  const used = await getTodayUsage(userId, feature);
  return { allowed: used < limit, plan, used, limit };
}

// ─── Track a usage event ──────────────────────────────────────────────────────
export async function trackUsage(
  userId: string,
  feature: string
): Promise<void> {
  const supabase = createAdminClient();
  await supabase.from("usage_events").insert({ user_id: userId, feature });
}

// ─── Upsert user row on first login ──────────────────────────────────────────
export async function ensureUserExists(
  userId: string,
  email: string
): Promise<void> {
  const supabase = createAdminClient();
  await supabase
    .from("users")
    .upsert({ id: userId, email, plan: "free" }, { onConflict: "id", ignoreDuplicates: true });
}
