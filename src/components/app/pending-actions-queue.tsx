"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Calendar, Clock, Mail, RefreshCw, Check, X,
  Sparkles, ChevronDown, ChevronRight, ExternalLink,
} from "lucide-react";

interface PendingActionData {
  id: string;
  type: string;
  status: string;
  summary: string;
  details: {
    threadId?: string;
    draftText?: string;
    calendarEvent?: {
      title: string;
      startTime: string;
      endTime: string;
      attendees?: string[];
      location?: string;
    };
    task?: {
      title: string;
      deadline?: string;
      estimatedMinutes?: number;
    };
  };
  source_thread_id?: string;
  created_at: string;
  audit_reason: string;
}

interface PendingActionsQueueProps {
  collapsed?: boolean;
}

export function PendingActionsQueue({ collapsed = false }: PendingActionsQueueProps) {
  const [actions, setActions] = useState<PendingActionData[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [processingIds, setProcessingIds] = useState<Set<string>>(new Set());

  const fetchActions = useCallback(async () => {
    try {
      const res = await fetch("/api/ai/nexus/pending-actions");
      if (res.ok) {
        const data = await res.json();
        setActions(data);
      }
    } catch { /* silently fail */ }
    finally { setLoading(false); }
  }, []);

  useEffect(() => {
    fetchActions();
    const interval = setInterval(fetchActions, 15000);
    return () => clearInterval(interval);
  }, [fetchActions]);

  const handleDecision = async (actionId: string, decision: "approve" | "reject") => {
    setProcessingIds((prev) => new Set(prev).add(actionId));
    try {
      await fetch("/api/ai/nexus/pending-actions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ actionId, decision }),
      });
      setActions((prev) => prev.filter((a) => a.id !== actionId));
    } catch { /* silently fail */ }
    finally {
      setProcessingIds((prev) => {
        const next = new Set(prev);
        next.delete(actionId);
        return next;
      });
    }
  };

  const iconForType = (type: string) => {
    switch (type) {
      case "send_scheduling_email": return <Mail size={14} />;
      case "create_calendar_event": return <Calendar size={14} />;
      case "timebox_task": return <Clock size={14} />;
      case "reschedule": return <RefreshCw size={14} />;
      default: return <Sparkles size={14} />;
    }
  };

  if (collapsed && actions.length === 0) return null;

  return (
    <div className="border border-[var(--border-subtle)] rounded-xl bg-[var(--background-elevated)] overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--border-subtle)]">
        <div className="flex items-center gap-2">
          <Sparkles size={14} className="text-[var(--aiva-blue)]" />
          <h3 className="text-sm font-semibold text-[var(--text-primary)]">
            Pending AIVA Actions
          </h3>
          {actions.length > 0 && (
            <span className="bg-[var(--aiva-blue)] text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center">
              {actions.length}
            </span>
          )}
        </div>
        <button
          onClick={fetchActions}
          className="h-7 w-7 rounded-md flex items-center justify-center text-[var(--text-tertiary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-hover)] transition-colors"
        >
          <RefreshCw size={12} />
        </button>
      </div>

      <div className="max-h-[400px] overflow-y-auto">
        {loading ? (
          <div className="px-4 py-6 text-center">
            <div className="h-4 w-4 border-2 border-[var(--aiva-blue)] border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-xs text-[var(--text-tertiary)] mt-2">Loading…</p>
          </div>
        ) : actions.length === 0 ? (
          <div className="px-4 py-6 text-center">
            <p className="text-xs text-[var(--text-tertiary)]">No pending actions. AIVA is on standby.</p>
          </div>
        ) : (
          <AnimatePresence mode="popLayout">
            {actions.map((action) => {
              const isExpanded = expandedId === action.id;
              const isProcessing = processingIds.has(action.id);

              return (
                <motion.div
                  key={action.id}
                  layout
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="border-b border-[var(--border-subtle)] last:border-b-0"
                >
                  <button
                    onClick={() => setExpandedId(isExpanded ? null : action.id)}
                    className="w-full flex items-center gap-3 px-4 py-3 hover:bg-[var(--surface-hover)] transition-colors text-left"
                  >
                    <div className="h-8 w-8 rounded-lg bg-[var(--aiva-blue-glow)] flex items-center justify-center text-[var(--aiva-blue)] shrink-0">
                      {iconForType(action.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-[var(--text-primary)] font-medium truncate">
                        {action.summary}
                      </p>
                      <p className="text-[10px] text-[var(--text-tertiary)] font-mono mt-0.5">
                        {new Date(action.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      </p>
                    </div>
                    {isExpanded ? <ChevronDown size={14} className="text-[var(--text-tertiary)]" /> : <ChevronRight size={14} className="text-[var(--text-tertiary)]" />}
                  </button>

                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="px-4 pb-3 overflow-hidden"
                      >
                        {action.details.calendarEvent && (
                          <div className="mb-3 p-3 rounded-lg bg-[var(--surface-hover-subtle)] border border-[var(--border-subtle)]">
                            <p className="text-xs font-medium text-[var(--text-primary)]">
                              {action.details.calendarEvent.title}
                            </p>
                            <p className="text-[10px] text-[var(--text-secondary)] mt-1 font-mono">
                              {new Date(action.details.calendarEvent.startTime).toLocaleDateString("en-US", {
                                weekday: "short", month: "short", day: "numeric",
                              })}{" "}
                              {new Date(action.details.calendarEvent.startTime).toLocaleTimeString("en-US", {
                                hour: "numeric", minute: "2-digit",
                              })}
                              {" – "}
                              {new Date(action.details.calendarEvent.endTime).toLocaleTimeString("en-US", {
                                hour: "numeric", minute: "2-digit",
                              })}
                            </p>
                            {action.details.calendarEvent.attendees && action.details.calendarEvent.attendees.length > 0 && (
                              <p className="text-[10px] text-[var(--text-tertiary)] mt-1">
                                With: {action.details.calendarEvent.attendees.join(", ")}
                              </p>
                            )}
                          </div>
                        )}

                        {action.details.draftText && (
                          <div className="mb-3 p-3 rounded-lg bg-[var(--surface-hover-subtle)] border border-[var(--border-subtle)]">
                            <p className="text-[10px] font-semibold text-[var(--text-tertiary)] uppercase tracking-wider mb-1">Draft Reply</p>
                            <p className="text-xs text-[var(--text-secondary)] whitespace-pre-wrap leading-relaxed">
                              {action.details.draftText.slice(0, 300)}
                              {action.details.draftText.length > 300 && "…"}
                            </p>
                          </div>
                        )}

                        <div className="flex items-center gap-1.5 text-[10px] text-[var(--text-tertiary)] mb-3 font-mono">
                          <Sparkles size={10} className="text-[var(--aiva-blue)]" />
                          {action.audit_reason}
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleDecision(action.id, "approve")}
                            disabled={isProcessing}
                            className="flex-1 flex items-center justify-center gap-1.5 h-8 rounded-md text-xs font-medium bg-[var(--aiva-blue)] text-white hover:opacity-90 transition-opacity disabled:opacity-50"
                          >
                            <Check size={12} />
                            Approve
                          </button>
                          <button
                            onClick={() => handleDecision(action.id, "reject")}
                            disabled={isProcessing}
                            className="flex-1 flex items-center justify-center gap-1.5 h-8 rounded-md text-xs font-medium border border-[var(--border-hover)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:border-[var(--border-glow)] transition-colors disabled:opacity-50"
                          >
                            <X size={12} />
                            Reject
                          </button>
                          {action.source_thread_id && (
                            <a
                              href={`/app/inbox/${action.source_thread_id}`}
                              className="h-8 w-8 rounded-md flex items-center justify-center border border-[var(--border-hover)] text-[var(--text-tertiary)] hover:text-[var(--text-primary)] hover:border-[var(--border-glow)] transition-colors"
                              title="View source thread"
                            >
                              <ExternalLink size={12} />
                            </a>
                          )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              );
            })}
          </AnimatePresence>
        )}
      </div>
    </div>
  );
}
