import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { refreshGmailToken, sendGmailMessage } from "@/lib/integrations/gmail";

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { threadId, finalText, originalAIVADraft, channel, to, subject, inReplyTo, references } = await request.json();

  if (!threadId || !finalText) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  try {
    const effectiveChannel = channel || "GMAIL";

    if (effectiveChannel === "GMAIL") {
      const { data: connection } = await supabase
        .from("channel_connections")
        .select("*")
        .eq("user_id", user.id)
        .eq("provider", "gmail")
        .eq("status", "active")
        .single();

      if (!connection) {
        return NextResponse.json({ error: "No active Gmail connection found" }, { status: 400 });
      }

      let accessToken = connection.access_token;
      const expiresAt = new Date(connection.token_expires_at || 0);

      if (expiresAt <= new Date()) {
        const refreshed = await refreshGmailToken(connection.refresh_token);
        accessToken = refreshed.accessToken;
        await supabase
          .from("channel_connections")
          .update({
            access_token: refreshed.accessToken,
            token_expires_at: refreshed.expiresAt.toISOString(),
          })
          .eq("id", connection.id);
      }

      const { data: thread } = await supabase
        .from("threads")
        .select("provider_thread_id, subject, sender_email")
        .eq("id", threadId)
        .single();

      const recipientEmail = to || thread?.sender_email;
      const emailSubject = subject || (thread?.subject ? `Re: ${thread.subject.replace(/^Re:\s*/i, "")}` : "Re:");

      if (!recipientEmail) {
        return NextResponse.json({ error: "No recipient email found" }, { status: 400 });
      }

      const result = await sendGmailMessage({
        accessToken,
        to: recipientEmail,
        subject: emailSubject,
        body: finalText,
        from: connection.provider_account_name || user.email || "",
        threadId: thread?.provider_thread_id || undefined,
        inReplyTo: inReplyTo || undefined,
        references: references || undefined,
      });

      await supabase
        .from("threads")
        .update({ has_draft: false, is_unread: false })
        .eq("id", threadId);

      await supabase.from("ai_action_logs").insert({
        workspace_id: user.user_metadata?.workspace_id,
        action: "AUTO_SEND",
        channel: effectiveChannel,
        recipient: recipientEmail,
        confidence_score: 0.92,
        original_message: originalAIVADraft,
        dispatched_draft: finalText,
      });

      if (originalAIVADraft && originalAIVADraft !== finalText) {
        processDeltaFeedback(originalAIVADraft, finalText);
      }

      return NextResponse.json({ success: true, messageId: result.id, threadId: result.threadId });
    }

    return NextResponse.json({ error: `Channel ${effectiveChannel} send not implemented` }, { status: 501 });
  } catch (err) {
    console.error("send-message error:", err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

function processDeltaFeedback(original: string, edited: string) {
  const distance = levenshteinRatio(original, edited);
  if (distance < 0.05) return;
  if (distance > 0.80) {
    console.log("Delta: Complete rewrite detected, queuing exemplar update");
  }
  console.log(`Delta: ${(distance * 100).toFixed(1)}% change detected`);
}

function levenshteinRatio(a: string, b: string): number {
  if (a === b) return 0;
  const longer = a.length > b.length ? a : b;
  const shorter = a.length > b.length ? b : a;
  if (longer.length === 0) return 0;

  const costs: number[] = [];
  for (let i = 0; i <= longer.length; i++) {
    let lastValue = i;
    for (let j = 0; j <= shorter.length; j++) {
      if (i === 0) {
        costs[j] = j;
      } else if (j > 0) {
        let newValue = costs[j - 1];
        if (longer.charAt(i - 1) !== shorter.charAt(j - 1)) {
          newValue = Math.min(Math.min(newValue, lastValue), costs[j]) + 1;
        }
        costs[j - 1] = lastValue;
        lastValue = newValue;
      }
    }
    if (i > 0) costs[shorter.length] = lastValue;
  }
  return costs[shorter.length] / longer.length;
}
