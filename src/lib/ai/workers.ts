import { callLLM, generateEmbedding } from "./llm-client";

interface ToneProfileDimensions {
  formality: number;
  length: number;
  warmth: number;
  certainty: number;
}

/**
 * Historical Sync Worker: Analyzes sent emails to build initial tone profile.
 * In production, this would be triggered as a background job (Inngest/BullMQ).
 */
export async function runHistoricalSync(
  sentEmails: string[],
  userId: string,
  supabase: { from: (table: string) => { upsert: (data: unknown) => Promise<{ error: unknown }> } }
): Promise<ToneProfileDimensions> {
  // Sanitize emails: strip signatures, quoted replies, HTML
  const sanitized = sentEmails.map(sanitizeEmail).filter((e) => e.length > 20);

  // Batch through LLM for dimensional scoring
  const batchSize = 10;
  const scores: ToneProfileDimensions[] = [];

  for (let i = 0; i < sanitized.length; i += batchSize) {
    const batch = sanitized.slice(i, i + batchSize);
    const prompt = `Analyze these email excerpts and score the writer's style on each dimension (1-10).
Return JSON: { "formality": <1-10>, "length": <1-10>, "warmth": <1-10>, "certainty": <1-10> }

Emails:
${batch.map((e, j) => `---Email ${j + 1}---\n${e}`).join("\n\n")}`;

    try {
      const res = await callLLM([{ role: "user", content: prompt }], {
        model: "gpt-4o-mini",
        temperature: 0.1,
        responseFormat: "json_object",
      });
      const parsed = JSON.parse(res.content);
      scores.push(parsed);
    } catch { /* skip bad batches */ }
  }

  // Calculate median
  const median = (arr: number[]) => {
    const sorted = [...arr].sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
  };

  const profile: ToneProfileDimensions = {
    formality: median(scores.map((s) => s.formality)),
    length: median(scores.map((s) => s.length)),
    warmth: median(scores.map((s) => s.warmth)),
    certainty: median(scores.map((s) => s.certainty)),
  };

  // Store in database
  await supabase.from("voice_preferences").upsert({
    user_id: userId,
    tone_profile: { dimensions: profile },
    last_synced_at: new Date().toISOString(),
  });

  // Select top exemplars for RAG and store embeddings
  const topExemplars = sanitized.slice(0, 10);
  for (const exemplar of topExemplars) {
    try {
      const embedding = await generateEmbedding(exemplar);
      await supabase.from("user_exemplars").upsert({
        user_id: userId,
        content: exemplar,
        embedding,
        intent_category: "general",
        channel: "email",
      });
    } catch { /* skip failed embeddings */ }
  }

  return profile;
}

/**
 * Delta Feedback Worker: Compares original draft vs user edit.
 */
export async function processDeltaFeedback(
  originalDraft: string,
  finalText: string,
  userId: string,
  supabase: { from: (table: string) => { select: (cols: string) => { eq: (col: string, val: string) => { maybeSingle: () => Promise<{ data: Record<string, unknown> | null }> } }; upsert: (data: unknown) => Promise<{ error: unknown }> } }
): Promise<void> {
  const distance = levenshteinRatio(originalDraft, finalText);

  if (distance < 0.05) return; // Typo fix, ignore

  if (distance > 0.80) {
    // Complete rewrite: store as new golden exemplar
    try {
      const embedding = await generateEmbedding(finalText);
      await supabase.from("user_exemplars").upsert({
        user_id: userId,
        content: finalText,
        embedding,
        intent_category: "user_rewrite",
        channel: "email",
      });
    } catch { /* best effort */ }
    return;
  }

  // Meaningful edit (5-80%): analyze the shift
  const res = await callLLM([{
    role: "user",
    content: `Analyze the difference between the Original Draft and the User's Final Edit. How did the user alter the tone?
Return JSON: { "formalityDelta": <float>, "warmthDelta": <float>, "lengthDelta": <float>, "certaintyDelta": <float>, "addedQuirk": "<string or null>" }

Original Draft:
${originalDraft}

User's Final Edit:
${finalText}`,
  }], {
    model: "gpt-4o-mini",
    temperature: 0.1,
    responseFormat: "json_object",
  });

  try {
    const deltas = JSON.parse(res.content);

    // Fetch current profile and apply deltas
    const { data: current } = await supabase.from("voice_preferences")
      .select("tone_profile")
      .eq("user_id", userId)
      .maybeSingle();

    if (current?.tone_profile) {
      const dims = (current.tone_profile as { dimensions: ToneProfileDimensions }).dimensions;
      const updated = {
        formality: clamp(dims.formality + (deltas.formalityDelta || 0) * 0.3, 1, 10),
        length: clamp(dims.length + (deltas.lengthDelta || 0) * 0.3, 1, 10),
        warmth: clamp(dims.warmth + (deltas.warmthDelta || 0) * 0.3, 1, 10),
        certainty: clamp(dims.certainty + (deltas.certaintyDelta || 0) * 0.3, 1, 10),
      };

      await supabase.from("voice_preferences").upsert({
        user_id: userId,
        tone_profile: { dimensions: updated },
        updated_at: new Date().toISOString(),
      });
    }
  } catch { /* best effort */ }
}

