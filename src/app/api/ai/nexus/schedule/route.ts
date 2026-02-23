import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  getSchedulingRules,
  getFreeBusySlots,
  findAvailableSlots,
  createPendingAction,
} from "@/lib/ai/nexus-engine";
import { callLLM } from "@/lib/ai/llm-client";

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const { threadId, title, durationMinutes, attendeeEmails, dateFrom, dateTo, format, location } = body;

    if (!threadId || !title) {
      return NextResponse.json({ error: "Missing threadId or title" }, { status: 400 });
    }

    const rules = await getSchedulingRules(supabase, user.id);
    const duration = durationMinutes || rules.defaultMeetingDuration;
    const attendees = attendeeEmails || [];

    const searchFrom = dateFrom || new Date().toISOString().split("T")[0];
    const searchTo = dateTo || (() => {
      const d = new Date();
      d.setDate(d.getDate() + 7);
      return d.toISOString().split("T")[0];
    })();

    const freeBusy = await getFreeBusySlots(supabase, user.id, searchFrom, searchTo, rules);
    const available = findAvailableSlots(freeBusy, duration, 3);

    if (available.length === 0) {
      return NextResponse.json({
        success: false,
        message: "No available time slots found in the requested range.",
        proposedSlots: [],
      });
    }

    const { data: thread } = await supabase
      .from("threads")
      .select("primary_subject")
      .eq("id", threadId)
      .single();

    const { data: voicePrefs } = await supabase
      .from("voice_preferences")
      .select("tone_profile")
      .eq("user_id", user.id)
      .maybeSingle();

    const userName = (user.user_metadata?.full_name as string) || user.email?.split("@")[0] || "User";
    const slotsText = available.map((s, i) => {
      const d = new Date(s.start);
      return `${i + 1}. ${d.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })} at ${d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}`;
    }).join("\n");

    const draftPrompt = `Draft a polite scheduling reply for ${userName}. The user wants to meet with ${attendees.join(", ")} about "${title}".

Available times:
${slotsText}

Format: ${format || "video call"}
${location ? `Location: ${location}` : ""}
${rules.defaultVideoLink ? `Include video link: ${rules.defaultVideoLink}` : ""}

Write only the email body — no subject line. Be warm but concise. Match the user's ${voicePrefs?.tone_profile ? "calibrated" : "professional"} tone.`;

    const draftResponse = await callLLM(
      [{ role: "user", content: draftPrompt }],
      { temperature: 0.5, maxTokens: 500 }
    );

    const draftText = draftResponse.content || `Hi,\n\nI'd love to set up a meeting about "${title}". Would any of these times work?\n\n${slotsText}\n\nLooking forward to it!`;

    const action = await createPendingAction(supabase, user.id, {
      type: "send_scheduling_email",
      summary: `Schedule "${title}" with ${attendees.join(", ")}`,
      details: {
        threadId,
        draftText,
        calendarEvent: {
          title,
          startTime: available[0].start,
          endTime: available[0].end,
          attendees,
          conferenceUrl: rules.defaultVideoLink,
          location,
        },
      },
      sourceThreadId: threadId,
      auditReason: `Meeting negotiation initiated from thread: ${thread?.primary_subject || threadId}`,
      executedAt: undefined,
    });

    return NextResponse.json({
      success: true,
      pendingActionId: action.id,
      draftReply: draftText,
      proposedSlots: available.map((s) => ({
        start: s.start,
        end: s.end,
      })),
      rules: {
        buffer: rules.bufferMinutes,
        workingHours: `${rules.workingHoursStart}–${rules.workingHoursEnd}`,
      },
    });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
