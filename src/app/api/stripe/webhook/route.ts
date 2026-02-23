import { NextRequest, NextResponse } from "next/server";
import { getStripe, STRIPE_WEBHOOK_SECRET } from "@/lib/stripe/server";
import { createClient } from "@supabase/supabase-js";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function findUserByCustomerId(customerId: string): Promise<string | null> {
  const { data } = await supabaseAdmin
    .from("user_profiles")
    .select("id")
    .eq("stripe_customer_id", customerId)
    .maybeSingle();
  return data?.id || null;
}

async function findUserByMetadata(metadata: Record<string, string>): Promise<string | null> {
  return metadata?.supabase_user_id || null;
}

export async function POST(req: NextRequest) {
  const body = await req.text();
  const sig = req.headers.get("stripe-signature");

  if (!sig) {
    return NextResponse.json({ error: "Missing stripe-signature" }, { status: 400 });
  }

  const stripe = getStripe();
  let event;

  try {
    event = stripe.webhooks.constructEvent(body, sig, STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    console.error("Webhook signature verification failed:", err);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  const { data: existingEvent } = await supabaseAdmin
    .from("stripe_webhook_events")
    .select("id")
    .eq("stripe_event_id", event.id)
    .maybeSingle();

  if (existingEvent) {
    return NextResponse.json({ received: true, idempotent: true });
  }

  await supabaseAdmin.from("stripe_webhook_events").insert({
    stripe_event_id: event.id,
    event_type: event.type,
    processed_at: new Date().toISOString(),
  });

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object;
        const userId =
          (await findUserByMetadata(session.metadata as Record<string, string>)) ||
          (session.customer ? await findUserByCustomerId(session.customer as string) : null);

        if (userId && session.subscription) {
          const sub = await stripe.subscriptions.retrieve(session.subscription as string) as unknown as {
            current_period_end: number;
            cancel_at_period_end: boolean;
            items: { data: Array<{ price?: { recurring?: { interval?: string } } }> };
          };
          const interval = sub.items.data[0]?.price?.recurring?.interval;

          await supabaseAdmin.from("user_profiles").update({
            subscription_tier: "pro",
            stripe_customer_id: session.customer as string,
            stripe_subscription_id: session.subscription as string,
            billing_interval: interval === "year" ? "annual" : "monthly",
            current_period_end: new Date(sub.current_period_end * 1000).toISOString(),
            cancel_at_period_end: false,
            payment_failed: false,
            grace_deadline: null,
          }).eq("id", userId);
        }
        break;
      }

      case "customer.subscription.updated": {
        const subObj = event.data.object as unknown as {
          customer: string;
          status: string;
          current_period_end: number;
          cancel_at_period_end: boolean;
          items: { data: Array<{ price?: { recurring?: { interval?: string } } }> };
        };
        const userId = await findUserByCustomerId(subObj.customer);

        if (userId) {
          const interval = subObj.items.data[0]?.price?.recurring?.interval;

          await supabaseAdmin.from("user_profiles").update({
            subscription_tier: subObj.status === "active" || subObj.status === "trialing" ? "pro" : "free",
            billing_interval: interval === "year" ? "annual" : "monthly",
            current_period_end: new Date(subObj.current_period_end * 1000).toISOString(),
            cancel_at_period_end: subObj.cancel_at_period_end || false,
          }).eq("id", userId);
        }
        break;
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object;
        const userId = await findUserByCustomerId(subscription.customer as string);

        if (userId) {
          await supabaseAdmin.from("user_profiles").update({
            subscription_tier: "free",
            stripe_subscription_id: null,
            billing_interval: null,
            current_period_end: null,
            cancel_at_period_end: false,
            payment_failed: false,
            grace_deadline: null,
          }).eq("id", userId);
        }
        break;
      }

      case "invoice.payment_failed": {
        const invoice = event.data.object;
        const userId = await findUserByCustomerId(invoice.customer as string);

        if (userId) {
          const graceDeadline = new Date();
          graceDeadline.setDate(graceDeadline.getDate() + 3);

          await supabaseAdmin.from("user_profiles").update({
            payment_failed: true,
            grace_deadline: graceDeadline.toISOString(),
          }).eq("id", userId);
        }
        break;
      }

      case "invoice.payment_succeeded": {
        const invoice = event.data.object;
        const userId = await findUserByCustomerId(invoice.customer as string);

        if (userId) {
          await supabaseAdmin.from("user_profiles").update({
            payment_failed: false,
            grace_deadline: null,
          }).eq("id", userId);
        }
        break;
      }
    }
  } catch (err) {
    console.error("Webhook processing error:", err);
    return NextResponse.json({ error: "Processing failed" }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
