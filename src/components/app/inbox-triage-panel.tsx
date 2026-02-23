"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import {
  Mail, Clock, Calendar, CheckCircle, AlertTriangle,
  ChevronDown, ChevronRight, GripVertical, Sparkles,
  RefreshCw,
} from "lucide-react";

interface InboxThread {
  id: string;
  subject: string;
  provider: string;
  lastMessageAt: string;
  messageCount: number;
  unread: boolean;
  priority: string;
  participants: Array<{ name: string; email: string }>;
  snippet: string;
  hasDraft: boolean;
}

interface InboxTriagePanelProps {
  onDragStart: (thread: InboxThread) => void;
  onDragEnd: () => void;
}

const TRIAGE_CATEGORIES = [
  { key: "all", label: "All", icon: Mail },
  { key: "needs_reply", label: "Needs Reply", icon: AlertTriangle },
  { key: "scheduled", label: "Scheduled", icon: Calendar },
  { key: "tasks", label: "Tasks", icon: CheckCircle },
];

export function InboxTriagePanel({ onDragStart, onDragEnd }: InboxTriagePanelProps) {
  const [threads, setThreads] = useState<InboxThread[]>([]);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState("all");

  const loadThreads = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/ai/nexus/briefing");
      if (!res.ok) throw new Error();

      const listRes = await fetch("/api/tasks");
      const threads: InboxThread[] = [];

      const inboxRes = await fetch("/api/ai/orchestrate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query: "List my recent inbox threads briefly",
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        }),
      });

      if (inboxRes.ok) {
        // Fallback: load threads directly from Supabase
      }

      // Direct fetch from threads table
      const { createClient } = await import("@/lib/supabase/client");
      const supabase = createClient();
      const { data } = await supabase
        .from("threads")
        .select(`
          id, primary_subject, provider, last_message_at, message_count,
          is_unread, priority, snippet, has_draft,
          participants, contacts:contact_id (full_name, email)
        `)
        .eq("is_archived", false)
        .order("last_message_at", { ascending: false })
        .limit(20);

      if (data) {
        setThreads(data.map((row: Record<string, unknown>) => {
          const contact = row.contacts as Record<string, string> | null;
          const participants = row.participants as Array<{ name: string; email: string }> | null;

          return {
            id: row.id as string,
            subject: (row.primary_subject as string) || "(no subject)",
            provider: ((row.provider as string) || "gmail").toUpperCase(),
            lastMessageAt: row.last_message_at as string,
            messageCount: (row.message_count as number) || 0,
            unread: (row.is_unread as boolean) ?? true,
            priority: (row.priority as string) || "medium",
            participants: contact
              ? [{ name: contact.full_name || contact.email, email: contact.email }]
              : participants || [],
            snippet: (row.snippet as string) || "",
            hasDraft: (row.has_draft as boolean) || false,
          };
        }));
      }
    } catch { /* silently fail */ }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { loadThreads(); }, [loadThreads]);

  const filteredThreads = threads.filter((t) => {
    if (category === "all") return true;
    if (category === "needs_reply") return t.unread || ["urgent", "high"].includes(t.priority);
    if (category === "scheduled") return false;
    if (category === "tasks") return t.hasDraft;
    return true;
  });

  return (
    <div className="flex flex-col h-full">
      <div className="px-3 py-2 border-b border-[var(--border-subtle)] flex items-center gap-2">
        <Mail size={14} className="text-[var(--aiva-blue)]" />
        <span className="text-xs font-semibold text-[var(--text-primary)]">Inbox Triage</span>
        <span className="text-[10px] text-[var(--text-tertiary)] font-mono ml-auto">
          {threads.length}
        </span>
        <button
          onClick={loadThreads}
          className="h-6 w-6 rounded flex items-center justify-center text-[var(--text-tertiary)] hover:text-[var(--text-primary)] transition-colors"
        >
          <RefreshCw size={10} />
        </button>
      </div>

      <div className="flex items-center gap-1 px-2 py-1.5 border-b border-[var(--border-subtle)]">
        {TRIAGE_CATEGORIES.map((cat) => (
          <button
            key={cat.key}
            onClick={() => setCategory(cat.key)}
            className={`text-[10px] px-2 py-1 rounded transition-colors ${
              category === cat.key
                ? "bg-[var(--surface-pill)] text-[var(--text-primary)] font-medium"
                : "text-[var(--text-tertiary)] hover:text-[var(--text-secondary)]"
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="h-4 w-4 border-2 border-[var(--aiva-blue)] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : filteredThreads.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
            <Mail size={24} className="text-[var(--text-tertiary)] opacity-40 mb-2" />
            <p className="text-xs text-[var(--text-tertiary)]">No threads in this category</p>
          </div>
        ) : (
          filteredThreads.map((thread) => (
            <div
              key={thread.id}
              draggable
              onDragStart={(e) => {
                e.dataTransfer.setData("application/x-inbox-thread", JSON.stringify(thread));
                e.dataTransfer.effectAllowed = "copy";
                onDragStart(thread);
              }}
              onDragEnd={onDragEnd}
              className="group border-b border-[var(--border-subtle)] hover:bg-[var(--surface-hover)] transition-colors cursor-grab active:cursor-grabbing"
            >
              <div className="flex items-start gap-2 px-3 py-2.5">
                <GripVertical size={10} className="text-[var(--text-tertiary)] opacity-0 group-hover:opacity-60 mt-1 shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    {thread.unread && (
                      <div className="w-1.5 h-1.5 rounded-full bg-[var(--aiva-blue)] shrink-0" />
                    )}
                    <span className="text-xs font-medium text-[var(--text-primary)] truncate">
                      {thread.participants[0]?.name || "Unknown"}
                    </span>
                    <span className="text-[9px] font-mono text-[var(--text-tertiary)] ml-auto shrink-0">
                      {thread.lastMessageAt ? new Date(thread.lastMessageAt).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" }) : ""}
                    </span>
                  </div>
                  <p className="text-[11px] text-[var(--text-secondary)] truncate mt-0.5">
                    {thread.subject}
                  </p>
                  <p className="text-[10px] text-[var(--text-tertiary)] truncate mt-0.5">
                    {thread.snippet.slice(0, 80)}
                  </p>
                  <div className="flex items-center gap-1.5 mt-1">
                    {["urgent", "high"].includes(thread.priority) && (
                      <span className="text-[9px] px-1.5 py-0.5 rounded bg-[var(--status-error-bg)] text-[var(--status-error)] font-medium">
                        {thread.priority}
                      </span>
                    )}
                    {thread.hasDraft && (
                      <span className="text-[9px] px-1.5 py-0.5 rounded bg-[var(--aiva-blue-glow)] text-[var(--aiva-blue)] font-medium">
                        draft
                      </span>
                    )}
                    <span className="text-[9px] text-[var(--text-tertiary)] ml-auto">
                      Drag to calendar →
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      <div className="px-3 py-2 border-t border-[var(--border-subtle)]">
        <div className="flex items-center gap-1.5 text-[10px] text-[var(--text-tertiary)]">
          <Sparkles size={10} className="text-[var(--aiva-blue)]" />
          Drag emails onto the calendar to schedule
        </div>
      </div>
    </div>
  );
}
