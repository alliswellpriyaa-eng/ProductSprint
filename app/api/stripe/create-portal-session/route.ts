import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(_req: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    return NextResponse.json({ error: "UNAUTHENTICATED" }, { status: 401 });
  }

  const admin = createAdminClient();
  const { data: dbUser } = await admin
    .from("users")
    .select("stripe_customer_id")
    .eq("id", user.id)
    .single();

  if (!dbUser?.stripe_customer_id) {
    return NextResponse.json(
      { error: "No billing account found. Please subscribe first." },
      { status: 400 }
    );
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

  const portalSession = await stripe.billingPortal.sessions.create({
    customer: dbUser.stripe_customer_id as string,
    return_url: `${appUrl}/`,
  });

  return NextResponse.json({ url: portalSession.url });
}
