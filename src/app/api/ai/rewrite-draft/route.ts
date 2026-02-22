import { createClient } from "@/lib/supabase/server";
import { streamLLM } from "@/lib/ai/llm-client";
import { buildToneRewritePrompt } from "@/lib/ai/prompt-builder";

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
  }

  const { draft, tone } = await request.json();

  if (!draft || !tone) {
    return new Response(JSON.stringify({ error: "Missing draft or tone" }), { status: 400 });
  }

  const prompt = buildToneRewritePrompt(draft, tone);

  // SSE streaming response
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      try {
        for await (const chunk of streamLLM([
          { role: "user", content: prompt },
        ], { temperature: 0.6, maxTokens: 500 })) {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ text: chunk })}\n\n`));
        }
        controller.enqueue(encoder.encode("data: [DONE]\n\n"));
      } catch (err) {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ error: String(err) })}\n\n`));
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
