const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const OPENAI_BASE_URL = process.env.OPENAI_BASE_URL || "https://api.openai.com/v1";

export interface ChatMessage {
  role: "system" | "user" | "assistant" | "tool";
  content: string | null;
  tool_calls?: ToolCall[];
  tool_call_id?: string;
  name?: string;
}

export interface ToolCall {
  id: string;
  type: "function";
  function: {
    name: string;
    arguments: string;
  };
}

interface ToolDefinition {
  type: "function";
  function: {
    name: string;
    description: string;
    parameters: Record<string, unknown>;
  };
}

export interface LLMResponse {
  content: string | null;
  tool_calls?: ToolCall[];
  finish_reason?: string;
  usage?: { prompt_tokens: number; completion_tokens: number };
}

export async function callLLM(
  messages: ChatMessage[],
  options: {
    model?: string;
    temperature?: number;
    maxTokens?: number;
    responseFormat?: "text" | "json_object";
    tools?: ToolDefinition[];
  } = {}
): Promise<LLMResponse> {
  const {
    model = "gpt-4o-mini",
    temperature = 0.7,
    maxTokens = 1024,
    responseFormat = "text",
    tools,
  } = options;

  if (!OPENAI_API_KEY) {
    console.warn("OPENAI_API_KEY not set, returning mock response");
    return { content: generateFallback(messages) };
  }

  const body: Record<string, unknown> = {
    model,
    messages,
    temperature,
    max_tokens: maxTokens,
  };

  if (responseFormat === "json_object") {
    body.response_format = { type: "json_object" };
  }

  if (tools && tools.length > 0) {
    body.tools = tools;
    body.tool_choice = "auto";
  }

  const res = await fetch(`${OPENAI_BASE_URL}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${OPENAI_API_KEY}`,
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`LLM API error: ${res.status} ${err}`);
  }

  const data = await res.json();
  const choice = data.choices?.[0];

  return {
    content: choice?.message?.content || null,
    tool_calls: choice?.message?.tool_calls,
    finish_reason: choice?.finish_reason,
    usage: data.usage,
  };
}

export async function* streamLLM(
  messages: ChatMessage[],
  options: { model?: string; temperature?: number; maxTokens?: number } = {}
): AsyncGenerator<string> {
  const { model = "gpt-4o-mini", temperature = 0.7, maxTokens = 1024 } = options;

  if (!OPENAI_API_KEY) {
    yield generateFallback(messages);
    return;
  }

  const res = await fetch(`${OPENAI_BASE_URL}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model,
      messages,
      temperature,
      max_tokens: maxTokens,
      stream: true,
    }),
  });

  if (!res.ok) throw new Error(`LLM stream error: ${res.status}`);

  const reader = res.body?.getReader();
  if (!reader) return;

  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() || "";

    for (const line of lines) {
      if (!line.startsWith("data: ")) continue;
      const data = line.slice(6);
      if (data === "[DONE]") return;
      try {
        const parsed = JSON.parse(data);
        const delta = parsed.choices?.[0]?.delta?.content;
        if (delta) yield delta;
      } catch { /* skip malformed chunks */ }
    }
  }
}

export async function generateEmbedding(text: string): Promise<number[]> {
  if (!OPENAI_API_KEY) return Array(1536).fill(0);

  const res = await fetch(`${OPENAI_BASE_URL}/embeddings`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: "text-embedding-3-small",
      input: text,
    }),
  });

  if (!res.ok) throw new Error(`Embedding error: ${res.status}`);
  const data = await res.json();
  return data.data[0].embedding;
}

function generateFallback(messages: ChatMessage[]): string {
  const lastUser = messages.findLast((m) => m.role === "user");
  if (!lastUser) return "I'm here to help. What can I do for you?";
  return `Thanks for reaching out! I've reviewed the context and have the information ready. Let me know if you need anything else.`;
}
