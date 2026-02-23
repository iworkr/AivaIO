import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import type { SubscriptionStatus } from "@/types";

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ tier: "free" } as SubscriptionStatus);

    const { data: profile } = await supabase
      .from("user_profiles")
      .select("subscription_tier, stripe_customer_id, stripe_subscription_id, billing_interval, current_period_end, cancel_at_period_end, payment_failed, grace_deadline")
      .eq("id", user.id)
      .maybeSingle();

    if (!profile || !profile.subscription_tier || profile.subscription_tier === "free") {
      return NextResponse.json({ tier: "free" } as SubscriptionStatus);
    }

    const now = new Date();
    let effectiveTier = profile.subscription_tier as "free" | "pro";

    if (profile.payment_failed && profile.grace_deadline) {
      const deadline = new Date(profile.grace_deadline);
      if (now > deadline) {
        effectiveTier = "free";
      }
    }

    if (profile.cancel_at_period_end && profile.current_period_end) {
      const periodEnd = new Date(profile.current_period_end);
      if (now > periodEnd) {
        effectiveTier = "free";
      }
    }

    const status: SubscriptionStatus = {
      tier: effectiveTier,
      stripeCustomerId: profile.stripe_customer_id || undefined,
      stripeSubscriptionId: profile.stripe_subscription_id || undefined,
      billingInterval: profile.billing_interval || undefined,
      currentPeriodEnd: profile.current_period_end || undefined,
      cancelAtPeriodEnd: profile.cancel_at_period_end || false,
      paymentFailed: profile.payment_failed || false,
      graceDeadline: profile.grace_deadline || undefined,
    };

    return NextResponse.json(status);
  } catch (err) {
    return NextResponse.json({ tier: "free", error: String(err) }, { status: 500 });
  }
}
