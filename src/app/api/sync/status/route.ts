import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Fetch sync status for all channels
  const { data: connections } = await supabase
    .from("channel_connections")
    .select("id, provider, status, last_sync_at, provider_account_name")
    .eq("user_id", user.id);

  // Fetch Shopify sync status
  const { data: shopifyStores } = await supabase
    .from("shopify_stores")
    .select("id, shop_domain, sync_status, last_synced_at")
    .eq("workspace_id", user.user_metadata?.workspace_id);

  return NextResponse.json({
    channels: connections || [],
    shopify: shopifyStores || [],
    overallStatus: determineOverallStatus(connections),
  });
}

function determineOverallStatus(
  connections: Array<{ status: string }> | null
): string {
  if (!connections || connections.length === 0) return "no_connections";
  if (connections.some((c) => c.status === "syncing")) return "syncing";
  if (connections.every((c) => c.status === "active")) return "active";
  return "partial";
}
