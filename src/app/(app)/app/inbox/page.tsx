"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Badge, DataRow, EmptyState, LoadingBar } from "@/components/ui";
import { staggerContainer, staggerItem } from "@/lib/animations";
import { fetchThreads, subscribeToMessages } from "@/lib/supabase/queries";
import { useAuth } from "@/hooks/use-auth";
import {
  Mail, Hash, Phone, ShoppingBag, Sparkles, Archive,
  FileText, CheckCircle,
} from "lucide-react";
import type { Priority, MessageProvider, Thread } from "@/types";

const providerIcons: Record<MessageProvider, React.ReactNode> = {
  GMAIL: <Mail size={14} />,
  SLACK: <Hash size={14} />,
  WHATSAPP: <Phone size={14} />,
  SHOPIFY: <ShoppingBag size={14} />,
};

const priorityBadge: Record<Priority, { variant: "urgent" | "high" | "fyi" | "default"; label: string } | null> = {
  URGENT: { variant: "urgent", label: "URGENT" },
  HIGH: { variant: "high", label: "HIGH" },
  NORMAL: null,
  LOW: null,
  FYI: { variant: "fyi", label: "FYI" },
};

const filters = ["All", "Needs Review", "Urgent"] as const;

function formatTime(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  return `${days}d`;
}

export default function InboxPage() {
  const [activeFilter, setActiveFilter] = useState<string>("All");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [threads, setThreads] = useState<Thread[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const { user } = useAuth();
  const router = useRouter();

  const loadThreads = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await fetchThreads(activeFilter === "All" ? undefined : activeFilter);
      setThreads(data);
    } catch {
      setThreads([]);
    } finally {
      setIsLoading(false);
    }
  }, [activeFilter]);

  useEffect(() => {
    loadThreads();
  }, [loadThreads]);

  useEffect(() => {
    if (!user) return;
    const workspaceId = (user.user_metadata as Record<string, string>)?.workspace_id;
    if (!workspaceId) return;

    const channel = subscribeToMessages(workspaceId, () => {
      loadThreads();
    });

    return () => { channel.unsubscribe(); };
  }, [user, loadThreads]);

  // Keyboard navigation
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

      if (e.key === "j" || e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedIndex((i) => Math.min(i + 1, threads.length - 1));
      } else if (e.key === "k" || e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedIndex((i) => Math.max(i - 1, 0));
      } else if (e.key === "Enter" && threads[selectedIndex]) {
        router.push(`/app/inbox/${threads[selectedIndex].id}`);
      } else if (e.key === "e" && threads[selectedIndex]) {
        setThreads((prev) => prev.filter((_, i) => i !== selectedIndex));
      }
    };

    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [threads, selectedIndex, router]);

  useEffect(() => {
    if (threads[selectedIndex]) {
      setSelectedId(threads[selectedIndex].id);
    }
  }, [selectedIndex, threads]);

  return (
    <div className="h-screen flex flex-col">
      {isLoading && <LoadingBar />}

      {/* Top bar */}
      <div className="h-12 border-b border-[var(--border-subtle)] px-4 flex items-center gap-3 shrink-0">
        <div className="flex gap-1.5">
          {filters.map((f) => (
            <button
              key={f}
              onClick={() => setActiveFilter(f)}
              className={`text-xs px-3 py-1 rounded-full transition-all duration-150 ${
                activeFilter === f
                  ? "bg-[var(--surface-active)] text-[var(--text-primary)] font-medium"
                  : "text-[var(--text-tertiary)] hover:text-[var(--text-secondary)]"
              }`}
            >
              {f}
            </button>
          ))}
        </div>
        <div className="flex-1" />
        <span className="text-xs text-[var(--text-tertiary)]">
          {threads.length} messages
        </span>
      </div>

      {/* Message list */}
      <div className={`flex-1 overflow-y-auto transition-opacity duration-300 ${isLoading ? "opacity-50" : ""}`}>
        {!isLoading && threads.length === 0 ? (
          <EmptyState
            icon={<CheckCircle size={32} />}
            title="Inbox Zero. All channels clear."
          />
        ) : (
          <motion.div variants={staggerContainer} initial="hidden" animate="visible">
            {threads.map((thread, index) => {
              const badge = priorityBadge[thread.priority];
              const sender = thread.participants[0]?.name || "Unknown";
              return (
                <motion.div key={thread.id} variants={staggerItem}>
                  <DataRow
                    active={selectedId === thread.id}
                    onClick={() => {
                      setSelectedId(thread.id);
                      setSelectedIndex(index);
                      router.push(`/app/inbox/${thread.id}`);
                    }}
                    className="group"
                  >
                    <span className="text-[var(--text-tertiary)] shrink-0 opacity-50 group-hover:opacity-100 transition-opacity">
                      {providerIcons[thread.provider] || <Mail size={14} />}
                    </span>
                    {badge && (
                      <Badge variant={badge.variant} size="sm" className="shrink-0">
                        {badge.label}
                      </Badge>
                    )}
                    <span className={`text-sm font-medium truncate w-28 shrink-0 ${
                      thread.unread ? "text-[var(--text-primary)]" : "text-[var(--text-secondary)]"
                    }`}>
                      {sender}
                    </span>
                    <span className="text-sm text-[var(--text-secondary)] truncate flex-1">
                      {thread.subject || thread.snippet}
                    </span>
                    {thread.hasDraft && (
                      <Sparkles size={14} className="text-[var(--aiva-blue)] shrink-0" />
                    )}
                    <span className="text-[10px] font-mono text-[var(--text-tertiary)] shrink-0 w-8 text-right">
                      {thread.lastMessageAt ? formatTime(thread.lastMessageAt) : ""}
                    </span>
                    <div className="hidden group-hover:flex items-center gap-1 shrink-0">
                      <button
                        className="h-6 w-6 rounded flex items-center justify-center text-[var(--text-tertiary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-hover)]"
                        onClick={(e) => { e.stopPropagation(); }}
                      >
                        <Archive size={12} />
                      </button>
                      <button
                        className="h-6 w-6 rounded flex items-center justify-center text-[var(--text-tertiary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-hover)]"
                        onClick={(e) => { e.stopPropagation(); }}
                      >
                        <FileText size={12} />
                      </button>
                    </div>
                  </DataRow>
                </motion.div>
              );
            })}
          </motion.div>
        )}
      </div>
    </div>
  );
}
