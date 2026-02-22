"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { EmptyState, LottieAnimation } from "@/components/ui";
import { EmptyStateHook } from "@/components/app/empty-state-hook";
import { staggerContainer, staggerItem } from "@/lib/animations";
import { fetchThreads, subscribeToMessages } from "@/lib/supabase/queries";
import { useAuth } from "@/hooks/use-auth";
import { useIntegrations } from "@/hooks/use-integrations";
import { createClient } from "@/lib/supabase/client";
import { GmailIcon, SlackIcon, ShopifyIcon } from "@/components/icons/brand-icons";
import {
  Mail, Sparkles, Archive, Check, CheckCheck, RefreshCw, X,
} from "lucide-react";
import type { Priority, MessageProvider, Thread } from "@/types";

function InboxProviderIcon({ provider, isHovered }: { provider: MessageProvider; isHovered: boolean }) {
  const size = 16;
  const className = `shrink-0 transition-all duration-200 ${isHovered ? "grayscale-0 opacity-100" : "grayscale opacity-60"}`;
  switch (provider) {
    case "GMAIL":
      return <GmailIcon size={size} className={className} />;
    case "SLACK":
      return <SlackIcon size={size} className={className} />;
    case "SHOPIFY":
      return <ShopifyIcon size={size} className={className} />;
    default:
      return <Mail size={14} className={className} />;
  }
}

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
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [lastClickedIndex, setLastClickedIndex] = useState<number | null>(null);
  const [threads, setThreads] = useState<Thread[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [actionLoading, setActionLoading] = useState(false);
  const { user } = useAuth();
  const { hasAnyConnection } = useIntegrations();
  const router = useRouter();
  const hasSynced = useRef(false);

  const toggleSelect = useCallback((threadId: string, index: number, shiftKey: boolean) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (shiftKey && lastClickedIndex !== null) {
        const lo = Math.min(lastClickedIndex, index);
        const hi = Math.max(lastClickedIndex, index);
        for (let i = lo; i <= hi; i++) {
          const id = threads[i]?.id;
          if (id) next.add(id);
        }
      } else {
        if (next.has(threadId)) next.delete(threadId);
        else next.add(threadId);
      }
      return next;
    });
    setLastClickedIndex(index);
  }, [lastClickedIndex, threads]);

  const clearSelection = useCallback(() => setSelectedIds(new Set()), []);

  const handleBulkArchive = useCallback(async () => {
    if (selectedIds.size === 0) return;
    setActionLoading(true);
    try {
      const supabase = createClient();
      await supabase.from("threads").update({ is_archived: true }).in("id", Array.from(selectedIds));
      setSelectedIds(new Set());
      await loadThreads();
    } catch { /* ignore */ } finally {
      setActionLoading(false);
    }
  }, [selectedIds, loadThreads]);

  const handleBulkMarkRead = useCallback(async () => {
    if (selectedIds.size === 0) return;
    setActionLoading(true);
    try {
      const supabase = createClient();
      await supabase.from("threads").update({ is_unread: false }).in("id", Array.from(selectedIds));
      setSelectedIds(new Set());
      await loadThreads();
    } catch { /* ignore */ } finally {
      setActionLoading(false);
    }
  }, [selectedIds, loadThreads]);

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
        ) : !isLoading && !isSyncing && threads.length === 0 && !hasAnyConnection ? (
          <EmptyStateHook type="INBOX" />
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
              const isChecked = selectedIds.has(thread.id);
              const showCheckbox = isHovered || selectedIds.size > 0;

              return (
                <motion.div
                  key={thread.id}
                  variants={staggerItem}
                  onMouseEnter={() => setHoveredId(thread.id)}
                  onMouseLeave={() => setHoveredId(null)}
                  onClick={(e) => {
                    const target = e.target as HTMLElement;
                    if (target.closest("[data-inbox-checkbox]")) {
                      e.preventDefault();
                      e.stopPropagation();
                      toggleSelect(thread.id, index, e.shiftKey);
                      return;
                    }
                    setSelectedId(thread.id);
                    setSelectedIndex(index);
                    router.push(`/app/inbox/${thread.id}`);
                  }}
                  tabIndex={0}
                  className={`inbox-row flex items-center w-full h-12 px-4 border-b border-[var(--border-subtle)] cursor-pointer transition-colors duration-150 ${
                    isSelected
                      ? "bg-[var(--surface-active)]"
                      : "hover:bg-[var(--surface-hover)]"
                  } ${isChecked ? "bg-[rgba(59,130,246,0.06)]" : ""}`}
                >
                  {/* Col 0: Checkbox — 28px */}
                  <div
                    data-inbox-checkbox
                    className="w-7 shrink-0 flex items-center justify-center"
                  >
                    {showCheckbox ? (
                      <div
                        className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${
                          isChecked
                            ? "bg-[var(--aiva-blue)] border-[var(--aiva-blue)]"
                            : "border-[rgba(255,255,255,0.2)] hover:border-[rgba(255,255,255,0.4)]"
                        }`}
                      >
                        {isChecked && <Check size={12} className="text-white" strokeWidth={3} />}
                      </div>
                    ) : (
                      <span className="w-4" />
                    )}
                  </div>

                  {/* Col 1: Branded channel icon — 32px */}
                  <span className="w-8 shrink-0 flex items-center justify-center text-[var(--text-tertiary)]">
                    <InboxProviderIcon provider={thread.provider} isHovered={isHovered} />
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

      {/* Floating action island when emails are selected */}
      <AnimatePresence>
        {selectedIds.size > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 24 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 px-4 py-3 rounded-2xl bg-[#0A0A0A] border border-[rgba(255,255,255,0.12)] shadow-[0_8px_32px_rgba(0,0,0,0.5)] backdrop-blur-xl"
          >
            <span className="text-sm font-medium text-[var(--text-primary)] mr-2 min-w-[80px]">
              {selectedIds.size} selected
            </span>
            <button
              onClick={handleBulkMarkRead}
              disabled={actionLoading}
              className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[rgba(255,255,255,0.06)] transition-colors disabled:opacity-50"
            >
              <CheckCheck size={16} />
              Mark read
            </button>
            <button
              onClick={handleBulkArchive}
              disabled={actionLoading}
              className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[rgba(255,255,255,0.06)] transition-colors disabled:opacity-50"
            >
              <Archive size={16} />
              Archive
            </button>
            <div className="w-px h-6 bg-[rgba(255,255,255,0.08)]" />
            <button
              onClick={clearSelection}
              className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-[var(--text-tertiary)] hover:text-[var(--text-secondary)] hover:bg-[rgba(255,255,255,0.06)] transition-colors"
            >
              <X size={16} />
              Clear
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
