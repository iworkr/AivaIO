import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { callLLM } from "@/lib/ai/llm-client";
import type { ChatMessage } from "@/lib/ai/llm-client";
import { TOOL_DEFINITIONS, executeToolCall } from "@/lib/ai/tools";
import type { AIResponse } from "@/types";

const MAX_TOOL_ITERATIONS = 5;
const MAX_HISTORY_MESSAGES = 30;

function buildSystemPrompt(userEmail: string, userName: string, timezone: string): string {
  const now = new Date();
  const dateStr = now.toLocaleDateString("en-US", {
    weekday: "long", year: "numeric", month: "long", day: "numeric",
    timeZone: timezone,
  });
  const timeStr = now.toLocaleTimeString("en-US", {
    hour: "2-digit", minute: "2-digit",
    timeZone: timezone,
  });

  return `You are AIVA, an elite AI executive assistant. You actively query the user's data using tools — never guess or fabricate information.

═══ ENVIRONMENT ═══
CURRENT DATETIME: ${dateStr}, ${timeStr} (${timezone})
USER: ${userName} (${userEmail})

═══ BEHAVIORAL RULES ═══
- ALWAYS use your tools to fetch real data before answering. Never fabricate emails, orders, or contacts.
- When the user says "today", use date ${now.toISOString().split("T")[0]}.
- When the user says "this week", calculate the date range from the most recent Monday.
- Maintain awareness of the full conversation history. If the user follows up with "now filter those" or "show me just the ones from Google", refer to the context of prior turns — do NOT ask the user to repeat themselves.
- If a follow-up is ambiguous, make a reasonable inference from the conversation history. Only ask for clarification if truly necessary.

═══ RESPONSE FORMAT ═══
After gathering data via tools, respond in JSON:
{
  "textSummary": "Brief conversational markdown text.",
  "widgets": [],
  "citations": []
}

═══ CRITICAL: MUTUAL EXCLUSION RULE ═══
When you include EMAIL_SUMMARY_CARD widgets, your textSummary must ONLY be a brief 1-2 sentence introduction.
DO NOT list, enumerate, or describe the individual emails in textSummary when widgets are present.

BAD: "You have 25 emails. Here are the top ones: - From Google: Security alert..."
GOOD: "You have **25 unread emails** today. I've highlighted the 3 most important ones below."

═══ FORMATTING RULES ═══
1. textSummary MUST be valid Markdown. Use **bold** for key figures. Keep it concise when widgets are attached.
2. CITATIONS: Only include when there are NO widgets. When widgets ARE present, set citations to [].
3. EMAIL_SUMMARY_CARD WIDGETS: When the user asks to summarize/list/filter emails, include the top 3 most relevant:
   {
     "type": "EMAIL_SUMMARY_CARD",
     "data": {
       "threadId": "<actual thread ID from tool results>",
       "sender": "<sender name>",
       "senderEmail": "<sender email>",
       "subject": "<subject line>",
       "snippet": "<brief snippet>",
       "timestamp": "<ISO timestamp>",
       "priority": "urgent" | "high" | "medium" | "low",
       "provider": "gmail",
       "isUnread": true | false
     }
   }
   ONLY use data from tool results — do NOT fabricate.
4. SHOPIFY_CARD: For Shopify order queries.
5. ACTION_CARD: For action suggestions.
6. If tools return empty results, say so directly with no widgets.`;
}

async function loadChatHistory(
  supabase: Awaited<ReturnType<typeof createClient>>,
  sessionId: string
): Promise<ChatMessage[]> {
  const { data } = await supabase
    .from("chat_messages")
    .select("role, content, tool_calls, tool_results")
    .eq("session_id", sessionId)
    .order("created_at", { ascending: true })
    .limit(MAX_HISTORY_MESSAGES);

  if (!data || data.length === 0) return [];

  const messages: ChatMessage[] = [];
  for (const row of data) {
    if (row.role === "tool" && row.tool_results) {
      const results = row.tool_results as Array<{ tool_call_id: string; name: string; content: string }>;
      for (const r of results) {
        messages.push({ role: "tool", content: r.content, tool_call_id: r.tool_call_id, name: r.name });
      }
    } else if (row.role === "assistant" && row.tool_calls) {
      messages.push({
        role: "assistant",
        content: row.content,
        tool_calls: row.tool_calls as ChatMessage["tool_calls"],
      });
    } else {
      messages.push({ role: row.role as ChatMessage["role"], content: row.content || "" });
    }
  }

  return messages;
}

