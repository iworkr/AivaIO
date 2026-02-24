import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getStripe, getStripePrices } from "@/lib/stripe/server";

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { interval = "annual" } = await req.json();
    const prices = getStripePrices();
    const priceId = interval === "monthly" ? prices.monthly : prices.annual;
    const stripe = getStripe();

    const { data: profile } = await supabase
      .from("user_profiles")
      .select("stripe_customer_id")
      .eq("id", user.id)
      .maybeSingle();

    let customerId = profile?.stripe_customer_id;

    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        metadata: {
          supabase_user_id: user.id,
          name: (user.user_metadata?.full_name as string) || "",
        },
      });
      customerId = customer.id;

      await supabase
        .from("user_profiles")
        .update({ stripe_customer_id: customerId })
        .eq("id", user.id);
    }

    const origin = req.headers.get("origin") || "http://localhost:3000";

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: "subscription",
      payment_method_types: ["card"],
      line_items: [{ price: priceId, quantity: 1 }],
      subscription_data: {
        trial_period_days: 7,
        metadata: { supabase_user_id: user.id },
      },
      success_url: `${origin}/app/settings?section=billing&checkout=success`,
      cancel_url: `${origin}/app/settings?section=billing&checkout=cancelled`,
      allow_promotion_codes: true,
      billing_address_collection: "auto",
      metadata: { supabase_user_id: user.id },
    });

    return NextResponse.json({ sessionId: session.id, url: session.url });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
