import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { callLLM, generateEmbedding } from "@/lib/ai/llm-client";
import { buildDraftPrompt, buildShopifyContextBlock } from "@/lib/ai/prompt-builder";

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { threadId, messageContext, channel } = body;

  if (!threadId || !messageContext) {
    return NextResponse.json({ error: "Missing threadId or messageContext" }, { status: 400 });
  }

  // Fetch tone profile
  const { data: voicePrefs } = await supabase
    .from("voice_preferences")
    .select("tone_profile")
    .eq("user_id", user.id)
    .maybeSingle();

  const toneProfile = voicePrefs?.tone_profile?.dimensions || {
    formality: 6.5, length: 3.0, warmth: 7.0, certainty: 8.5,
  };

  // RAG: fetch golden exemplars via pgvector similarity search
  let exemplars: string[] = [];
  try {
    const embedding = await generateEmbedding(messageContext);
    const { data: exemplarRows } = await supabase.rpc("match_exemplars", {
      query_embedding: embedding,
      match_count: 2,
      p_user_id: user.id,
    });
    if (exemplarRows) {
      exemplars = exemplarRows.map((r: { content: string }) => r.content);
    }
  } catch {
    // Exemplar retrieval is optional, continue without
  }

  // Shopify context if sender is a customer
  let shopifyContext = "";
  if (body.senderEmail) {
    const { data: shopCustomer } = await supabase
      .from("shopify_customers")
      .select("*")
      .eq("email", body.senderEmail)
      .maybeSingle();

    if (shopCustomer) {
      const { data: shopOrders } = await supabase
        .from("shopify_orders")
        .select("*")
        .eq("customer_email", body.senderEmail)
        .order("created_at", { ascending: false })
        .limit(3);

      shopifyContext = buildShopifyContextBlock(shopCustomer, shopOrders || []);
    }
  }

  // Build prompt and call LLM
  const systemPrompt = buildDraftPrompt({
    userName: user.user_metadata?.full_name as string || "the user",
    channel: channel || "GMAIL",
    toneProfile,
    exemplars,
    shopifyContext: shopifyContext || undefined,
    latestMessage: messageContext,
  });

  const response = await callLLM([
    { role: "system", content: systemPrompt },
    { role: "user", content: `Draft a reply to this message:\n\n${messageContext}` },
  ], { temperature: 0.7, maxTokens: 500 });

  return NextResponse.json({
    draft: response.content,
    confidenceScore: 0.85,
    toneApplied: toneProfile,
  });
}
