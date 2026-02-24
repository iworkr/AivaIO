import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { refreshGmailToken } from "@/lib/integrations/gmail";
import { callLLM } from "@/lib/ai/llm-client";

const GMAIL_API = "https://gmail.googleapis.com/gmail/v1/users/me";

export async function POST() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: connection } = await supabase
    .from("channel_connections")
    .select("*")
    .eq("user_id", user.id)
    .eq("provider", "gmail")
    .eq("status", "active")
    .maybeSingle();

  if (!connection) {
    return NextResponse.json(
      { error: "A Gmail connection is required for tone calibration" },
      { status: 400 }
    );
  }

  let accessToken = connection.access_token as string;
  const expiresAt = new Date(connection.token_expires_at || 0);
  if (expiresAt <= new Date()) {
    const refreshed = await refreshGmailToken(connection.refresh_token as string);
    accessToken = refreshed.accessToken;
    await supabase
      .from("channel_connections")
      .update({
        access_token: refreshed.accessToken,
        token_expires_at: refreshed.expiresAt.toISOString(),
      })
      .eq("id", connection.id);
  }

  // Fetch list of sent messages
  const listRes = await fetch(`${GMAIL_API}/messages?labelIds=SENT&maxResults=30`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!listRes.ok) {
    return NextResponse.json({ error: "Failed to fetch sent emails from Gmail" }, { status: 500 });
  }

  const listData = await listRes.json();
  const messageRefs: Array<{ id: string }> = listData.messages || [];

  if (messageRefs.length === 0) {
    return NextResponse.json({ error: "No sent emails found to analyze" }, { status: 400 });
  }

  // Fetch up to 15 message bodies for analysis
  const sampleMessages: string[] = [];
  for (const ref of messageRefs.slice(0, 20)) {
    if (sampleMessages.length >= 15) break;
    try {
      const msgRes = await fetch(`${GMAIL_API}/messages/${ref.id}?format=full`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (!msgRes.ok) continue;
      const msg = await msgRes.json();
      const body = extractPlainText(msg.payload);
      // Skip very short messages (auto-replies, receipts, etc.)
      if (body && body.trim().length > 80) {
        sampleMessages.push(body.trim().slice(0, 600));
      }
    } catch {
      // Skip individual message failures
    }
  }

  if (sampleMessages.length === 0) {
    return NextResponse.json({ error: "Could not extract content from sent emails" }, { status: 400 });
  }

  const emailSamples = sampleMessages
    .map((s, i) => `--- Email ${i + 1} ---\n${s}`)
    .join("\n\n");

  const prompt = `Analyze these sent emails and calibrate the writer's communication style. Return valid JSON only.

${emailSamples}

Based on these emails, rate the writer's communication style on each dimension (scale 1.0–10.0):
- formality: 1=very casual/informal, 10=very formal/professional
- length: 1=very brief/terse, 10=very detailed/long
- warmth: 1=cold/transactional, 10=warm/friendly/personal
- certainty: 1=very tentative/hedging, 10=very confident/direct

Return JSON:
{
  "dimensions": {
    "formality": <number>,
    "length": <number>,
    "warmth": <number>,
    "certainty": <number>
  },
  "summary": "<one concise sentence describing this person's writing style>"
}`;

  const response = await callLLM([{ role: "user", content: prompt }], {
    temperature: 0.1,
    maxTokens: 300,
    responseFormat: "json_object",
  });

  let analysis: { dimensions?: Record<string, number>; summary?: string };
  try {
    analysis = JSON.parse(response.content || "{}");
  } catch {
    return NextResponse.json({ error: "Failed to parse tone analysis" }, { status: 500 });
  }

  if (!analysis.dimensions) {
    return NextResponse.json({ error: "Failed to extract tone dimensions" }, { status: 500 });
  }

  const toneProfile = {
    dimensions: analysis.dimensions,
    summary: analysis.summary || "",
    calibratedAt: new Date().toISOString(),
    sampleCount: sampleMessages.length,
  };

  const { data: existing } = await supabase
    .from("voice_preferences")
    .select("id")
    .eq("user_id", user.id)
    .maybeSingle();

  if (existing) {
    await supabase
      .from("voice_preferences")
      .update({ tone_profile: toneProfile })
      .eq("user_id", user.id);
  } else {
    await supabase
      .from("voice_preferences")
      .insert({ user_id: user.id, tone_profile: toneProfile });
  }

  return NextResponse.json({
    success: true,
    toneProfile,
    sampleCount: sampleMessages.length,
  });
}

interface GmailPayloadPart {
  mimeType: string;
  body?: { data?: string };
  parts?: GmailPayloadPart[];
}

function extractPlainText(payload: GmailPayloadPart): string | null {
  if (payload.mimeType === "text/plain" && payload.body?.data) {
    const base64 = payload.body.data.replace(/-/g, "+").replace(/_/g, "/");
    return Buffer.from(base64, "base64").toString("utf-8");
  }
  if (payload.parts) {
    for (const part of payload.parts) {
      const result = extractPlainText(part);
      if (result) return result;
    }
  }
  return null;
}
