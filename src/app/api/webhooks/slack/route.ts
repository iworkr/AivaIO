import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  const body = await request.json();

  if (body.type === "url_verification") {
    return NextResponse.json({ challenge: body.challenge });
  }

  if (body.type !== "event_callback") {
    return NextResponse.json({ ok: true });
  }

  const event = body.event;
  if (!event) return NextResponse.json({ ok: true });

  const supabase = await createClient();

  if (event.type === "message" && !event.bot_id && !event.subtype) {
    const teamId = body.team_id;

    const { data: connection } = await supabase
      .from("channel_connections")
      .select("id, user_id, workspace_id")
      .eq("provider", "slack")
      .eq("status", "active")
      .limit(1)
      .maybeSingle();

    if (!connection) return NextResponse.json({ ok: true });

    const channelId = event.channel as string;
    const messageTs = event.ts as string;
    const threadTs = (event.thread_ts || event.ts) as string;
    const text = (event.text || "") as string;
    const senderUserId = (event.user || "unknown") as string;

    const providerThreadId = `slack_${channelId}_${threadTs}`;

    try {
      const { data: existingThread } = await supabase
        .from("threads")
        .select("id, message_count")
        .eq("workspace_id", connection.workspace_id)
        .eq("provider_thread_id", providerThreadId)
        .maybeSingle();

      let threadId: string;
      const now = new Date().toISOString();

      if (existingThread) {
        threadId = existingThread.id;
        await supabase
          .from("threads")
          .update({
            snippet: text.slice(0, 200),
            last_message_at: now,
            message_count: (existingThread.message_count || 0) + 1,
            is_unread: true,
            updated_at: now,
          })
          .eq("id", threadId);
      } else {
        const { data: newThread } = await supabase
          .from("threads")
          .insert({
            workspace_id: connection.workspace_id,
            primary_subject: `Slack #${channelId}`,
            provider: "slack",
            snippet: text.slice(0, 200),
            participants: [{ name: senderUserId, email: "" }],
            channels: ["slack"],
            message_count: 1,
            first_message_at: now,
            last_message_at: now,
            is_unread: true,
            has_draft: false,
            provider_thread_id: providerThreadId,
            channel_connection_id: connection.id,
          })
          .select("id")
          .single();

        if (!newThread) return NextResponse.json({ ok: true });
        threadId = newThread.id;
      }

      await supabase.from("messages").insert({
        workspace_id: connection.workspace_id,
        channel_connection_id: connection.id,
        thread_id: threadId,
        provider_message_id: `slack_${messageTs}`,
        provider_thread_id: providerThreadId,
        subject: `Slack #${channelId}`,
        body: text,
        snippet: text.slice(0, 200),
        sender_email: "",
        sender_name: senderUserId,
        recipients: "[]",
        timestamp: new Date(parseFloat(messageTs) * 1000).toISOString(),
        is_read: false,
        labels: [],
        status: "unread",
      });

      await supabase
        .from("channel_connections")
        .update({ last_sync_at: now })
        .eq("id", connection.id);
    } catch (err) {
      console.error("Slack webhook processing error:", err);
    }
  }

  return NextResponse.json({ ok: true });
}
