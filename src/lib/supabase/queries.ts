import { createClient } from "./client";
import type { Thread, ToneProfile } from "@/types";

const supabase = createClient();

const PRIORITY_MAP: Record<string, string> = {
  urgent: "URGENT",
  high: "HIGH",
  medium: "NORMAL",
  low: "LOW",
  noise: "FYI",
};

export async function fetchThreads(filter?: string) {
  let query = supabase
    .from("threads")
    .select(`
      id, primary_subject, provider, last_message_at, message_count,
      is_unread, priority, snippet, has_draft, confidence_score,
      participants, contact_id,
      contacts:contact_id (full_name, email)
    `)
    .eq("is_archived", false)
    .order("last_message_at", { ascending: false })
    .limit(50);

  if (filter === "Needs Review") {
    query = query.eq("has_draft", true);
  } else if (filter === "Urgent") {
    query = query.in("priority", ["urgent", "high"]);
  }

  const { data, error } = await query;
  if (error) throw error;
  return (data || []).map(mapThread);
}

export async function fetchThread(threadId: string) {
  const { data, error } = await supabase
    .from("threads")
    .select(`
      id, primary_subject, provider, last_message_at, priority,
      confidence_score, participants,
      contacts:contact_id (full_name, email)
    `)
    .eq("id", threadId)
    .single();

  if (error) throw error;

  return {
    ...data,
    subject: data.primary_subject,
    provider: (data.provider || "gmail").toUpperCase(),
  };
}

export async function fetchMessages(threadId: string) {
  const { data, error } = await supabase
    .from("messages")
    .select(`
      id, thread_id, sender_name, sender_email,
      subject, body, body_html, snippet, timestamp, priority,
      confidence_score, has_draft_reply, is_read, recipients
    `)
    .eq("thread_id", threadId)
    .order("timestamp", { ascending: true });

  if (error) throw error;
  return (data || []).map((msg) => ({
    ...msg,
    body_plain: msg.body,
    created_at: msg.timestamp,
    has_draft: msg.has_draft_reply,
    direction: "INBOUND" as const,
  }));
}

export async function fetchDraft(threadId: string) {
  const { data, error } = await supabase
    .from("message_drafts")
    .select("*")
    .eq("thread_id", threadId)
    .eq("status", "pending")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) throw error;
  return data;
}

export async function fetchContact(email: string) {
  const { data, error } = await supabase
    .from("contacts")
    .select("*")
    .eq("email", email)
    .maybeSingle();

  if (error) throw error;
  return data;
}

export async function fetchShopifyCustomer(email: string) {
  const { data, error } = await supabase
    .from("shopify_customers")
    .select("*")
    .eq("email", email)
    .maybeSingle();

  if (error) throw error;
  return data;
}

export async function fetchShopifyOrders(email: string) {
  const { data, error } = await supabase
    .from("shopify_orders")
    .select("*")
    .eq("customer_email", email)
    .order("created_at", { ascending: false })
    .limit(5);

  if (error) throw error;
  return data || [];
}

export async function fetchAuditLogs(page = 0, limit = 50) {
  const { data, error } = await supabase
    .from("ai_action_logs")
    .select("*")
    .order("sent_at", { ascending: false })
    .range(page * limit, (page + 1) * limit - 1);

  if (error) throw error;
  return data || [];
}

export async function fetchVoicePreferences(userId: string) {
  const { data, error } = await supabase
    .from("voice_preferences")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();

  if (error) throw error;
  return data;
}

export async function updateVoicePreferences(userId: string, profile: Partial<ToneProfile>) {
  const { error } = await supabase
    .from("voice_preferences")
    .upsert({ user_id: userId, tone_profile: profile, updated_at: new Date().toISOString() })
    .eq("user_id", userId);

  if (error) throw error;
}

export async function fetchWorkspaceSettings(workspaceId: string) {
  const { data, error } = await supabase
    .from("workspace_settings")
    .select("*")
    .eq("workspace_id", workspaceId)
    .maybeSingle();

  if (error) throw error;
  return data;
}

export async function updateWorkspaceSettings(workspaceId: string, settings: Record<string, unknown>) {
  const { error } = await supabase
    .from("workspace_settings")
    .upsert({ workspace_id: workspaceId, ...settings, updated_at: new Date().toISOString() });

  if (error) throw error;
}

export async function fetchChannelConnections(userId: string) {
  const { data, error } = await supabase
    .from("channel_connections")
    .select("id, provider, status, last_sync_at, provider_account_name")
    .eq("user_id", userId);

  if (error) throw error;
  return data || [];
}

export async function fetchUserProfile(userId: string) {
  const { data, error } = await supabase
    .from("user_profiles")
    .select("*")
    .eq("id", userId)
    .maybeSingle();

  if (error) throw error;
  return data;
}

export async function updateUserProfile(userId: string, updates: Record<string, unknown>) {
  const { error } = await supabase
    .from("user_profiles")
    .update(updates)
    .eq("id", userId);

  if (error) throw error;
}

export async function updateUserSettings(userId: string, settings: Record<string, unknown>) {
  const { error } = await supabase
    .from("user_settings")
    .upsert({ id: userId, ...settings }, { onConflict: "id" });

  if (error) throw error;
}

export function subscribeToMessages(workspaceId: string, callback: (payload: unknown) => void) {
  return supabase
    .channel("messages-realtime")
    .on(
      "postgres_changes",
      { event: "INSERT", schema: "public", table: "messages", filter: `workspace_id=eq.${workspaceId}` },
      callback
    )
    .subscribe();
}

function mapThread(row: Record<string, unknown>): Thread {
  const contact = row.contacts as Record<string, string> | null;
  const participants = row.participants as Array<{ name: string; email: string }> | null;

  const dbPriority = (row.priority as string) || "medium";
  const mappedPriority = PRIORITY_MAP[dbPriority] || "NORMAL";

  const participantList = contact
    ? [{ name: contact.full_name || contact.email, email: contact.email }]
    : participants && Array.isArray(participants) && participants.length > 0
      ? participants.map((p) => ({ name: p.name || p.email, email: p.email }))
      : [];

  return {
    id: row.id as string,
    subject: (row.primary_subject as string) || "",
    provider: ((row.provider as string) || "gmail").toUpperCase() as Thread["provider"],
    lastMessageAt: row.last_message_at as string,
    messageCount: (row.message_count as number) || 0,
    unread: (row.is_unread as boolean) ?? true,
    priority: mappedPriority as Thread["priority"],
    participants: participantList,
    snippet: (row.snippet as string) || "",
    hasDraft: (row.has_draft as boolean) || false,
    confidenceScore: row.confidence_score as number | undefined,
  };
}
