import { createClient } from "@/lib/supabase/server";
import {
  classifyEmailIntent,
  getSchedulingRules,
  getFreeBusySlots,
  findAvailableSlots,
  createPendingAction,
} from "./nexus-engine";

type SupabaseClient = Awaited<ReturnType<typeof createClient>>;

export const TOOL_DEFINITIONS = [
  {
    type: "function" as const,
    function: {
      name: "search_inbox",
      description: "Searches the user's unified inbox (Gmail, Slack) based on specific parameters. Use this when the user asks to summarize, find, filter, or grep messages. Always use this tool instead of guessing about email content.",
      parameters: {
        type: "object",
        properties: {
          channel: { type: "string", enum: ["ALL", "GMAIL", "SLACK", "WHATSAPP"], description: "Which integration to search" },
          date_from: { type: "string", description: "ISO date string for start of range, e.g. '2026-02-22'" },
          date_to: { type: "string", description: "ISO date string for end of range, e.g. '2026-02-22'" },
          sender_name: { type: "string", description: "Filter by sender name (partial match)" },
          sender_email: { type: "string", description: "Filter by sender email (partial match)" },
          is_unread: { type: "boolean", description: "Filter by unread status" },
          priority: { type: "string", enum: ["urgent", "high", "medium", "low"], description: "Filter by priority level" },
          search_query: { type: "string", description: "Keywords to search in subject and body" },
          limit: { type: "number", description: "Max results to return (default 25)" },
        },
      },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "get_thread_detail",
      description: "Fetches full message history for a specific email thread. Use when the user wants to see the full conversation or details of a specific thread.",
      parameters: {
        type: "object",
        properties: {
          thread_id: { type: "string", description: "The thread UUID" },
        },
        required: ["thread_id"],
      },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "get_shopify_orders",
      description: "Fetches Shopify orders. Use when the user asks about orders, tracking, or customer purchase history.",
      parameters: {
        type: "object",
        properties: {
          order_number: { type: "string", description: "Specific order number to look up" },
          customer_email: { type: "string", description: "Filter orders by customer email" },
          limit: { type: "number", description: "Max results (default 5)" },
        },
      },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "get_contact_info",
      description: "Fetches contact/CRM information for a person. Use when the user asks about a contact's history, details, or relationship.",
      parameters: {
        type: "object",
        properties: {
          email: { type: "string", description: "Contact email address" },
          name: { type: "string", description: "Contact name (partial match)" },
        },
      },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "list_tasks",
      description: "Lists the user's tasks with optional filtering. Use when the user asks about their tasks, to-do list, or action items.",
      parameters: {
        type: "object",
        properties: {
          status: { type: "string", enum: ["pending", "in_progress", "completed", "cancelled"], description: "Filter by task status" },
          priority: { type: "string", enum: ["high", "medium", "low"], description: "Filter by priority" },
        },
      },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "create_task",
      description: "Creates a new task for the user. Use when the user asks to add a task, reminder, or to-do item.",
      parameters: {
        type: "object",
        properties: {
          title: { type: "string", description: "The task title" },
          description: { type: "string", description: "Optional task description" },
          priority: { type: "string", enum: ["high", "medium", "low"], description: "Task priority (default: medium)" },
          due_date: { type: "string", description: "ISO date string for the deadline" },
        },
        required: ["title"],
      },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "get_calendar_events",
      description: "Fetches the user's calendar events for a date range. Use when the user asks about their schedule, meetings, or calendar.",
      parameters: {
        type: "object",
        properties: {
          date_from: { type: "string", description: "ISO date string for start of range" },
          date_to: { type: "string", description: "ISO date string for end of range" },
        },
        required: ["date_from", "date_to"],
      },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "classify_email_intent",
      description: "Classifies an email to determine if it's a meeting request, task/action item, newsletter, or general inquiry. Use when analyzing an email thread to suggest next actions.",
      parameters: {
        type: "object",
        properties: {
          thread_id: { type: "string", description: "The thread to classify" },
        },
        required: ["thread_id"],
      },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "find_available_times",
      description: "Finds available time slots on the user's calendar within a date range. Use when scheduling meetings or timeboxing tasks. Respects buffer rules and no-meeting days.",
      parameters: {
        type: "object",
        properties: {
          date_from: { type: "string", description: "ISO date for start of search range" },
          date_to: { type: "string", description: "ISO date for end of search range" },
          duration_minutes: { type: "number", description: "Required duration in minutes (default 30)" },
          count: { type: "number", description: "Number of available slots to return (default 3)" },
        },
        required: ["date_from", "date_to"],
      },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "schedule_meeting",
      description: "Creates a pending AIVA action to schedule a meeting from an email thread. Proposes times based on calendar availability. Use when user asks to schedule a meeting or when an email contains a meeting request.",
      parameters: {
        type: "object",
        properties: {
          thread_id: { type: "string", description: "Source email thread ID" },
          title: { type: "string", description: "Meeting title" },
          duration_minutes: { type: "number", description: "Meeting duration in minutes" },
          attendee_emails: { type: "array", items: { type: "string" }, description: "Attendee email addresses" },
          preferred_date_from: { type: "string", description: "Start of preferred date range" },
          preferred_date_to: { type: "string", description: "End of preferred date range" },
          format: { type: "string", enum: ["call", "video", "in_person", "coffee"], description: "Meeting format" },
          location: { type: "string", description: "Meeting location (for in-person)" },
        },
        required: ["thread_id", "title", "attendee_emails"],
      },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "timebox_email_task",
      description: "Extracts a task from an email and creates a time-blocked calendar event. Use when an email contains an action item with a deadline.",
      parameters: {
        type: "object",
        properties: {
          thread_id: { type: "string", description: "Source email thread ID" },
          task_title: { type: "string", description: "The task to complete" },
          estimated_minutes: { type: "number", description: "Estimated time needed" },
          deadline: { type: "string", description: "ISO date of the deadline" },
        },
        required: ["thread_id", "task_title", "estimated_minutes"],
      },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "create_calendar_event",
      description: "Directly creates a calendar event for the user. Use when the user explicitly asks to add something to their calendar.",
      parameters: {
        type: "object",
        properties: {
          title: { type: "string", description: "Event title" },
          start_time: { type: "string", description: "ISO datetime for event start" },
          end_time: { type: "string", description: "ISO datetime for event end" },
          description: { type: "string", description: "Event description" },
          location: { type: "string", description: "Event location" },
          attendee_emails: { type: "array", items: { type: "string" }, description: "Attendee emails" },
          thread_id: { type: "string", description: "Related email thread ID" },
        },
        required: ["title", "start_time", "end_time"],
      },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "get_daily_briefing",
      description: "Generates today's daily briefing that cross-references the inbox with the calendar. Use when the user asks 'what does my day look like', 'briefing', or 'morning summary'.",
      parameters: {
        type: "object",
        properties: {},
      },
    },
  },
];

