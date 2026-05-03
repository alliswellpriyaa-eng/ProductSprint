import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { createAdminClient } from "@/lib/supabase/admin";
import type Stripe from "stripe";

const WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET!;

async function setUserPlan(
  stripeCustomerId: string,
  plan: "free" | "premium"
) {
  const admin = createAdminClient();
  await admin
    .from("users")
    .update({ plan })
    .eq("stripe_customer_id", stripeCustomerId);
}

async function upsertSubscription(
  sub: Stripe.Subscription,
  userId: string | null
) {
  const admin = createAdminClient();
  await admin.from("subscriptions").upsert(
    {
      stripe_subscription_id: sub.id,
      stripe_customer_id: sub.customer as string,
      user_id: userId,
      status: sub.status,
      price_id: sub.items.data[0]?.price.id ?? null,
      current_period_end: new Date(
        (sub as unknown as { current_period_end: number }).current_period_end * 1000
      ).toISOString(),
    },
    { onConflict: "stripe_subscription_id" }
  );
}

async function getUserIdByCustomer(customerId: string): Promise<string | null> {
  const admin = createAdminClient();
  const { data } = await admin
    .from("users")
    .select("id")
    .eq("stripe_customer_id", customerId)
    .single();
  return data?.id ?? null;
}

export async function POST(req: NextRequest) {
  const body = await req.text();
  const signature = req.headers.get("stripe-signature");

  if (!signature) {
    return NextResponse.json({ error: "Missing signature" }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, signature, WEBHOOK_SECRET);
  } catch (err) {
    console.error("[webhook] Signature verification failed:", err);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        if (session.mode === "subscription") {
          const customerId = session.customer as string;
          await setUserPlan(customerId, "premium");

          // Link subscription row
          const sub = await stripe.subscriptions.retrieve(
            session.subscription as string
          );
          const userId = await getUserIdByCustomer(customerId);
          await upsertSubscription(sub, userId);
        }
        break;
      }

      case "customer.subscription.created":
      case "customer.subscription.updated": {
        const sub = event.data.object as Stripe.Subscription;
        const customerId = sub.customer as string;
        const isActive = ["active", "trialing"].includes(sub.status);
        await setUserPlan(customerId, isActive ? "premium" : "free");
        const userId = await getUserIdByCustomer(customerId);
        await upsertSubscription(sub, userId);
        break;
      }

      case "customer.subscription.deleted": {
        const sub = event.data.object as Stripe.Subscription;
        await setUserPlan(sub.customer as string, "free");
        const userId = await getUserIdByCustomer(sub.customer as string);
        await upsertSubscription(sub, userId);
        break;
      }

      case "invoice.payment_succeeded": {
        const invoice = event.data.object as Stripe.Invoice;
        if (invoice.subscription) {
          await setUserPlan(invoice.customer as string, "premium");
        }
        break;
      }

      case "invoice.payment_failed": {
        // Don't immediately revoke — Stripe retries. Log only.
        console.warn("[webhook] Payment failed for customer:", event.data.object);
        break;
      }

      default:
        // Unhandled event — ignore silently
        break;
    }
  } catch (err) {
    console.error("[webhook] Handler error:", err);
    return NextResponse.json({ error: "Webhook handler failed" }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
