import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { callLLM } from "@/lib/ai/llm-client";
import type { AIResponse } from "@/types";

async function fetchInboxContext(supabase: Awaited<ReturnType<typeof createClient>>) {
  const { data: threads } = await supabase
    .from("threads")
    .select(`
      id, primary_subject, provider, last_message_at, message_count,
      is_unread, priority, snippet, has_draft, confidence_score,
      contacts:contact_id (full_name, email)
    `)
    .eq("is_archived", false)
    .order("last_message_at", { ascending: false })
    .limit(25);

  if (!threads || threads.length === 0) return { summary: "The user's inbox is empty.", threads: [] };

  const unread = threads.filter((t: Record<string, unknown>) => t.is_unread);
  const urgent = threads.filter((t: Record<string, unknown>) => t.priority === "urgent" || t.priority === "high");
  const withDrafts = threads.filter((t: Record<string, unknown>) => t.has_draft);

  const threadLines = threads.slice(0, 20).map((t: Record<string, unknown>, i: number) => {
    const contact = t.contacts as Record<string, string> | null;
    const sender = contact?.full_name || contact?.email || "Unknown";
    const subject = (t.primary_subject as string) || "(no subject)";
    const snippet = (t.snippet as string)?.slice(0, 120) || "";
    const priority = (t.priority as string) || "medium";
    const unreadTag = t.is_unread ? "[UNREAD]" : "[READ]";
    const draftTag = t.has_draft ? "[HAS DRAFT]" : "";
    const time = t.last_message_at as string;
    return `${i + 1}. ${unreadTag}${draftTag} From: ${sender} | Subject: "${subject}" | Priority: ${priority} | Time: ${time}\n   Snippet: ${snippet}`;
  });

  const summary = [
    `Total threads: ${threads.length}`,
    `Unread: ${unread.length}`,
    `Urgent/High priority: ${urgent.length}`,
    `With pending drafts: ${withDrafts.length}`,
  ].join(", ");

  return { summary, threadLines, threads };
}

async function fetchRecentMessages(supabase: Awaited<ReturnType<typeof createClient>>, threadIds: string[]) {
  if (threadIds.length === 0) return [];
  const { data } = await supabase
    .from("messages")
    .select("id, thread_id, sender_name, sender_email, subject, body, snippet, timestamp, priority")
    .in("thread_id", threadIds)
    .order("timestamp", { ascending: false })
    .limit(30);
  return data || [];
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { query } = await request.json();

  if (!query) {
    return NextResponse.json({ error: "Missing query" }, { status: 400 });
  }

  const inbox = await fetchInboxContext(supabase);

  const topThreadIds = (inbox.threads || []).slice(0, 8).map((t: Record<string, unknown>) => t.id as string);
  const recentMessages = await fetchRecentMessages(supabase, topThreadIds);

  const messageContext = recentMessages.length > 0
    ? recentMessages.slice(0, 15).map((m) => {
        const body = ((m.body as string) || (m.snippet as string) || "").slice(0, 200);
        return `- From: ${m.sender_name || m.sender_email} | Subject: ${m.subject || "(none)"} | ${m.timestamp}\n  "${body}"`;
      }).join("\n")
    : "No recent messages available.";

  const { data: shopifyOrders } = await supabase
    .from("shopify_orders")
    .select("id, order_name, customer_name, customer_email, financial_status, fulfillment_status, total_price, currency, tracking_number, tracking_url")
    .order("created_at", { ascending: false })
    .limit(5);

  const shopifyContext = shopifyOrders && shopifyOrders.length > 0
    ? shopifyOrders.map((o) =>
        `- Order ${o.order_name}: ${o.customer_name} (${o.customer_email}) — ${o.financial_status}/${o.fulfillment_status} — ${o.total_price} ${o.currency}${o.tracking_number ? ` — Tracking: ${o.tracking_number}` : ""}`
      ).join("\n")
    : "No Shopify orders.";

  const systemPrompt = `You are AIVA, an AI executive assistant. You have access to the user's REAL inbox data and integrations.
Answer based ONLY on the data provided below. Do NOT make up emails or data that isn't in the context.

═══ INBOX OVERVIEW ═══
${inbox.summary}

═══ THREADS (most recent first) ═══
${inbox.threadLines?.join("\n") || "No threads."}

═══ RECENT MESSAGES ═══
${messageContext}

═══ SHOPIFY ORDERS ═══
${shopifyContext}

═══ RESPONSE FORMAT ═══
Respond in JSON:
{
  "textSummary": "Your conversational response referencing the real data above. Be specific — mention sender names, subjects, and counts.",
  "widgets": [
    {
      "type": "SHOPIFY_CARD" | "ACTION_CARD",
      "data": { ...only if data exists... }
    }
  ],
  "citations": [
    { "id": "cite_1", "source": "gmail", "snippet": "Brief excerpt from the actual email" }
  ]
}

RULES:
- Reference REAL emails, subjects, and senders from the data above
- Include citations for any specific email/thread you mention (source: "gmail" for emails, "shopify" for orders)
- The citation snippet should be an actual excerpt from the email
- Only generate widgets for Shopify orders if the user asks about orders AND order data exists
- For action suggestions, use ACTION_CARD with actionType "primary" or "ghost"
- Keep textSummary concise but specific. Use the sender's name, the subject line, and the priority.
- If the inbox is empty, say so directly.`;

  const response = await callLLM([
    { role: "system", content: systemPrompt },
    { role: "user", content: query },
  ], {
    temperature: 0.3,
    maxTokens: 2000,
    responseFormat: "json_object",
  });

  let aiResponse: AIResponse;
  try {
    aiResponse = JSON.parse(response.content);
    if (!aiResponse.widgets) aiResponse.widgets = [];
    if (!aiResponse.citations) aiResponse.citations = [];
  } catch {
    aiResponse = {
      textSummary: response.content,
      widgets: [],
      citations: [],
    };
  }

  return NextResponse.json(aiResponse);
}
