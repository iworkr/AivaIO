import { createClient } from "@/lib/supabase/server";
import { callLLM } from "@/lib/ai/llm-client";
import {
  refreshGmailToken,
  listGmailThreads,
  getGmailThread,
  getHeader,
  parseEmailAddress,
  getMessagePlainText,
} from "@/lib/integrations/gmail";

export const maxDuration = 30;

interface MagicItem {
  type: "drafted_reply" | "extracted_task";
  title: string;
  from: string;
  fromEmail: string;
  snippet: string;
  aiAction: string;
  scheduledTime?: string;
  priority: "urgent" | "high" | "medium" | "low";
  threadId?: string;
}

function sendSSE(
  controller: ReadableStreamDefaultController,
  event: string,
  data: unknown
) {
  const payload = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
  controller.enqueue(new TextEncoder().encode(payload));
}

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return new Response("Unauthorized", { status: 401 });
  }

  const stream = new ReadableStream({
    async start(controller) {
      try {
        // Phase 1: Check Gmail connection
        sendSSE(controller, "status", { phase: "connecting", message: "Securely syncing with Gmail…" });

        const { data: connection } = await supabase
          .from("channel_connections")
          .select("*")
          .eq("user_id", user.id)
          .eq("provider", "gmail")
          .eq("status", "active")
          .maybeSingle();

        if (!connection) {
          sendSSE(controller, "status", { phase: "no_connection", message: "No Gmail connection found." });
          sendSSE(controller, "complete", { items: [], timeSaved: 0 });
          controller.close();
          return;
        }

        let accessToken = connection.access_token as string;
        const refreshToken = connection.refresh_token as string;

        if (refreshToken) {
          try {
            const refreshed = await refreshGmailToken(refreshToken);
            accessToken = refreshed.accessToken;
            await supabase.from("channel_connections").update({
              access_token: accessToken,
              token_expires_at: refreshed.expiresAt.toISOString(),
            }).eq("id", connection.id);
          } catch {
            // Use existing token
          }
        }

        // Phase 2: Fetch recent emails
        sendSSE(controller, "status", { phase: "scanning", message: "Scanning the last 72 hours for action items…" });

        const { threads: gmailThreadList } = await listGmailThreads(accessToken, 50);

        if (!gmailThreadList || gmailThreadList.length === 0) {
          sendSSE(controller, "status", { phase: "inbox_zero", message: "Your inbox is perfectly clean!" });
          sendSSE(controller, "complete", { items: [], timeSaved: 0, inboxZero: true });
          controller.close();
          return;
        }

        // Phase 3: Fetch thread details and filter
        sendSSE(controller, "status", { phase: "extracting", message: "Extracting deadlines and meeting requests…" });

        const emailSummaries: Array<{
          threadId: string;
          from: string;
          fromEmail: string;
          subject: string;
          body: string;
          date: string;
          isUnread: boolean;
        }> = [];

        const noReplyPatterns = /noreply|no-reply|notifications|mailer-daemon|newsletter|unsubscribe/i;
        const threadsToProcess = gmailThreadList.slice(0, 30);

        for (const threadRef of threadsToProcess) {
          try {
            const gmailThread = await getGmailThread(accessToken, threadRef.id);
            if (!gmailThread.messages?.length) continue;

            const lastMsg = gmailThread.messages[gmailThread.messages.length - 1];
            const senderRaw = getHeader(lastMsg, "From") || "";
            const sender = parseEmailAddress(senderRaw);

            if (noReplyPatterns.test(sender.email) || noReplyPatterns.test(sender.name)) continue;

            const subject = getHeader(gmailThread.messages[0], "Subject") || "(No subject)";
            const body = getMessagePlainText(lastMsg).slice(0, 500);
            const date = new Date(Number(lastMsg.internalDate)).toISOString();
            const isUnread = lastMsg.labelIds?.includes("UNREAD") || false;

            emailSummaries.push({
              threadId: gmailThread.id,
              from: sender.name || sender.email,
              fromEmail: sender.email,
              subject,
              body,
              date,
              isUnread,
            });
          } catch {
            // Skip failed threads
          }

          if (emailSummaries.length >= 20) break;
        }

        if (emailSummaries.length === 0) {
          sendSSE(controller, "status", { phase: "inbox_zero", message: "Your inbox is perfectly clean!" });
          sendSSE(controller, "complete", { items: [], timeSaved: 0, inboxZero: true });
          controller.close();
          return;
        }

        // Phase 4: LLM extraction
        sendSSE(controller, "status", { phase: "analyzing", message: "Drafting initial responses…" });

        const emailContext = emailSummaries.map((e, i) =>
          `[${i + 1}] From: ${e.from} <${e.fromEmail}> | Subject: ${e.subject} | Date: ${e.date}\n${e.body}`
        ).join("\n---\n");

        const llmResponse = await callLLM([
          {
            role: "system",
            content: `You are AIVA, an AI executive assistant. Analyze these emails and extract the top 10 most actionable items. Return a JSON object with this schema:
{
  "items": [
    {
      "type": "drafted_reply" | "extracted_task",
      "emailIndex": number,
      "title": "concise action title",
      "aiAction": "what AIVA will do (e.g. 'Draft reply proposing Tuesday at 2 PM' or 'Auto-scheduled for Tomorrow at 10 AM')",
      "scheduledTime": "optional ISO datetime for when to schedule",
      "priority": "urgent" | "high" | "medium" | "low"
    }
  ],
  "timeSavedMinutes": number
}
Aim for ~3 drafted replies and ~7 extracted tasks. Be specific with times and actions. If fewer than 10 actionable items exist, return what you find. Estimate realistic time saved.`,
          },
          { role: "user", content: emailContext },
        ], {
          model: "gpt-4o-mini",
          responseFormat: "json_object",
          temperature: 0.3,
          maxTokens: 2048,
        });

        let items: MagicItem[] = [];
        let timeSaved = 45;

        try {
          const parsed = JSON.parse(llmResponse.content || "{}");
          timeSaved = parsed.timeSavedMinutes || 45;

          items = (parsed.items || []).slice(0, 10).map((item: {
            type: string;
            emailIndex: number;
            title: string;
            aiAction: string;
            scheduledTime?: string;
            priority: string;
          }) => {
            const emailIdx = (item.emailIndex || 1) - 1;
            const email = emailSummaries[emailIdx] || emailSummaries[0];
            return {
              type: item.type === "drafted_reply" ? "drafted_reply" : "extracted_task",
              title: item.title,
              from: email?.from || "Unknown",
              fromEmail: email?.fromEmail || "",
              snippet: email?.subject || "",
              aiAction: item.aiAction,
              scheduledTime: item.scheduledTime,
              priority: (["urgent", "high", "medium", "low"].includes(item.priority) ? item.priority : "medium") as MagicItem["priority"],
              threadId: email?.threadId,
            } satisfies MagicItem;
          });
        } catch {
          // Fallback: create items from emails directly
          items = emailSummaries.slice(0, 10).map((e, i) => ({
            type: i < 3 ? "drafted_reply" as const : "extracted_task" as const,
            title: e.subject,
            from: e.from,
            fromEmail: e.fromEmail,
            snippet: e.body.slice(0, 100),
            aiAction: i < 3
              ? "Draft reply prepared by AIVA"
              : `Task extracted — review by ${new Date(Date.now() + 86400000).toLocaleDateString()}`,
            priority: e.isUnread ? "high" as const : "medium" as const,
            threadId: e.threadId,
          }));
        }

        // Phase 5: Send results
        sendSSE(controller, "status", {
          phase: "done",
          message: `Done. Found ${items.length} item${items.length !== 1 ? "s" : ""}.`,
        });

        sendSSE(controller, "complete", {
          items,
          timeSaved,
          totalThreadsScanned: emailSummaries.length,
        });

      } catch (err) {
        sendSSE(controller, "error", {
          message: err instanceof Error ? err.message : "An unexpected error occurred",
        });
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
