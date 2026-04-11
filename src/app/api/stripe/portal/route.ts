import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  if (!process.env.STRIPE_SECRET_KEY || process.env.STRIPE_SECRET_KEY === "YOUR_STRIPE_SECRET_KEY") {
    return NextResponse.json({ error: "Stripe not configured" }, { status: 503 });
  }

  try {
    const Stripe = (await import("stripe")).default;
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: "2024-04-10" as any });

    const { customerId } = await request.json();

    const session = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: `${process.env.NEXT_PUBLIC_APP_URL}/billing`,
    });

    return NextResponse.json({ url: session.url });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
