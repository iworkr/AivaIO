import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { callLLM } from "@/lib/ai/llm-client";
import { buildSupervisorPrompt } from "@/lib/ai/prompt-builder";

export interface SupervisorResult {
  confidenceScore: number;
  safeToSend: boolean;
  messageType: "ACKNOWLEDGEMENT" | "CONFIRMATION" | "INFORMATION" | "COMPLEX";
  hasForbiddenTopics: boolean;
  forbiddenTopicsFound: string[];
  isSchedulingUnambiguous: boolean | null;
  containsNewCommitments: boolean;
  senderRequestedAttachment: boolean;
  reasoning: string;
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { draft, context } = await request.json();

  if (!draft) {
    return NextResponse.json({ error: "Missing draft" }, { status: 400 });
  }

  const prompt = buildSupervisorPrompt(draft, context || "");

  const response = await callLLM([
    { role: "user", content: prompt },
  ], {
    model: "gpt-4o-mini",
    temperature: 0.1,
    maxTokens: 500,
    responseFormat: "json_object",
  });

  let result: SupervisorResult;
  try {
    result = JSON.parse(response.content || "{}");
  } catch {
    result = {
      confidenceScore: 0,
      safeToSend: false,
      messageType: "COMPLEX",
      hasForbiddenTopics: false,
      forbiddenTopicsFound: [],
      isSchedulingUnambiguous: null,
      containsNewCommitments: false,
      senderRequestedAttachment: false,
      reasoning: "Failed to parse supervisor response",
    };
  }

  return NextResponse.json(result);
}
