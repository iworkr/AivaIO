import { createClient } from "@/lib/supabase/server";
import { callLLM } from "./llm-client";
import type {
  EmailIntent,
  NexusClassification,
  SchedulingRules,
  FreeBusySlot,
  PendingAction,
  DailyBriefing,
} from "@/types";

type SupabaseClient = Awaited<ReturnType<typeof createClient>>;

const DEFAULT_RULES: SchedulingRules = {
  bufferMinutes: 15,
  noMeetingDays: [],
  workingHoursStart: "09:00",
  workingHoursEnd: "17:00",
  defaultMeetingDuration: 30,
  timezone: "America/New_York",
};

export async function getSchedulingRules(
  supabase: SupabaseClient,
  userId: string
): Promise<SchedulingRules> {
  const { data } = await supabase
    .from("workspace_settings")
    .select("scheduling_rules")
    .eq("user_id", userId)
    .maybeSingle();

  if (data?.scheduling_rules) {
    return { ...DEFAULT_RULES, ...data.scheduling_rules };
  }

  const { data: wsData } = await supabase
    .from("workspace_settings")
    .select("scheduling_rules")
    .limit(1)
    .maybeSingle();

  return wsData?.scheduling_rules
    ? { ...DEFAULT_RULES, ...wsData.scheduling_rules }
    : DEFAULT_RULES;
}

export async function classifyEmailIntent(
  subject: string,
  body: string,
  senderEmail: string
): Promise<NexusClassification> {
  const prompt = `Classify this email and extract entities. Return valid JSON only.

Subject: ${subject}
From: ${senderEmail}
Body (first 1000 chars): ${body.slice(0, 1000)}

Return JSON:
{
  "intent": "meeting_request" | "task_action" | "newsletter" | "general_inquiry" | "scheduling_confirmation" | "reschedule_request",
  "confidence": 0.0-1.0,
  "meetingEntities": { "participants": [{"name":"","email":""}], "suggestedTimeframe": "", "duration": null, "format": "call"|"video"|"in_person"|"coffee", "location": "", "subject": "" } or null,
  "taskEntities": { "title": "", "deadline": "", "estimatedMinutes": null } or null,
  "suggestedActions": [{ "type": "send_scheduling_email"|"create_calendar_event"|"timebox_task"|"auto_reply", "label": "", "description": "" }]
}`;

  const response = await callLLM(
    [{ role: "user", content: prompt }],
    { temperature: 0.1, maxTokens: 800, responseFormat: "json_object" }
  );

  try {
    return JSON.parse(response.content || "{}") as NexusClassification;
  } catch {
    return {
      intent: "general_inquiry",
      confidence: 0.5,
      suggestedActions: [],
    };
  }
}

export async function getFreeBusySlots(
  supabase: SupabaseClient,
  userId: string,
  startDate: string,
  endDate: string,
  rules: SchedulingRules
): Promise<FreeBusySlot[]> {
  const { data: events } = await supabase
    .from("calendar_events")
    .select("id, title, start_time, end_time")
    .eq("user_id", userId)
    .gte("start_time", startDate)
    .lte("end_time", endDate)
    .order("start_time", { ascending: true });

  const slots: FreeBusySlot[] = [];
  const start = new Date(startDate);
  const end = new Date(endDate);

  for (let d = new Date(start); d < end; d.setDate(d.getDate() + 1)) {
    const dayOfWeek = d.getDay();
    if (rules.noMeetingDays.includes(dayOfWeek)) continue;

    const [startH, startM] = rules.workingHoursStart.split(":").map(Number);
    const [endH, endM] = rules.workingHoursEnd.split(":").map(Number);

    const dayStart = new Date(d);
    dayStart.setHours(startH, startM, 0, 0);
    const dayEnd = new Date(d);
    dayEnd.setHours(endH, endM, 0, 0);

    const dayEvents = (events || []).filter((e) => {
      const eStart = new Date(e.start_time);
      return eStart >= dayStart && eStart < dayEnd;
    });

    let cursor = new Date(dayStart);
    for (const event of dayEvents) {
      const eStart = new Date(event.start_time);
      const eEnd = new Date(event.end_time);

      const bufferStart = new Date(eStart.getTime() - rules.bufferMinutes * 60000);
      const bufferEnd = new Date(eEnd.getTime() + rules.bufferMinutes * 60000);

      if (cursor < bufferStart) {
        slots.push({
          start: cursor.toISOString(),
          end: bufferStart.toISOString(),
          isBusy: false,
        });
      }

      slots.push({
        start: eStart.toISOString(),
        end: eEnd.toISOString(),
        isBusy: true,
        eventTitle: event.title,
      });

      cursor = bufferEnd > cursor ? bufferEnd : cursor;
    }

    if (cursor < dayEnd) {
      slots.push({
        start: cursor.toISOString(),
        end: dayEnd.toISOString(),
        isBusy: false,
      });
    }
  }

  return slots;
}