export async function executeToolCall(
  supabase: SupabaseClient,
  toolName: string,
  args: Record<string, unknown>
): Promise<string> {
  switch (toolName) {
    case "search_inbox":
      return searchInbox(supabase, args);
    case "get_thread_detail":
      return getThreadDetail(supabase, args);
    case "get_shopify_orders":
      return getShopifyOrders(supabase, args);
    case "get_contact_info":
      return getContactInfo(supabase, args);
    case "list_tasks":
      return listTasks(supabase, args);
    case "create_task":
      return createTaskTool(supabase, args);
    case "get_calendar_events":
      return getCalendarEventsTool(supabase, args);
    case "classify_email_intent":
      return classifyEmailIntentTool(supabase, args);
    case "find_available_times":
      return findAvailableTimesTool(supabase, args);
    case "schedule_meeting":
      return scheduleMeetingTool(supabase, args);
    case "timebox_email_task":
      return timeboxEmailTaskTool(supabase, args);
    case "create_calendar_event":
      return createCalendarEventTool(supabase, args);
    case "get_daily_briefing":
      return getDailyBriefingTool(supabase);
    default:
      return JSON.stringify({ error: `Unknown tool: ${toolName}` });
  }
}

async function searchInbox(supabase: SupabaseClient, args: Record<string, unknown>): Promise<string> {
  const limit = (args.limit as number) || 25;

  let query = supabase
    .from("threads")
    .select(`
      id, primary_subject, provider, last_message_at, message_count,
      is_unread, priority, snippet, has_draft, confidence_score,
      contacts:contact_id (full_name, email)
    `)
    .eq("is_archived", false)
    .order("last_message_at", { ascending: false })
    .limit(limit);

  if (args.channel && args.channel !== "ALL") {
    query = query.eq("provider", (args.channel as string).toLowerCase());
  }
  if (args.date_from) {
    query = query.gte("last_message_at", args.date_from as string);
  }
  if (args.date_to) {
    const endDate = new Date(args.date_to as string);
    endDate.setDate(endDate.getDate() + 1);
    query = query.lt("last_message_at", endDate.toISOString().split("T")[0]);
  }
  if (args.is_unread !== undefined) {
    query = query.eq("is_unread", args.is_unread as boolean);
  }
  if (args.priority) {
    query = query.eq("priority", args.priority as string);
  }

  const { data: threads, error } = await query;
  if (error) return JSON.stringify({ error: error.message });
  if (!threads || threads.length === 0) return JSON.stringify({ threads: [], count: 0, message: "No matching threads found." });

  let results = threads as Record<string, unknown>[];

  if (args.sender_name) {
    const name = (args.sender_name as string).toLowerCase();
    results = results.filter((t) => {
      const contact = t.contacts as Record<string, string> | null;
      return contact?.full_name?.toLowerCase().includes(name) || contact?.email?.toLowerCase().includes(name);
    });
  }
  if (args.sender_email) {
    const email = (args.sender_email as string).toLowerCase();
    results = results.filter((t) => {
      const contact = t.contacts as Record<string, string> | null;
      return contact?.email?.toLowerCase().includes(email);
    });
  }
  if (args.search_query) {
    const q = (args.search_query as string).toLowerCase();
    results = results.filter((t) =>
      (t.primary_subject as string)?.toLowerCase().includes(q) ||
      (t.snippet as string)?.toLowerCase().includes(q)
    );
  }

  const formatted = results.map((t) => {
    const contact = t.contacts as Record<string, string> | null;
    return {
      threadId: t.id,
      sender: contact?.full_name || contact?.email || "Unknown",
      senderEmail: contact?.email || "",
      subject: t.primary_subject || "(no subject)",
      snippet: (t.snippet as string)?.slice(0, 150) || "",
      timestamp: t.last_message_at,
      priority: t.priority || "medium",
      provider: ((t.provider as string) || "gmail").toLowerCase(),
      isUnread: t.is_unread ?? true,
      messageCount: t.message_count || 0,
      hasDraft: t.has_draft || false,
    };
  });

  return JSON.stringify({ threads: formatted, count: formatted.length });
}

