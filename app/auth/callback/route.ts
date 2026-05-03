import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

/**
 * Supabase redirects here after email confirmation / magic link.
 * Exchanges the one-time code for a session cookie.
 */
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/";

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  return NextResponse.redirect(
    `${origin}/login?error=Could+not+confirm+your+email.+Please+try+again.`
  );
}
