import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { getSupabaseAdmin } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  const body = await request.text();
  const signature = request.headers.get("stripe-signature");
  const secret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!secret || !process.env.STRIPE_SECRET_KEY) {
    return NextResponse.json({ error: "Stripe non configure." }, { status: 503 });
  }

  if (!signature) {
    return NextResponse.json({ error: "Signature manquante." }, { status: 400 });
  }

  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, signature, secret);
  } catch (error) {
    return NextResponse.json({ error: `Webhook invalide: ${error instanceof Error ? error.message : "inconnu"}` }, { status: 400 });
  }

  const supabase = getSupabaseAdmin();
  if (!supabase) {
    return NextResponse.json({ error: "Supabase non configure." }, { status: 503 });
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    const organizationId = String(session.metadata?.organization_id ?? "");
    const moduleKey = String(session.metadata?.module_key ?? "");
    if (organizationId && moduleKey && session.subscription) {
      const subscription = (await stripe.subscriptions.retrieve(String(session.subscription))) as Stripe.Subscription;
      const currentPeriodEnd = Number((subscription as unknown as Record<string, unknown>).current_period_end ?? 0);
      await supabase.from("organization_subscriptions").upsert({
        organization_id: organizationId,
        module_key: moduleKey,
        status: subscription.status === "active" ? "active" : subscription.status,
        stripe_customer_id: String(session.customer ?? ""),
        stripe_subscription_id: subscription.id,
        current_period_end: currentPeriodEnd ? new Date(currentPeriodEnd * 1000).toISOString() : null
      }, { onConflict: "organization_id,module_key" });
    }
  }

  if (event.type === "customer.subscription.updated" || event.type === "customer.subscription.deleted") {
    const subscription = event.data.object as Stripe.Subscription;
    const customerId = typeof subscription.customer === "string" ? subscription.customer : subscription.customer.id;
    const status = event.type === "customer.subscription.deleted" ? "inactive" : subscription.status;
    const currentPeriodEnd = Number((subscription as unknown as Record<string, unknown>).current_period_end ?? 0);

    await supabase
      .from("organization_subscriptions")
      .update({
        status,
        current_period_end: currentPeriodEnd ? new Date(currentPeriodEnd * 1000).toISOString() : null
      })
      .eq("stripe_subscription_id", subscription.id)
      .eq("stripe_customer_id", customerId);
  }

  return NextResponse.json({ received: true });
}