async function saveChatMessage(
  supabase: Awaited<ReturnType<typeof createClient>>,
  sessionId: string,
  role: string,
  content: string | null,
  toolCalls?: unknown,
  toolResults?: unknown,
  widgets?: unknown
) {
  await supabase.from("chat_messages").insert({
    session_id: sessionId,
    role,
    content,
    tool_calls: toolCalls || null,
    tool_results: toolResults || null,
    widgets: widgets || null,
  });

  await supabase
    .from("chat_sessions")
    .update({ updated_at: new Date().toISOString() })
    .eq("id", sessionId);
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { query, sessionId: requestSessionId, timezone = "Australia/Sydney" } = body;

  if (!query) {
    return NextResponse.json({ error: "Missing query" }, { status: 400 });
  }

  let sessionId = requestSessionId;
  if (!sessionId) {
    const { data: newSession, error: sessionError } = await supabase
      .from("chat_sessions")
      .insert({ user_id: user.id, title: null })
      .select("id")
      .single();

    if (sessionError || !newSession) {
      return NextResponse.json({ error: "Failed to create session" }, { status: 500 });
    }
    sessionId = newSession.id;
  }

  await saveChatMessage(supabase, sessionId, "user", query);

  const history = await loadChatHistory(supabase, sessionId);

  const userName =
    (user.user_metadata?.full_name as string) ||
    user.email?.split("@")[0] ||
    "User";
  const userEmail = user.email || "";

  const systemPrompt = buildSystemPrompt(userEmail, userName, timezone);

  const llmMessages: ChatMessage[] = [
    { role: "system", content: systemPrompt },
    ...history,
  ];

  let iterations = 0;
  let finalContent: string | null = null;
  const allToolCalls: Array<{ name: string; args: Record<string, unknown>; result: string }> = [];

  while (iterations < MAX_TOOL_ITERATIONS) {
    iterations++;

    const response = await callLLM(llmMessages, {
      temperature: 0.3,
      maxTokens: 2000,
      tools: TOOL_DEFINITIONS,
    });

    if (response.tool_calls && response.tool_calls.length > 0) {
      llmMessages.push({
        role: "assistant",
        content: response.content,
        tool_calls: response.tool_calls,
      });

      const toolResultMessages: Array<{ tool_call_id: string; name: string; content: string }> = [];

      for (const toolCall of response.tool_calls) {
        let args: Record<string, unknown> = {};
        try {
          args = JSON.parse(toolCall.function.arguments);
        } catch { /* empty args */ }

        const result = await executeToolCall(supabase, toolCall.function.name, args);
        allToolCalls.push({ name: toolCall.function.name, args, result });

        const toolMsg: ChatMessage = {
          role: "tool",
          content: result,
          tool_call_id: toolCall.id,
          name: toolCall.function.name,
        };
        llmMessages.push(toolMsg);
        toolResultMessages.push({
          tool_call_id: toolCall.id,
          name: toolCall.function.name,
          content: result,
        });
      }

      await saveChatMessage(
        supabase, sessionId, "assistant", response.content,
        response.tool_calls
      );
      await saveChatMessage(
        supabase, sessionId, "tool", null,
        null, toolResultMessages
      );

      continue;
    }

    finalContent = response.content;
    break;
  }

  if (!finalContent) {
    finalContent = JSON.stringify({
      textSummary: "I ran into a problem processing that request. Could you try again?",
      widgets: [],
      citations: [],
    });
  }

  let aiResponse: AIResponse;
  try {
    aiResponse = JSON.parse(finalContent);
    if (!aiResponse.widgets) aiResponse.widgets = [];
    if (!aiResponse.citations) aiResponse.citations = [];
    if (!aiResponse.textSummary && typeof finalContent === "string") {
      aiResponse.textSummary = finalContent;
    }
  } catch {
    aiResponse = {
      textSummary: finalContent,
      widgets: [],
      citations: [],
    };
  }

  await saveChatMessage(
    supabase, sessionId, "assistant", finalContent,
    null, null, aiResponse.widgets.length > 0 ? aiResponse.widgets : null
  );

  if (!requestSessionId) {
    const titlePrompt = `Based on the following user query, generate a very short title (3-5 words max) for this chat session. Reply with just the title, nothing else.\n\nQuery: "${query}"`;
    try {
      const titleResponse = await callLLM([
        { role: "user", content: titlePrompt },
      ], { temperature: 0.5, maxTokens: 20 });
      if (titleResponse.content) {
        const title = titleResponse.content.replace(/^["']|["']$/g, "").trim();
        await supabase
          .from("chat_sessions")
          .update({ title })
          .eq("id", sessionId);
      }
    } catch { /* non-critical */ }
  }

  return NextResponse.json({
    ...aiResponse,
    sessionId,
    toolsUsed: allToolCalls.map((t) => t.name),
  });
}