export function findAvailableSlots(
  freeBusy: FreeBusySlot[],
  durationMinutes: number,
  count: number = 3
): Array<{ start: string; end: string }> {
  const results: Array<{ start: string; end: string }> = [];

  for (const slot of freeBusy) {
    if (slot.isBusy) continue;
    const slotStart = new Date(slot.start);
    const slotEnd = new Date(slot.end);
    const slotDuration = (slotEnd.getTime() - slotStart.getTime()) / 60000;

    if (slotDuration >= durationMinutes) {
      const proposedEnd = new Date(slotStart.getTime() + durationMinutes * 60000);
      results.push({
        start: slotStart.toISOString(),
        end: proposedEnd.toISOString(),
      });
      if (results.length >= count) break;
    }
  }

  return results;
}

export async function createPendingAction(
  supabase: SupabaseClient,
  userId: string,
  action: Omit<PendingAction, "id" | "createdAt" | "status">
): Promise<PendingAction> {
  const { data, error } = await supabase
    .from("aiva_pending_actions")
    .insert({
      user_id: userId,
      type: action.type,
      status: "pending",
      summary: action.summary,
      details: action.details,
      source_thread_id: action.sourceThreadId || null,
      audit_reason: action.auditReason,
    })
    .select()
    .single();

  if (error) throw error;

  return {
    id: data.id,
    type: data.type,
    status: data.status,
    summary: data.summary,
    details: data.details,
    sourceThreadId: data.source_thread_id,
    createdAt: data.created_at,
    executedAt: data.executed_at,
    auditReason: data.audit_reason,
  };
}

export async function executePendingAction(
  supabase: SupabaseClient,
  userId: string,
  actionId: string
): Promise<{ success: boolean; error?: string }> {
  const { data: action, error: fetchError } = await supabase
    .from("aiva_pending_actions")
    .select("*")
    .eq("id", actionId)
    .eq("user_id", userId)
    .single();

  if (fetchError || !action) return { success: false, error: "Action not found" };
  if (action.status !== "pending") return { success: false, error: "Action already processed" };

  const details = action.details as PendingAction["details"];

  try {
    if (action.type === "create_calendar_event" && details.calendarEvent) {
      await supabase.from("calendar_events").insert({
        user_id: userId,
        title: details.calendarEvent.title,
        start_time: details.calendarEvent.startTime,
        end_time: details.calendarEvent.endTime,
        location: details.calendarEvent.location || null,
        description: `Scheduled by AIVA | Thread: ${details.threadId || "N/A"}`,
        conference_url: details.calendarEvent.conferenceUrl || null,
        attendees: details.calendarEvent.attendees || [],
        created_by: "aiva",
        source_thread_id: action.source_thread_id,
      });
    }

    if (action.type === "timebox_task" && details.task) {
      const { data: task } = await supabase
        .from("tasks")
        .insert({
          user_id: userId,
          title: details.task.title,
          description: `From email thread`,
          priority: "medium",
          due_date: details.task.deadline || null,
          source_thread_id: details.task.sourceThreadId || null,
        })
        .select()
        .single();

      if (task && details.calendarEvent) {
        await supabase.from("calendar_events").insert({
          user_id: userId,
          title: `Focus: ${details.task.title}`,
          start_time: details.calendarEvent.startTime,
          end_time: details.calendarEvent.endTime,
          color: "blue",
          task_id: task.id,
          created_by: "aiva",
          source_thread_id: details.task.sourceThreadId || null,
          description: `Time blocked by AIVA for task: ${details.task.title}`,
        });
      }
    }

    if (action.type === "send_scheduling_email" && details.draftText) {
      await supabase.from("message_drafts").insert({
        thread_id: details.threadId,
        content: details.draftText,
        status: "pending",
        confidence_score: 0.9,
        created_by: "aiva_nexus",
      });
    }

    await supabase
      .from("aiva_pending_actions")
      .update({ status: "approved", executed_at: new Date().toISOString() })
      .eq("id", actionId);

    await supabase.from("ai_action_logs").insert({
      user_id: userId,
      action_type: action.type,
      summary: action.summary,
      details: action.details,
      source_thread_id: action.source_thread_id,
      sent_at: new Date().toISOString(),
    });

    return { success: true };
  } catch (err) {
    return { success: false, error: String(err) };
  }
}

