import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { getPublicBaseUrl, readJsonBody, requireSameOrigin, sanitizePositiveNumber } from "@/lib/security";

export async function POST(request: NextRequest) {
  const originError = requireSameOrigin(request);
  if (originError) return originError;

  const { data, response } = await readJsonBody<{ paidSeats?: number }>(request);
  if (response) return response;
  const paidSeats = Math.max(1, Math.min(250, Math.round(sanitizePositiveNumber(data?.paidSeats, 250))));

  if (!process.env.STRIPE_SECRET_KEY || !process.env.NEXT_PUBLIC_STRIPE_PRICE_EXTRA_SEAT) {
    return NextResponse.json({
      mode: "not_configured",
      message: "Stripe n'est pas encore configure. Ajoutez STRIPE_SECRET_KEY et NEXT_PUBLIC_STRIPE_PRICE_EXTRA_SEAT."
    });
  }

  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
  const origin = getPublicBaseUrl(request);
  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    line_items: [
      {
        price: process.env.NEXT_PUBLIC_STRIPE_PRICE_EXTRA_SEAT,
        quantity: paidSeats
      }
    ],
    success_url: `${origin}/abonnement?billing=success`,
    cancel_url: `${origin}/abonnement?billing=cancelled`
  });

  return NextResponse.json({
    mode: "stripe",
    url: session.url
  });
}
