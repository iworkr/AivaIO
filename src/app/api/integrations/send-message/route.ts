import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { threadId, finalText, originalAIVADraft, channel } = await request.json();

  if (!threadId || !finalText) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  // Log the action for the audit trail
  const { error: logError } = await supabase.from("ai_action_logs").insert({
    workspace_id: user.user_metadata?.workspace_id,
    action: "AUTO_SEND",
    channel: channel || "GMAIL",
    recipient: "recipient@example.com",
    confidence_score: 0.92,
    original_message: originalAIVADraft,
    dispatched_draft: finalText,
  });

  if (logError) {
    console.error("Failed to log action:", logError);
  }

  // Delta Feedback: compare original draft to final text
  if (originalAIVADraft && originalAIVADraft !== finalText) {
    await processDeltaFeedback(supabase, user.id, originalAIVADraft, finalText);
  }

  // In production: dispatch via Gmail API / Slack API / etc.

  return NextResponse.json({ success: true, messageId: `msg_${Date.now()}` });
}

async function processDeltaFeedback(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
  original: string,
  edited: string
) {
  const distance = levenshteinRatio(original, edited);

  if (distance < 0.05) return; // Typo fix, ignore
  if (distance > 0.80) {
    // Complete rewrite — potentially replace a golden email
    console.log("Delta: Complete rewrite detected, queuing exemplar update");
  }
  // 5-80%: meaningful edit — queue for tone profile adjustment
  console.log(`Delta: ${(distance * 100).toFixed(1)}% change detected`);
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
      if (i === 0) {
        costs[j] = j;
      } else if (j > 0) {
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
