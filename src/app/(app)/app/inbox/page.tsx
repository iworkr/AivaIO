"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { EmptyState, LottieAnimation } from "@/components/ui";
import { staggerContainer, staggerItem } from "@/lib/animations";
import { fetchThreads, subscribeToMessages } from "@/lib/supabase/queries";
import { useAuth } from "@/hooks/use-auth";
import {
  Mail, Hash, Phone, ShoppingBag, Sparkles,
  Archive, CheckCheck, RefreshCw,
} from "lucide-react";
import type { Priority, MessageProvider, Thread } from "@/types";

const providerIcons: Record<MessageProvider, React.ReactNode> = {
  GMAIL: <Mail size={14} />,
  SLACK: <Hash size={14} />,
  WHATSAPP: <Phone size={14} />,
  SHOPIFY: <ShoppingBag size={14} />,
};

const priorityAccent: Record<Priority, string | null> = {
  URGENT: "text-[var(--status-error)]",
  HIGH: "text-[var(--status-warning)]",
  NORMAL: null,
  LOW: null,
  FYI: null,
};

const filters = ["All", "Needs Review", "Urgent"] as const;

function formatTime(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return "now";
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d`;
  return date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

function SkeletonRows({ count = 8 }: { count?: number }) {
  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="skeleton-row">
          <div className="skeleton-block w-[14px] h-[14px] rounded shrink-0" />
          <div className="skeleton-block h-3 rounded shrink-0" style={{ width: `${100 + Math.random() * 60}px` }} />
          <div className="skeleton-block h-3 rounded flex-1" />
          <div className="skeleton-block w-8 h-3 rounded shrink-0" />
        </div>
      ))}
    </>
  );
}

export default function InboxPage() {
  const [activeFilter, setActiveFilter] = useState<string>("All");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [threads, setThreads] = useState<Thread[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const { user } = useAuth();
  const router = useRouter();
  const hasSynced = useRef(false);

  const triggerSync = useCallback(async () => {
    if (isSyncing) return;
    setIsSyncing(true);
    try {
      await fetch("/api/sync/gmail", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ maxResults: 25 }),
      });
    } catch { /* sync failed silently */ } finally {
      setIsSyncing(false);
    }
  }, [isSyncing]);

  const loadThreads = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await fetchThreads(activeFilter === "All" ? undefined : activeFilter);
      setThreads(data);
      return data;
    } catch {
      setThreads([]);
      return [];
    } finally {
      setIsLoading(false);
    }
  }, [activeFilter]);

  useEffect(() => {
    let cancelled = false;
    async function init() {
      const data = await loadThreads();
      if (!cancelled && data.length === 0 && !hasSynced.current) {
        hasSynced.current = true;
        await triggerSync();
        if (!cancelled) await loadThreads();
      }
    }
    init();
    return () => { cancelled = true; };
  }, [loadThreads, triggerSync]);

  useEffect(() => {
    if (!user) return;
    const workspaceId = (user.user_metadata as Record<string, string>)?.workspace_id;
    if (!workspaceId) return;
    const channel = subscribeToMessages(workspaceId, () => { loadThreads(); });
    return () => { channel.unsubscribe(); };
  }, [user, loadThreads]);

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
    if (threads[selectedIndex]) setSelectedId(threads[selectedIndex].id);
  }, [selectedIndex, threads]);

  const handleManualSync = async () => {
    await triggerSync();
    await loadThreads();
  };

  return (
    <div className="h-screen flex flex-col bg-[var(--background-main)]">
      {/* Header bar — 56px strict */}
      <div className="h-14 border-b border-[var(--border-subtle)] px-4 flex items-center gap-3 shrink-0">
        <div className="flex gap-1">
          {filters.map((f) => (
            <button
              key={f}
              onClick={() => setActiveFilter(f)}
              className={`text-sm px-3 py-1 rounded-md transition-colors duration-150 ${
                activeFilter === f
                  ? "bg-[rgba(255,255,255,0.1)] text-[var(--text-primary)] font-medium"
                  : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
              }`}
            >
              {f}
            </button>
          ))}
        </div>
        <div className="flex-1" />
        <button
          onClick={handleManualSync}
          disabled={isSyncing}
          className="h-8 w-8 rounded-md flex items-center justify-center text-[var(--text-tertiary)] hover:text-[var(--text-secondary)] hover:bg-[var(--surface-hover)] transition-colors disabled:opacity-40"
          title="Sync emails"
        >
          <RefreshCw size={16} className={isSyncing ? "animate-spin" : ""} />
        </button>
        <span className="text-xs font-mono text-[var(--text-tertiary)]">
          {threads.length} messages
        </span>
      </div>

      {/* Cold-start sync */}
      {isSyncing && threads.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 gap-3">
          <LottieAnimation src="/lottie/scanner.json" loop autoplay style={{ width: 80, height: 80 }} />
          <p className="text-xs text-[var(--text-tertiary)]">Syncing your emails from Gmail…</p>
        </div>
      )}

      {/* Message list */}
      <div className="flex-1 overflow-y-auto">
        {isLoading && threads.length === 0 && !isSyncing ? (
          <SkeletonRows count={10} />
        ) : !isLoading && !isSyncing && threads.length === 0 ? (
          <EmptyState
            icon={<LottieAnimation src="/lottie/checkmark.json" autoplay style={{ width: 64, height: 64 }} />}
            title="Inbox Zero. All channels clear."
          />
        ) : (
          <motion.div variants={staggerContainer} initial="hidden" animate="visible">
            {threads.map((thread, index) => {
              const sender = thread.participants[0]?.name || "Unknown";
              const accent = priorityAccent[thread.priority];
              const isHovered = hoveredId === thread.id;
              const isSelected = selectedId === thread.id;

              return (
                <motion.div
                  key={thread.id}
                  variants={staggerItem}
                  onMouseEnter={() => setHoveredId(thread.id)}
                  onMouseLeave={() => setHoveredId(null)}
                  onClick={() => {
                    setSelectedId(thread.id);
                    setSelectedIndex(index);
                    router.push(`/app/inbox/${thread.id}`);
                  }}
                  tabIndex={0}
                  className={`inbox-row flex items-center w-full h-12 px-4 border-b border-[var(--border-subtle)] cursor-pointer transition-colors duration-150 ${
                    isSelected
                      ? "bg-[var(--surface-active)]"
                      : "hover:bg-[var(--surface-hover)]"
                  }`}
                >
                  {/* Col 1: Channel icon — 32px */}
                  <span className={`w-8 shrink-0 flex items-center justify-center transition-opacity duration-150 ${
                    isHovered ? "opacity-100" : "opacity-40"
                  } text-[var(--text-tertiary)]`}>
                    {providerIcons[thread.provider] || <Mail size={14} />}
                  </span>

                  {/* Col 2: Sender — 160px fixed */}
                  <span className={`w-40 shrink-0 text-sm truncate pr-4 ${
                    thread.unread
                      ? "text-[var(--text-primary)] font-medium"
                      : "text-[var(--text-secondary)]"
                  }`}>
                    {sender}
                  </span>

                  {/* Col 3: Subject / Snippet — flex-1 */}
                  <span className={`flex-1 text-sm truncate pr-4 ${
                    thread.unread
                      ? "text-[var(--text-primary)]"
                      : "text-[var(--text-secondary)]"
                  }`}>
                    {thread.subject}
                    {thread.snippet && thread.subject && (
                      <span className="text-[var(--text-tertiary)]"> — {thread.snippet}</span>
                    )}
                    {!thread.subject && thread.snippet}
                  </span>

                  {/* Col 4: Priority indicator (inline) */}
                  {accent && (
                    <span className={`text-[10px] font-mono uppercase tracking-wider mr-2 shrink-0 ${accent}`}>
                      {thread.priority}
                    </span>
                  )}

                  {/* Col 5: Draft sparkle */}
                  {thread.hasDraft && (
                    <Sparkles size={14} className="text-[var(--aiva-blue)] shrink-0 mr-2" />
                  )}

                  {/* Col 6: Timestamp / Quick actions — 64px */}
                  <div className="w-16 shrink-0 flex items-center justify-end">
                    {isHovered ? (
                      <div className="flex items-center gap-0.5">
                        <button
                          className="h-6 w-6 rounded flex items-center justify-center text-[var(--text-tertiary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-hover)]"
                          onClick={(e) => { e.stopPropagation(); }}
                          title="Archive"
                        >
                          <Archive size={13} />
                        </button>
                        <button
                          className="h-6 w-6 rounded flex items-center justify-center text-[var(--text-tertiary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-hover)]"
                          onClick={(e) => { e.stopPropagation(); }}
                          title="Mark read"
                        >
                          <CheckCheck size={13} />
                        </button>
                      </div>
                    ) : (
                      <span className="text-xs font-mono text-[var(--text-tertiary)] text-right">
                        {thread.lastMessageAt ? formatTime(thread.lastMessageAt) : ""}
                      </span>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </motion.div>
        )}
      </div>
    </div>
  );
}