async function getThreadDetail(supabase: SupabaseClient, args: Record<string, unknown>): Promise<string> {
  const threadId = args.thread_id as string;

  const { data: messages, error } = await supabase
    .from("messages")
    .select("id, sender_name, sender_email, subject, body, snippet, timestamp, priority, is_read")
    .eq("thread_id", threadId)
    .order("timestamp", { ascending: true });

  if (error) return JSON.stringify({ error: error.message });

  const formatted = (messages || []).map((m) => ({
    from: m.sender_name || m.sender_email,
    email: m.sender_email,
    subject: m.subject,
    body: ((m.body as string) || (m.snippet as string) || "").slice(0, 500),
    timestamp: m.timestamp,
    isRead: m.is_read,
  }));

  return JSON.stringify({ messages: formatted, count: formatted.length });
}

async function getShopifyOrders(supabase: SupabaseClient, args: Record<string, unknown>): Promise<string> {
  const limit = (args.limit as number) || 5;

  let query = supabase
    .from("shopify_orders")
    .select("id, order_name, customer_name, customer_email, financial_status, fulfillment_status, total_price, currency, tracking_number, tracking_url, created_at")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (args.customer_email) {
    query = query.eq("customer_email", args.customer_email as string);
  }
  if (args.order_number) {
    query = query.eq("order_name", args.order_number as string);
  }

  const { data, error } = await query;
  if (error) return JSON.stringify({ error: error.message });

  return JSON.stringify({ orders: data || [], count: (data || []).length });
}

async function getContactInfo(supabase: SupabaseClient, args: Record<string, unknown>): Promise<string> {
  let query = supabase.from("contacts").select("*");

  if (args.email) {
    query = query.eq("email", args.email as string);
  } else if (args.name) {
    query = query.ilike("full_name", `%${args.name}%`);
  }

  const { data, error } = await query.limit(5);
  if (error) return JSON.stringify({ error: error.message });

  return JSON.stringify({ contacts: data || [], count: (data || []).length });
}

