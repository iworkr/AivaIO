import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  refreshGmailToken,
  listGmailThreads,
  getGmailThread,
  getHeader,
  parseEmailAddress,
  getMessagePlainText,
  getMessageHtml,
  getMessageRecipients,
} from "@/lib/integrations/gmail";

export async function POST(request: Request) {
  const body = await request.json();
  const supabase = await createClient();

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

  const { data: connection } = await supabase
    .from("channel_connections")
    .select("*")
    .eq("provider_account_name", notification.emailAddress)
    .eq("provider", "gmail")
    .eq("status", "active")
    .maybeSingle();

  if (!connection) {
    return NextResponse.json({ received: true });
  }

  try {
    let accessToken = connection.access_token as string;
    const refreshToken = connection.refresh_token as string;

    if (refreshToken) {
      const refreshed = await refreshGmailToken(refreshToken);
      accessToken = refreshed.accessToken;
      await supabase
        .from("channel_connections")
        .update({
          access_token: accessToken,
          token_expires_at: refreshed.expiresAt.toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq("id", connection.id);
    }

    const { threads: gmailThreadList } = await listGmailThreads(accessToken, 10);

    if (!gmailThreadList || gmailThreadList.length === 0) {
      await supabase
        .from("channel_connections")
        .update({ last_sync_at: new Date().toISOString(), updated_at: new Date().toISOString() })
        .eq("id", connection.id);
      return NextResponse.json({ received: true, synced: 0 });
    }

    const workspaceId = connection.workspace_id as string;
    const connectionId = connection.id as string;
    const userId = connection.user_id as string;
    let totalMessages = 0;

    for (const threadRef of gmailThreadList.slice(0, 10)) {
      try {
        const gmailThread = await getGmailThread(accessToken, threadRef.id);
        if (!gmailThread.messages || gmailThread.messages.length === 0) continue;

        const firstMessage = gmailThread.messages[0];
        const lastMessage = gmailThread.messages[gmailThread.messages.length - 1];
        const subject = getHeader(firstMessage, "Subject") || "(No subject)";
        const senderInfo = parseEmailAddress(getHeader(firstMessage, "From"));
        const lastTimestamp = new Date(Number(lastMessage.internalDate)).toISOString();
        const firstTimestamp = new Date(Number(firstMessage.internalDate)).toISOString();
        const isUnread = lastMessage.labelIds?.includes("UNREAD") || false;

        const allParticipants = new Map<string, { name: string; email: string }>();
        for (const msg of gmailThread.messages) {
          const from = parseEmailAddress(getHeader(msg, "From"));
          allParticipants.set(from.email, from);
          for (const r of getMessageRecipients(msg)) {
            allParticipants.set(r.email, { name: r.name, email: r.email });
          }
        }

        const { data: existingThread } = await supabase
          .from("threads")
          .select("id")
          .eq("workspace_id", workspaceId)
          .eq("provider_thread_id", gmailThread.id)
          .maybeSingle();

        const threadData = {
          primary_subject: subject,
          provider: "gmail",
          snippet: lastMessage.snippet || "",
          participants: Array.from(allParticipants.values()),
          channels: ["gmail"],
          message_count: gmailThread.messages.length,
          first_message_at: firstTimestamp,
          last_message_at: lastTimestamp,
          is_unread: isUnread,
          provider_thread_id: gmailThread.id,
          channel_connection_id: connectionId,
          updated_at: new Date().toISOString(),
        };

        let threadId: string;
        if (existingThread) {
          threadId = existingThread.id;
          await supabase.from("threads").update(threadData).eq("id", threadId);
        } else {
          const { data: newThread } = await supabase
            .from("threads")
            .insert({ workspace_id: workspaceId, ...threadData })
            .select("id")
            .single();
          if (!newThread) continue;
          threadId = newThread.id;
        }

        for (const gmailMsg of gmailThread.messages) {
          const { data: existingMsg } = await supabase
            .from("messages")
            .select("id")
            .eq("provider_message_id", gmailMsg.id)
            .eq("workspace_id", workspaceId)
            .maybeSingle();

          if (existingMsg) continue;

          const from = parseEmailAddress(getHeader(gmailMsg, "From"));
          const bodyPlain = getMessagePlainText(gmailMsg);
          const bodyHtml = getMessageHtml(gmailMsg);
          const recipients = getMessageRecipients(gmailMsg);
          const timestamp = new Date(Number(gmailMsg.internalDate)).toISOString();

          await supabase.from("messages").insert({
            workspace_id: workspaceId,
            channel_connection_id: connectionId,
            thread_id: threadId,
            provider_message_id: gmailMsg.id,
            provider_thread_id: gmailThread.id,
            subject: getHeader(gmailMsg, "Subject") || subject,
            body: bodyPlain,
            body_html: bodyHtml,
            snippet: gmailMsg.snippet || bodyPlain.slice(0, 200),
            sender_email: from.email,
            sender_name: from.name,
            recipients: JSON.stringify(recipients),
            timestamp,
            is_read: !gmailMsg.labelIds?.includes("UNREAD"),
            labels: gmailMsg.labelIds || [],
            status: gmailMsg.labelIds?.includes("UNREAD") ? "unread" : "read",
          });

          totalMessages++;
        }
      } catch (threadErr) {
        console.error(`Webhook sync thread ${threadRef.id}:`, threadErr);
      }
    }

    await supabase
      .from("channel_connections")
      .update({ last_sync_at: new Date().toISOString(), updated_at: new Date().toISOString() })
      .eq("id", connectionId);

    return NextResponse.json({ received: true, synced: totalMessages, historyId: notification.historyId });
  } catch (err) {
    console.error("Gmail webhook sync error:", err);
    return NextResponse.json({ received: true });
  }
}