/**
 * Shopify Historical Backfill Worker
 */
export async function runShopifyBackfill(
  shopDomain: string,
  accessToken: string,
  workspaceId: string,
  supabase: { from: (table: string) => { upsert: (data: unknown, opts?: unknown) => Promise<{ error: unknown }> } }
): Promise<{ customersCount: number; ordersCount: number }> {
  let customersCount = 0;
  let ordersCount = 0;
  let cursor: string | null = null;

  // Paginate customers
  do {
    const query = `{
      customers(first: 50${cursor ? `, after: "${cursor}"` : ""}) {
        edges {
          cursor
          node { id email ordersCount totalSpent tags }
        }
        pageInfo { hasNextPage }
      }
    }`;

    const res = await shopifyGraphQL(shopDomain, accessToken, query);
    const edges = res?.data?.customers?.edges || [];

    for (const { node } of edges) {
      await supabase.from("shopify_customers").upsert({
        workspace_id: workspaceId,
        shopify_id: node.id,
        email: node.email,
        orders_count: parseInt(node.ordersCount) || 0,
        total_spent: node.totalSpent || "0.00",
        tags: node.tags || [],
      }, { onConflict: "shopify_id" });
      customersCount++;
    }

    cursor = edges.length > 0 && res?.data?.customers?.pageInfo?.hasNextPage
      ? edges[edges.length - 1].cursor
      : null;
  } while (cursor);

  // Fetch orders (last 90 days)
  const since = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString();
  cursor = null;

  do {
    const query = `{
      orders(first: 50, query: "created_at:>${since}"${cursor ? `, after: "${cursor}"` : ""}) {
        edges {
          cursor
          node {
            id name email displayFinancialStatus displayFulfillmentStatus
            totalPriceSet { shopMoney { amount } }
            lineItems(first: 10) { edges { node { title quantity } } }
          }
        }
        pageInfo { hasNextPage }
      }
    }`;

    const res = await shopifyGraphQL(shopDomain, accessToken, query);
    const edges = res?.data?.orders?.edges || [];

    for (const { node } of edges) {
      await supabase.from("shopify_orders").upsert({
        workspace_id: workspaceId,
        shopify_order_id: node.id,
        order_name: node.name,
        customer_email: node.email || "",
        financial_status: node.displayFinancialStatus?.toLowerCase() || "pending",
        fulfillment_status: node.displayFulfillmentStatus?.toLowerCase() || "unfulfilled",
        total_price: node.totalPriceSet?.shopMoney?.amount || "0.00",
        line_items_summary: node.lineItems?.edges?.map((e: { node: { title: string; quantity: number } }) => ({
          title: e.node.title,
          qty: e.node.quantity,
        })) || [],
      }, { onConflict: "shopify_order_id" });
      ordersCount++;
    }

    cursor = edges.length > 0 && res?.data?.orders?.pageInfo?.hasNextPage
      ? edges[edges.length - 1].cursor
      : null;
  } while (cursor);

  return { customersCount, ordersCount };
}

async function shopifyGraphQL(domain: string, token: string, query: string) {
  const res = await fetch(`https://${domain}/admin/api/2024-10/graphql.json`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Shopify-Access-Token": token,
    },
    body: JSON.stringify({ query }),
  });
  if (!res.ok) throw new Error(`Shopify API error: ${res.status}`);
  return res.json();
}

function sanitizeEmail(text: string): string {
  return text
    .replace(/On\s+.*?wrote:[\s\S]*/gi, "")     // Quoted replies
    .replace(/--\s*\n[\s\S]*/g, "")               // Signature blocks
    .replace(/<[^>]+>/g, "")                       // HTML tags
    .replace(/^>.*$/gm, "")                        // Quoted lines
    .replace(/\n{3,}/g, "\n\n")                    // Excessive newlines
    .trim();
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
      if (i === 0) costs[j] = j;
      else if (j > 0) {
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

function clamp(val: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, val));
}
