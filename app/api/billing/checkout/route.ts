import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { requireAuthContext } from "@/lib/auth-server";
import { getSupabaseAdmin } from "@/lib/supabase/server";
import { getPublicBaseUrl, readJsonBody, requireSameOrigin } from "@/lib/security";

export async function POST(request: NextRequest) {
  const originError = requireSameOrigin(request);
  if (originError) return originError;

  const { data, response } = await readJsonBody<{ moduleKey?: string }>(request);
  if (response) return response;
  const moduleKey = String(data?.moduleKey ?? "").trim();
  if (!["eligia", "studio"].includes(moduleKey)) {
    return NextResponse.json({ error: "Module invalide." }, { status: 400 });
  }

  const context = await requireAuthContext(request);
  if (!context) {
    return NextResponse.json({ error: "Non authentifie." }, { status: 401 });
  }

  if (!process.env.STRIPE_SECRET_KEY || !process.env.NEXT_PUBLIC_STRIPE_PRICE_EXTRA_SEAT) {
    return NextResponse.json({
      mode: "not_configured",
      message: "Stripe n'est pas encore configure."
    });
  }

  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
  const supabase = getSupabaseAdmin();
  if (!supabase) {
    return NextResponse.json({ error: "Supabase non configure." }, { status: 503 });
  }

  const { data: profile } = await supabase.from("profiles").select("organization_id, email").eq("id", context.userId).maybeSingle();
  if (!profile?.organization_id) {
    return NextResponse.json({ error: "Organisation introuvable." }, { status: 404 });
  }

  const origin = getPublicBaseUrl(request);
  const quantity = 1;
  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    line_items: [
      {
        price_data: {
          currency: "eur",
          recurring: {
            interval: "month"
          },
          product_data: {
            name: `KASUS ${moduleKey.toUpperCase()}`,
            description: "Abonnement mensuel par module"
          },
          unit_amount: 9900
        },
        quantity
      }
    ],
    customer_email: profile.email || context.email,
    success_url: `${origin}/abonnement?billing=success&module=${moduleKey}`,
    cancel_url: `${origin}/abonnement?billing=cancelled&module=${moduleKey}`,
    metadata: {
      organization_id: profile.organization_id,
      module_key: moduleKey
    }
  });

  return NextResponse.json({
    mode: "stripe",
    url: session.url
  });
}
