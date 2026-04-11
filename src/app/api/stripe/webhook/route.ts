import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  if (!process.env.STRIPE_SECRET_KEY || process.env.STRIPE_SECRET_KEY === "YOUR_STRIPE_SECRET_KEY") {
    return NextResponse.json({ error: "Stripe not configured" }, { status: 503 });
  }

  const Stripe = (await import("stripe")).default;
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: "2024-04-10" as any });

  const sig  = request.headers.get("stripe-signature");
  const body = await request.text();

  let event;
  try {
    event = stripe.webhooks.constructEvent(body, sig!, process.env.STRIPE_WEBHOOK_SECRET!);
  } catch (err: any) {
    return NextResponse.json({ error: `Webhook error: ${err.message}` }, { status: 400 });
  }

  // Update user plan in Supabase
  if (["customer.subscription.created", "customer.subscription.updated", "customer.subscription.deleted"].includes(event.type)) {
    const { createClient } = await import("@supabase/supabase-js");
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_KEY!
    );

    const subscription = event.data.object as any;
    const userId = subscription.metadata?.userId;
    const plan   = event.type === "customer.subscription.deleted" ? "free" : subscription.metadata?.plan || "free";

    if (userId) {
      await supabase.from("user_plans").upsert({
        user_id:    userId,
        plan,
        stripe_subscription_id: subscription.id,
        updated_at: new Date().toISOString(),
      });
    }
  }

  return NextResponse.json({ received: true });
}
