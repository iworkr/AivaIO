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

export const maxDuration = 60;

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  const maxResults = Math.min(Number(body.maxResults) || 25, 50);

  const { data: connection } = await supabase
    .from("channel_connections")
    .select("*")
    .eq("user_id", user.id)
    .eq("provider", "gmail")
    .eq("status", "active")
    .maybeSingle();

  if (!connection) {
    return NextResponse.json(
      { error: "No active Gmail connection found" },
      { status: 404 }
    );
  }

  let accessToken = connection.access_token as string;
  const refreshToken = connection.refresh_token as string;
  const workspaceId = connection.workspace_id as string;
  const connectionId = connection.id as string;

  if (refreshToken) {
    try {
      const refreshed = await refreshGmailToken(refreshToken);
      accessToken = refreshed.accessToken;
      await supabase
        .from("channel_connections")
        .update({
          access_token: accessToken,
          token_expires_at: refreshed.expiresAt.toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq("id", connectionId);
    } catch (err) {
      console.error("Token refresh failed, trying existing token:", err);
    }
  }

  try {
    const { threads: gmailThreadList } = await listGmailThreads(
      accessToken,
      maxResults
    );

    if (!gmailThreadList || gmailThreadList.length === 0) {
      await supabase
        .from("channel_connections")
        .update({
          last_sync_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq("id", connectionId);

      return NextResponse.json({ synced: 0, threads: 0 });
    }

    let totalMessages = 0;
    let totalThreads = 0;

    const threadBatch = gmailThreadList.slice(0, maxResults);

    for (const threadRef of threadBatch) {
      try {
        const gmailThread = await getGmailThread(accessToken, threadRef.id);
        if (!gmailThread.messages || gmailThread.messages.length === 0) continue;

        const firstMessage = gmailThread.messages[0];
        const lastMessage =
          gmailThread.messages[gmailThread.messages.length - 1];

        const subject =
          getHeader(firstMessage, "Subject") || "(No subject)";
        const senderInfo = parseEmailAddress(
          getHeader(firstMessage, "From")
        );
        const lastTimestamp = new Date(
          Number(lastMessage.internalDate)
        ).toISOString();
        const firstTimestamp = new Date(
          Number(firstMessage.internalDate)
        ).toISOString();

        const isUnread = lastMessage.labelIds?.includes("UNREAD") || false;

        const { data: existingContact } = await supabase
          .from("contacts")
          .select("id")
          .eq("workspace_id", workspaceId)
          .eq("email", senderInfo.email)
          .maybeSingle();

        let contactId = existingContact?.id;
        if (!contactId) {
          const names = senderInfo.name.split(" ");
          const { data: newContact } = await supabase
            .from("contacts")
            .insert({
              workspace_id: workspaceId,
              full_name: senderInfo.name || senderInfo.email,
              first_name: names[0] || null,
              last_name: names.length > 1 ? names.slice(1).join(" ") : null,
              email: senderInfo.email,
              last_interaction_at: lastTimestamp,
              interaction_count: gmailThread.messages.length,
              created_by: user.id,
            })
            .select("id")
            .single();
          contactId = newContact?.id;
        } else {
          await supabase
            .from("contacts")
            .update({
              last_interaction_at: lastTimestamp,
              updated_at: new Date().toISOString(),
            })
            .eq("id", contactId);
        }

        const { data: existingThread } = await supabase
          .from("threads")
          .select("id")
          .eq("workspace_id", workspaceId)
          .eq("provider_thread_id", gmailThread.id)
          .maybeSingle();

        let threadId: string;

        const allParticipants = new Map<
          string,
          { name: string; email: string }
        >();
        for (const msg of gmailThread.messages) {
          const from = parseEmailAddress(getHeader(msg, "From"));
          allParticipants.set(from.email, from);
          for (const r of getMessageRecipients(msg)) {
            allParticipants.set(r.email, { name: r.name, email: r.email });
          }
        }

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
          has_draft: false,
          contact_id: contactId || null,
          provider_thread_id: gmailThread.id,
          channel_connection_id: connectionId,
          updated_at: new Date().toISOString(),
        };

        if (existingThread) {
          threadId = existingThread.id;
          await supabase
            .from("threads")
            .update(threadData)
            .eq("id", threadId);
        } else {
          const { data: newThread, error: threadError } = await supabase
            .from("threads")
            .insert({
              workspace_id: workspaceId,
              ...threadData,
            })
            .select("id")
            .single();

          if (threadError || !newThread) {
            console.error(
              "Failed to create thread:",
              threadError?.message
            );
            continue;
          }
          threadId = newThread.id;
        }

        totalThreads++;

        for (const gmailMsg of gmailThread.messages) {
          const providerMessageId = gmailMsg.id;

          const { data: existingMsg } = await supabase
            .from("messages")
            .select("id")
            .eq("provider_message_id", providerMessageId)
            .eq("workspace_id", workspaceId)
            .maybeSingle();

          if (existingMsg) continue;

          const from = parseEmailAddress(getHeader(gmailMsg, "From"));
          const msgSubject =
            getHeader(gmailMsg, "Subject") || subject;
          const bodyPlain = getMessagePlainText(gmailMsg);
          const bodyHtml = getMessageHtml(gmailMsg);
          const recipients = getMessageRecipients(gmailMsg);
          const timestamp = new Date(
            Number(gmailMsg.internalDate)
          ).toISOString();
          const isRead = !gmailMsg.labelIds?.includes("UNREAD");

          const { error: msgError } = await supabase
            .from("messages")
            .insert({
              workspace_id: workspaceId,
              channel_connection_id: connectionId,
              thread_id: threadId,
              provider_message_id: providerMessageId,
              provider_thread_id: gmailThread.id,
              subject: msgSubject,
              body: bodyPlain,
              body_html: bodyHtml,
              snippet: gmailMsg.snippet || bodyPlain.slice(0, 200),
              sender_email: from.email,
              sender_name: from.name,
              recipients: JSON.stringify(recipients),
              timestamp,
              is_read: isRead,
              labels: gmailMsg.labelIds || [],
              status: isRead ? "read" : "unread",
            });

          if (msgError) {
            console.error("Failed to insert message:", msgError.message);
          } else {
            totalMessages++;
          }
        }
      } catch (threadErr) {
        console.error(
          `Failed to sync thread ${threadRef.id}:`,
          threadErr
        );
      }
    }

    await supabase
      .from("channel_connections")
      .update({
        last_sync_at: new Date().toISOString(),
        sync_cursor: gmailThreadList[0]?.id || null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", connectionId);

    return NextResponse.json({
      synced: totalMessages,
      threads: totalThreads,
    });
  } catch (err) {
    console.error("Gmail sync error:", err);
    return NextResponse.json(
      {
        error:
          err instanceof Error ? err.message : "Sync failed",
      },
      { status: 500 }
    );
  }
}
