import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  const body = await request.json();

  // Handle Slack URL verification challenge
  if (body.type === "url_verification") {
    return NextResponse.json({ challenge: body.challenge });
  }

  if (body.type !== "event_callback") {
    return NextResponse.json({ ok: true });
  }

  const event = body.event;
  if (!event) return NextResponse.json({ ok: true });

  const supabase = await createClient();

  // Handle message events
  if (event.type === "message" && !event.bot_id && !event.subtype) {
    const teamId = body.team_id;

    // Find workspace by Slack team
    const { data: connection } = await supabase
      .from("channel_connections")
      .select("user_id, workspace_id")
      .eq("provider", "slack")
      .eq("status", "active")
      .limit(1)
      .maybeSingle();

    if (connection) {
      // In production: normalize the message and insert into the messages table
      // For now, update sync timestamp
      await supabase.from("channel_connections")
        .update({ last_synced_at: new Date().toISOString() })
        .eq("user_id", connection.user_id)
        .eq("provider", "slack");
    }
  }

  return NextResponse.json({ ok: true });
}