export async function generateDailyBriefing(
  supabase: SupabaseClient,
  userId: string,
  timezone: string
): Promise<DailyBriefing> {
  const now = new Date();
  const todayStart = new Date(now);
  todayStart.setHours(0, 0, 0, 0);
  const todayEnd = new Date(now);
  todayEnd.setHours(23, 59, 59, 999);

  const { data: events } = await supabase
    .from("calendar_events")
    .select("*")
    .eq("user_id", userId)
    .gte("start_time", todayStart.toISOString())
    .lte("start_time", todayEnd.toISOString())
    .order("start_time", { ascending: true });

  const { data: threads } = await supabase
    .from("threads")
    .select(`
      id, primary_subject, priority, is_unread, has_draft, snippet,
      contacts:contact_id (full_name, email)
    `)
    .eq("is_archived", false)
    .gte("last_message_at", todayStart.toISOString())
    .order("last_message_at", { ascending: false })
    .limit(50);

  const calEvents = events || [];
  const recentThreads = threads || [];

  const totalMeetings = calEvents.length;
  const totalMinutes = calEvents.reduce((sum, e) => {
    return sum + (new Date(e.end_time).getTime() - new Date(e.start_time).getTime()) / 60000;
  }, 0);
  const totalHours = Math.round((totalMinutes / 60) * 10) / 10;
  const freeHours = Math.max(0, 8 - totalHours);

  const unread = recentThreads.filter((t) => t.is_unread).length;
  const urgent = recentThreads.filter((t) => ["urgent", "high"].includes(t.priority as string)).length;
  const needsReply = recentThreads.filter((t) => t.has_draft).length;

  const meetingPreps = calEvents.slice(0, 5).map((e) => {
    const attendees = (e.attendees as Array<{ email: string }> || []).map((a) => a.email);
    const relatedThreads = recentThreads
      .filter((t) => {
        const contact = t.contacts as unknown as Record<string, string> | null;
        return contact?.email && attendees.includes(contact.email);
      })
      .map((t) => t.id as string);

    return {
      eventTitle: e.title,
      startTime: e.start_time,
      attendees,
      relatedThreadIds: relatedThreads,
      contextSummary: relatedThreads.length > 0
        ? `${relatedThreads.length} related email thread(s) found`
        : "No recent email context",
    };
  });

  const triageActions = recentThreads
    .filter((t) => ["urgent", "high"].includes(t.priority as string) && t.is_unread)
    .slice(0, 5)
    .map((t) => ({
      threadId: t.id as string,
      action: "flag_urgent",
      reason: `${t.priority} priority, unread: ${(t.primary_subject as string) || "No subject"}`,
    }));

  return {
    date: todayStart.toISOString().split("T")[0],
    meetingPreps,
    triageActions,
    focusBlocks: [],
    calendarDensity: { totalMeetings, totalHours, freeHours },
    inboxSummary: { unread, urgent, needsReply, autoHandled: 0 },
  };
}