async function listTasks(supabase: SupabaseClient, args: Record<string, unknown>): Promise<string> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return JSON.stringify({ error: "Not authenticated" });

  let query = supabase
    .from("tasks")
    .select("id, title, status, priority, due_date, tags, created_at, subtasks(id, title, is_completed)")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(25);

  if (args.status) query = query.eq("status", args.status as string);
  if (args.priority) query = query.eq("priority", args.priority as string);

  const { data, error } = await query;
  if (error) return JSON.stringify({ error: error.message });

  return JSON.stringify({ tasks: data || [], count: (data || []).length });
}

async function createTaskTool(supabase: SupabaseClient, args: Record<string, unknown>): Promise<string> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return JSON.stringify({ error: "Not authenticated" });

  const { data, error } = await supabase.from("tasks").insert({
    user_id: user.id,
    title: args.title as string,
    description: (args.description as string) || null,
    priority: (args.priority as string) || "medium",
    due_date: (args.due_date as string) || null,
  }).select().single();

  if (error) return JSON.stringify({ error: error.message });
  return JSON.stringify({ task: data, message: "Task created successfully" });
}

async function getCalendarEventsTool(supabase: SupabaseClient, args: Record<string, unknown>): Promise<string> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return JSON.stringify({ error: "Not authenticated" });

  const { data, error } = await supabase
    .from("calendar_events")
    .select("id, title, start_time, end_time, location, color, task_id, attendees, created_by, source_thread_id, conference_url")
    .eq("user_id", user.id)
    .gte("start_time", args.date_from as string)
    .lte("end_time", args.date_to as string)
    .order("start_time", { ascending: true })
    .limit(50);

  if (error) return JSON.stringify({ error: error.message });
  return JSON.stringify({ events: data || [], count: (data || []).length });
}

async function classifyEmailIntentTool(supabase: SupabaseClient, args: Record<string, unknown>): Promise<string> {
  const threadId = args.thread_id as string;

  const { data: messages } = await supabase
    .from("messages")
    .select("sender_name, sender_email, subject, body, snippet")
    .eq("thread_id", threadId)
    .order("timestamp", { ascending: false })
    .limit(3);

  if (!messages || messages.length === 0) return JSON.stringify({ error: "Thread not found or empty" });

  const latest = messages[0];
  const body = (latest.body as string) || (latest.snippet as string) || "";
  const subject = (latest.subject as string) || "";

  const classification = await classifyEmailIntent(subject, body, latest.sender_email || "");
  return JSON.stringify(classification);
}

async function findAvailableTimesTool(supabase: SupabaseClient, args: Record<string, unknown>): Promise<string> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return JSON.stringify({ error: "Not authenticated" });

  const rules = await getSchedulingRules(supabase, user.id);
  const duration = (args.duration_minutes as number) || rules.defaultMeetingDuration;
  const count = (args.count as number) || 3;

  const freeBusy = await getFreeBusySlots(
    supabase, user.id,
    args.date_from as string,
    args.date_to as string,
    rules
  );

  const available = findAvailableSlots(freeBusy, duration, count);

  return JSON.stringify({
    availableSlots: available,
    count: available.length,
    rules: {
      bufferMinutes: rules.bufferMinutes,
      workingHours: `${rules.workingHoursStart}-${rules.workingHoursEnd}`,
      noMeetingDays: rules.noMeetingDays,
    },
  });
}

async function scheduleMeetingTool(supabase: SupabaseClient, args: Record<string, unknown>): Promise<string> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return JSON.stringify({ error: "Not authenticated" });

  const rules = await getSchedulingRules(supabase, user.id);
  const duration = (args.duration_minutes as number) || rules.defaultMeetingDuration;
  const attendees = (args.attendee_emails as string[]) || [];

  const dateFrom = (args.preferred_date_from as string) || new Date().toISOString().split("T")[0];
  const dateTo = (args.preferred_date_to as string) || (() => {
    const d = new Date();
    d.setDate(d.getDate() + 7);
    return d.toISOString().split("T")[0];
  })();

  const freeBusy = await getFreeBusySlots(supabase, user.id, dateFrom, dateTo, rules);
  const available = findAvailableSlots(freeBusy, duration, 3);

  if (available.length === 0) {
    return JSON.stringify({
      success: false,
      message: "No available time slots found in the requested range. Try a wider date range.",
    });
  }

  const bestSlot = available[0];
  const action = await createPendingAction(supabase, user.id, {
    type: "create_calendar_event",
    summary: `Schedule "${args.title}" with ${attendees.join(", ")}`,
    details: {
      threadId: args.thread_id as string,
      calendarEvent: {
        title: args.title as string,
        startTime: bestSlot.start,
        endTime: bestSlot.end,
        attendees,
        conferenceUrl: rules.defaultVideoLink || undefined,
        location: args.location as string || undefined,
      },
    },
    sourceThreadId: args.thread_id as string,
    auditReason: `Meeting scheduled from email thread via Nexus engine`,
    executedAt: undefined,
  });

  return JSON.stringify({
    success: true,
    pendingActionId: action.id,
    proposedSlots: available.map((s) => ({
      start: s.start,
      end: s.end,
      formatted: `${new Date(s.start).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })} at ${new Date(s.start).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}`,
    })),
    selectedSlot: {
      start: bestSlot.start,
      end: bestSlot.end,
      formatted: `${new Date(bestSlot.start).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })} at ${new Date(bestSlot.start).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}`,
    },
    message: `Meeting "${args.title}" queued. ${available.length} available slot(s) found. The event will be created when approved.`,
  });
}

