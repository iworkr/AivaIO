import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { callLLM } from "@/lib/ai/llm-client";
import type { AIResponse } from "@/types";

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { query, integrations } = await request.json();

  if (!query) {
    return NextResponse.json({ error: "Missing query" }, { status: 400 });
  }

  const systemPrompt = `You are AIVA, an AI orchestration engine. When the user asks a question, you must:
1. Determine which data sources to query (Gmail, Slack, Shopify, Calendar)
2. Generate a conversational text summary
3. If applicable, generate structured widget data

Respond in JSON:
{
  "textSummary": "Your conversational response with citations",
  "widgets": [
    {
      "type": "FLIGHT_CARD" | "SHOPIFY_CARD" | "CALENDAR_CARD" | "ACTION_CARD",
      "data": { ... structured data ... }
    }
  ],
  "citations": [
    { "id": "unique_id", "source": "gmail" | "slack" | "shopify", "snippet": "..." }
  ],
  "queriedSources": ["gmail", "slack"]
}

Available integrations: ${(integrations || ["gmail", "slack", "shopify"]).join(", ")}

IMPORTANT: Only include widgets when you have REAL data to display. 
For flights, use type "FLIGHT_CARD" with fields: airline, flightNumber, status, departure, arrival.
For orders, use type "SHOPIFY_CARD" with fields: orderId, orderName, customerName, financialStatus, fulfillmentStatus, totalPrice, currency, lineItems, trackingInfo.
For calendar events, use type "CALENDAR_CARD" with fields: title, startTime, endTime, location, attendees, conferenceUrl.
For suggestions, use type "ACTION_CARD" with fields: suggestion, actions.`;

  const response = await callLLM([
    { role: "system", content: systemPrompt },
    { role: "user", content: query },
  ], {
    temperature: 0.3,
    maxTokens: 1500,
    responseFormat: "json_object",
  });

  let aiResponse: AIResponse;
  try {
    aiResponse = JSON.parse(response.content);
  } catch {
    aiResponse = {
      textSummary: response.content,
      widgets: [],
      citations: [],
    };
  }

  return NextResponse.json(aiResponse);
}
