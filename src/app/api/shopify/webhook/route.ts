import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  const topic = request.headers.get("x-shopify-topic");
  const shopDomain = request.headers.get("x-shopify-shop-domain");
  const hmac = request.headers.get("x-shopify-hmac-sha256");

  if (!topic || !shopDomain) {
    return NextResponse.json({ error: "Missing Shopify headers" }, { status: 400 });
  }

  // In production: verify HMAC signature here
  const body = await request.json();
  const supabase = await createClient();

  switch (topic) {
    case "orders/create":
      await handleOrderCreate(supabase, shopDomain, body);
      break;
    case "orders/updated":
      await handleOrderUpdate(supabase, shopDomain, body);
      break;
    case "customers/update":
      await handleCustomerUpdate(supabase, shopDomain, body);
      break;
    case "customers/data_request":
    case "customers/redact":
    case "shop/redact":
      await handlePrivacyWebhook(supabase, topic, shopDomain, body);
      break;
    default:
      console.log(`Unhandled webhook topic: ${topic}`);
  }

  return NextResponse.json({ received: true });
}

async function handleOrderCreate(
  supabase: Awaited<ReturnType<typeof createClient>>,
  shopDomain: string,
  order: Record<string, unknown>
) {
  const { error } = await supabase.from("shopify_orders").upsert({
    shopify_order_id: String(order.id),
    order_name: String(order.name),
    customer_email: String((order.customer as Record<string, unknown>)?.email || ""),
    financial_status: String(order.financial_status),
    fulfillment_status: String(order.fulfillment_status || "unfulfilled"),
    total_price: String(order.total_price),
    line_items_summary: (order.line_items as unknown[])?.map((li: unknown) => {
      const item = li as Record<string, unknown>;
      return { title: item.title, qty: item.quantity };
    }),
  }, { onConflict: "shopify_order_id" });

  if (error) console.error("Order create webhook error:", error);

  // Update customer LTV
  const customerEmail = String((order.customer as Record<string, unknown>)?.email || "");
  if (customerEmail) {
    try {
      await supabase.rpc("increment_customer_ltv", {
        p_email: customerEmail,
        p_amount: Number(order.total_price),
      });
    } catch {
      // RPC may not exist yet
    }
  }
}

async function handleOrderUpdate(
  supabase: Awaited<ReturnType<typeof createClient>>,
  shopDomain: string,
  order: Record<string, unknown>
) {
  await supabase
    .from("shopify_orders")
    .update({
      fulfillment_status: String(order.fulfillment_status || "unfulfilled"),
      financial_status: String(order.financial_status),
    })
    .eq("shopify_order_id", String(order.id));
}

async function handleCustomerUpdate(
  supabase: Awaited<ReturnType<typeof createClient>>,
  shopDomain: string,
  customer: Record<string, unknown>
) {
  await supabase
    .from("shopify_customers")
    .update({
      email: String(customer.email),
      tags: customer.tags,
    })
    .eq("shopify_id", String(customer.id));
}

async function handlePrivacyWebhook(
  supabase: Awaited<ReturnType<typeof createClient>>,
  topic: string,
  shopDomain: string,
  body: Record<string, unknown>
) {
  console.log(`Privacy webhook received: ${topic} from ${shopDomain}`);
  // Implement GDPR compliance handlers
}
