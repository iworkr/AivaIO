import { createClient } from "./client";
import type { Thread, NormalizedMessage, ToneProfile, IntegrationConnection } from "@/types";

const supabase = createClient();

export async function fetchThreads(filter?: string) {
  let query = supabase
    .from("threads")
    .select(`
      id, subject, provider, last_message_at, message_count, unread,
      priority, snippet, has_draft, confidence_score,
      contacts:contact_id (name, email)
    `)
    .order("last_message_at", { ascending: false })
    .limit(50);

  if (filter === "Needs Review") {
    query = query.eq("has_draft", true);
  } else if (filter === "Urgent") {
    query = query.in("priority", ["URGENT", "HIGH"]);
  }

  const { data, error } = await query;
  if (error) throw error;
  return (data || []).map(mapThread);
}

export async function fetchThread(threadId: string) {
  const { data, error } = await supabase
    .from("threads")
    .select(`
      id, subject, provider, last_message_at, priority, confidence_score,
      contacts:contact_id (name, email)
    `)
    .eq("id", threadId)
    .single();

  if (error) throw error;
  return data;
}

export async function fetchMessages(threadId: string) {
  const { data, error } = await supabase
    .from("messages")
    .select(`
      id, thread_id, provider, direction, sender_name, sender_email,
      subject, body_plain, body_html, created_at, priority,
      confidence_score, has_draft
    `)
    .eq("thread_id", threadId)
    .order("created_at", { ascending: true });

  if (error) throw error;
  return data || [];
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
    .select("id, provider, status, last_synced_at, account_label")
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
  return {
    id: row.id as string,
    subject: (row.subject as string) || "",
    provider: (row.provider as string || "GMAIL") as Thread["provider"],
    lastMessageAt: row.last_message_at as string,
    messageCount: (row.message_count as number) || 0,
    unread: (row.unread as boolean) || false,
    priority: (row.priority as string || "NORMAL") as Thread["priority"],
    participants: contact ? [{ name: contact.name, email: contact.email }] : [],
    snippet: (row.snippet as string) || "",
    hasDraft: (row.has_draft as boolean) || false,
    confidenceScore: row.confidence_score as number | undefined,
  };
}
