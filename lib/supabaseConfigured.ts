/**
 * Returns true only when BOTH Supabase env vars are set AND are not the
 * placeholder strings that ship in .env.local ("your-project.supabase.co" / "your-…").
 *
 * Import this instead of repeating the check in every API route.
 */
export function isSupabaseConfigured(): boolean {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";
  if (!url || !key) return false;
  // Reject placeholder values that ship in the .env.local template
  if (url.includes("your-project") || key.startsWith("your-")) return false;
  return true;
}
