interface ToneProfile {
  formality: number;
  length: number;
  warmth: number;
  certainty: number;
}

interface PromptContext {
  userName: string;
  channel: string;
  toneProfile: ToneProfile;
  exemplars?: string[];
  shopifyContext?: string;
  conversationSummary?: string;
  latestMessage: string;
}

const channelRules: Record<string, { maxTokens: number; formalityMod: number; signature: boolean }> = {
  GMAIL: { maxTokens: 500, formalityMod: 0, signature: true },
  SLACK: { maxTokens: 200, formalityMod: -1, signature: false },
  WHATSAPP: { maxTokens: 150, formalityMod: -1, signature: false },
  SHOPIFY: { maxTokens: 300, formalityMod: 1, signature: true },
  LINKEDIN: { maxTokens: 300, formalityMod: 1, signature: true },
};

export function buildDraftPrompt(ctx: PromptContext): string {
  const rules = channelRules[ctx.channel] || channelRules.GMAIL;
  const adjustedFormality = Math.min(10, Math.max(1, ctx.toneProfile.formality + rules.formalityMod));

  let prompt = `# SYSTEM PERSONA
You are AIVA, an elite executive assistant drafting a reply on behalf of ${ctx.userName}.
Your goal is to save the user time while perfectly mimicking their personal style.
Do not hallucinate. Do not use AI clichés (e.g., "I hope this email finds you well").

# CHANNEL ETIQUETTE
Current Channel: ${ctx.channel}
Rules for this channel:
- Max tokens: ${rules.maxTokens}
- Signature allowed: ${rules.signature}

# USER TONE PROFILE
The user's style is mathematically defined as:
- Formality: ${adjustedFormality}/10 (1=Casual, 10=Formal)
- Length: ${ctx.toneProfile.length}/10 (1=Concise, 10=Detailed)
- Warmth: ${ctx.toneProfile.warmth}/10 (1=Reserved, 10=Friendly)
- Certainty: ${ctx.toneProfile.certainty}/10 (1=Tentative, 10=Assertive)
`;

  if (ctx.exemplars && ctx.exemplars.length > 0) {
    prompt += `\n# GOLDEN EXAMPLES (Few-Shot)
To help you match the tone, here is exactly how the user has responded to similar situations in the past:
`;
    ctx.exemplars.forEach((ex, i) => {
      prompt += `<example_${i + 1}>\n${ex}\n</example_${i + 1}>\n`;
    });
  }

  if (ctx.shopifyContext) {
    prompt += `\n${ctx.shopifyContext}\n`;
  }

  prompt += `\n# TASK
Draft a reply to the following message.${ctx.conversationSummary ? ` Use this conversation summary as context: ${ctx.conversationSummary}` : ""}
Match the tone profile and channel etiquette exactly.
Do not include a subject line. Just the body text.

Latest message:
${ctx.latestMessage}`;

  return prompt;
}

export function buildSupervisorPrompt(draft: string, context: string): string {
  return `You are a safety supervisor for an AI email assistant. Analyze the following draft reply and determine if it is safe to auto-send.

DRAFT TO EVALUATE:
${draft}

ORIGINAL CONTEXT:
${context}

Respond in JSON format:
{
  "confidenceScore": <float 0.0-1.0>,
  "safeToSend": <boolean>,
  "messageType": <"ACKNOWLEDGEMENT" | "CONFIRMATION" | "INFORMATION" | "COMPLEX">,
  "hasForbiddenTopics": <boolean>,
  "forbiddenTopicsFound": [<list of topics if any>],
  "isSchedulingUnambiguous": <boolean or null if not scheduling>,
  "containsNewCommitments": <boolean>,
  "senderRequestedAttachment": <boolean>,
  "reasoning": "<brief explanation>"
}`;
}

export function buildToneRewritePrompt(draft: string, targetTone: string): string {
  const toneInstructions: Record<string, string> = {
    Friendly: "Rewrite to be warm, approachable, and conversational. Use casual language and show genuine interest.",
    Professional: "Rewrite to be polished, clear, and professional. Maintain formality without being cold.",
    Brief: "Rewrite to be extremely concise. Maximum 2-3 sentences. Remove all fluff. Get straight to the point.",
  };

  return `Rewrite the following draft in a ${targetTone.toLowerCase()} tone.
${toneInstructions[targetTone] || "Keep the meaning intact but adjust the tone."}

Original draft:
${draft}

Rewritten draft (just the text, no explanations):`;
}

export function buildShopifyContextBlock(
  customer: { orders_count: number; total_spent: string; tags: unknown },
  orders: Array<{ order_name: string; created_at: string; financial_status: string; fulfillment_status: string; line_items_summary: unknown; tracking_info: unknown }>
): string {
  const precedence = Number(customer.total_spent) > 500 ? "VIP Customer" :
    customer.orders_count > 1 ? "Returning Customer" : "New Customer";

  let block = `# SHOPIFY CUSTOMER CONTEXT
Customer Identity: ${precedence} (Orders: ${customer.orders_count}, LTV: $${customer.total_spent})
Tags: ${JSON.stringify(customer.tags)}
`;

  if (orders.length > 0) {
    block += "\n# RECENT ORDERS\n";
    orders.forEach((order) => {
      const items = order.line_items_summary as Array<{ title: string; qty: number }> | null;
      block += `Order: ${order.order_name}
Date: ${order.created_at ? new Date(order.created_at).toLocaleDateString() : "Unknown"}
Status: ${order.financial_status}, ${order.fulfillment_status || "UNFULFILLED"}
Items: ${items ? items.map((i) => `${i.title} (x${i.qty})`).join(", ") : "N/A"}
${order.tracking_info ? `Tracking: ${JSON.stringify(order.tracking_info)}` : ""}
`;
    });
  }

  block += `\n# RULES FOR E-COMMERCE QUERIES
1. Reference the specific order number.
2. Provide exact fulfillment status and tracking information.
3. Do NOT hallucinate order numbers, prices, or shipping carriers.
4. ${precedence === "VIP Customer" ? "This is a VIP customer. Be exceptionally warm and accommodating." : "Be helpful and professional."}
`;

  return block;
}
