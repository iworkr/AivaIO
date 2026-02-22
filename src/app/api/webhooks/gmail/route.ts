import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  const body = await request.json();
  const supabase = await createClient();

  // Gmail push notification payload
  const messageData = body.message?.data;
  if (!messageData) {
    return NextResponse.json({ received: true });
  }

  const decoded = Buffer.from(messageData, "base64").toString("utf-8");
  let notification: { emailAddress: string; historyId: string };
  try {
    notification = JSON.parse(decoded);
  } catch {
    return NextResponse.json({ received: true });
  }

  // Find the user by email
  const { data: connection } = await supabase
    .from("channel_connections")
    .select("user_id, workspace_id")
    .eq("account_label", notification.emailAddress)
    .eq("provider", "gmail")
    .eq("status", "active")
    .maybeSingle();

  if (!connection) {
    return NextResponse.json({ received: true });
  }

  // Queue message sync (in production, this would trigger a background worker)
  // For now, update last_synced_at to indicate new activity
  await supabase.from("channel_connections")
    .update({ last_synced_at: new Date().toISOString() })
    .eq("user_id", connection.user_id)
    .eq("provider", "gmail");

  return NextResponse.json({ received: true, historyId: notification.historyId });
}
