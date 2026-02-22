import { createClient } from "@/lib/supabase/server";

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
    .select("id, title, start_time, end_time, location, color, task_id")
    .eq("user_id", user.id)
    .gte("start_time", args.date_from as string)
    .lte("end_time", args.date_to as string)
    .order("start_time", { ascending: true })
    .limit(50);

  if (error) return JSON.stringify({ error: error.message });
  return JSON.stringify({ events: data || [], count: (data || []).length });
}
