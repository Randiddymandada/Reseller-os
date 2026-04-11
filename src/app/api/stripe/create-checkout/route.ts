import { NextRequest, NextResponse } from "next/server";

const PRICE_IDS: Record<string, string> = {
  pro:     process.env.STRIPE_PRICE_PRO     || "",
  premium: process.env.STRIPE_PRICE_PREMIUM || "",
};

export async function POST(request: NextRequest) {
  try {
    // Lazy import Stripe only when keys are present
    if (!process.env.STRIPE_SECRET_KEY || process.env.STRIPE_SECRET_KEY === "YOUR_STRIPE_SECRET_KEY") {
      return NextResponse.json({ error: "Stripe not configured" }, { status: 503 });
    }

    const Stripe = (await import("stripe")).default;
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: "2024-04-10" as any });

    const { plan, userId, email } = await request.json();
    const priceId = PRICE_IDS[plan];

    if (!priceId) {
      return NextResponse.json({ error: "Invalid plan" }, { status: 400 });
    }

    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      payment_method_types: ["card"],
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/billing/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url:  `${process.env.NEXT_PUBLIC_APP_URL}/billing`,
      metadata: { userId, plan },
      customer_email: email,
      subscription_data: { metadata: { userId, plan } },
    });

    return NextResponse.json({ url: session.url });
  } catch (err: any) {
    console.error("Stripe checkout error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
