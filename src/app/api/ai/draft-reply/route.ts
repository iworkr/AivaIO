import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

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

  // Fetch user's tone profile
  const { data: voicePrefs } = await supabase
    .from("voice_preferences")
    .select("*")
    .eq("user_id", user.id)
    .single();

  const toneProfile = voicePrefs?.tone_profile || {
    dimensions: { formality: 6.5, length: 3.0, warmth: 7.0, certainty: 8.5 },
  };

  // Build prompt (server-side only — API keys never reach client)
  const systemPrompt = buildSystemPrompt(user, toneProfile, channel);

  // In production: call OpenAI/Anthropic API here
  // For now, return a mock draft
  const mockDraft = generateMockDraft(messageContext);

  return NextResponse.json({
    draft: mockDraft,
    confidenceScore: 0.92,
    toneApplied: toneProfile.dimensions,
  });
}

function buildSystemPrompt(
  user: { id: string; user_metadata?: { full_name?: string } },
  toneProfile: { dimensions: Record<string, number> },
  channel: string
) {
  return `# SYSTEM PERSONA
You are AIVA, an elite executive assistant drafting a reply on behalf of ${user.user_metadata?.full_name || "the user"}.
Your goal is to save the user time while perfectly mimicking their personal style.
Do not hallucinate. Do not use AI clichés.

# CHANNEL ETIQUETTE
Current Channel: ${channel || "EMAIL"}

# USER TONE PROFILE
- Formality: ${toneProfile.dimensions.formality}/10
- Length: ${toneProfile.dimensions.length}/10
- Warmth: ${toneProfile.dimensions.warmth}/10
- Certainty: ${toneProfile.dimensions.certainty}/10`;
}

function generateMockDraft(context: string): string {
  return `Thanks for reaching out! I've looked into this and have the details ready for you. Let me know if you need anything else.`;
}