async function timeboxEmailTaskTool(supabase: SupabaseClient, args: Record<string, unknown>): Promise<string> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return JSON.stringify({ error: "Not authenticated" });

  const rules = await getSchedulingRules(supabase, user.id);
  const estimatedMinutes = (args.estimated_minutes as number) || 60;
  const deadline = (args.deadline as string) || (() => {
    const d = new Date();
    d.setDate(d.getDate() + 3);
    return d.toISOString().split("T")[0];
  })();

  const now = new Date();
  const freeBusy = await getFreeBusySlots(
    supabase, user.id,
    now.toISOString().split("T")[0],
    deadline,
    rules
  );

  const available = findAvailableSlots(freeBusy, estimatedMinutes, 1);

  if (available.length === 0) {
    return JSON.stringify({
      success: false,
      message: `No ${estimatedMinutes}-minute block available before ${deadline}. Consider extending the deadline.`,
    });
  }

  const slot = available[0];
  const action = await createPendingAction(supabase, user.id, {
    type: "timebox_task",
    summary: `Time-block "${args.task_title}" (${estimatedMinutes}min) before ${deadline}`,
    details: {
      threadId: args.thread_id as string,
      task: {
        title: args.task_title as string,
        deadline,
        estimatedMinutes,
        sourceThreadId: args.thread_id as string,
      },
      calendarEvent: {
        title: `Focus: ${args.task_title}`,
        startTime: slot.start,
        endTime: slot.end,
      },
    },
    sourceThreadId: args.thread_id as string,
    auditReason: `Task extracted from email and time-blocked via Nexus engine`,
    executedAt: undefined,
  });

  return JSON.stringify({
    success: true,
    pendingActionId: action.id,
    task: args.task_title,
    scheduledBlock: {
      start: slot.start,
      end: slot.end,
      formatted: `${new Date(slot.start).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })} ${new Date(slot.start).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })} – ${new Date(slot.end).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}`,
    },
    message: `Task "${args.task_title}" queued with a ${estimatedMinutes}-min focus block. Will be created when approved.`,
  });
}

async function createCalendarEventTool(supabase: SupabaseClient, args: Record<string, unknown>): Promise<string> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return JSON.stringify({ error: "Not authenticated" });

  const { data, error } = await supabase
    .from("calendar_events")
    .insert({
      user_id: user.id,
      title: args.title as string,
      start_time: args.start_time as string,
      end_time: args.end_time as string,
      description: (args.description as string) || null,
      location: (args.location as string) || null,
      attendees: (args.attendee_emails as string[]) || [],
      created_by: "aiva",
      source_thread_id: (args.thread_id as string) || null,
    })
    .select()
    .single();

  if (error) return JSON.stringify({ error: error.message });

  await supabase.from("ai_action_logs").insert({
    user_id: user.id,
    action_type: "create_calendar_event",
    summary: `Created event "${args.title}"`,
    details: { eventId: data.id, ...args },
    sent_at: new Date().toISOString(),
  });

  return JSON.stringify({
    success: true,
    event: data,
    message: `Calendar event "${args.title}" created successfully.`,
  });
}

async function getDailyBriefingTool(supabase: SupabaseClient): Promise<string> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return JSON.stringify({ error: "Not authenticated" });

  const { generateDailyBriefing } = await import("./nexus-engine");
  const briefing = await generateDailyBriefing(supabase, user.id, "America/New_York");

  return JSON.stringify(briefing);
}
