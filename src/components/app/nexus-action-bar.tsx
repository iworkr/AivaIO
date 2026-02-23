"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Calendar, Clock, XCircle, Sparkles, Loader2,
  CheckCircle, AlertTriangle,
} from "lucide-react";
import type { NexusClassification } from "@/types";

interface NexusActionBarProps {
  threadId: string;
  onScheduleMeeting: (threadId: string) => void;
  onTimeboxTask: (threadId: string) => void;
  onDecline: (threadId: string) => void;
}

export function NexusActionBar({ threadId, onScheduleMeeting, onTimeboxTask, onDecline }: NexusActionBarProps) {
  const [classification, setClassification] = useState<NexusClassification | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionFeedback, setActionFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);

    fetch("/api/ai/nexus/classify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ threadId }),
    })
      .then((r) => r.json())
      .then((data) => {
        if (!cancelled) setClassification(data);
      })
      .catch(() => {
        if (!cancelled) setClassification(null);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => { cancelled = true; };
  }, [threadId]);

  const handleAction = useCallback((action: () => void, label: string) => {
    action();
    setActionFeedback({ type: "success", message: `${label} — queued for approval` });
    setTimeout(() => setActionFeedback(null), 3000);
  }, []);

  if (loading) {
    return (
      <div className="flex items-center gap-2 px-6 py-2 border-b border-[var(--border-subtle)] bg-[var(--surface-hover-subtle)]">
        <Loader2 size={14} className="animate-spin text-[var(--aiva-blue)]" />
        <span className="text-xs text-[var(--text-tertiary)]">AIVA analyzing thread…</span>
      </div>
    );
  }

  if (!classification || classification.confidence < 0.3) return null;

  const intentConfig: Record<string, { icon: React.ReactNode; label: string; color: string }> = {
    meeting_request: {
      icon: <Calendar size={12} />,
      label: "Meeting Request Detected",
      color: "text-[var(--aiva-blue)]",
    },
    task_action: {
      icon: <Clock size={12} />,
      label: "Action Item Detected",
      color: "text-[var(--status-warning)]",
    },
    scheduling_confirmation: {
      icon: <CheckCircle size={12} />,
      label: "Scheduling Confirmation",
      color: "text-[var(--status-success)]",
    },
    reschedule_request: {
      icon: <AlertTriangle size={12} />,
      label: "Reschedule Request",
      color: "text-[var(--status-warning)]",
    },
  };

  const config = intentConfig[classification.intent];
  if (!config) return null;

  return (
    <div className="relative">
      <motion.div
        initial={{ opacity: 0, y: -4 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center gap-3 px-6 py-2.5 border-b border-[var(--border-subtle)] bg-[var(--surface-hover-subtle)]"
      >
        <div className="flex items-center gap-2">
          <Sparkles size={12} className="text-[var(--aiva-blue)]" />
          <span className={`text-xs font-medium ${config.color}`}>
            {config.icon} {config.label}
          </span>
          <span className="text-[10px] text-[var(--text-tertiary)] font-mono">
            {Math.round(classification.confidence * 100)}%
          </span>
        </div>

        <div className="flex-1" />

        <div className="flex items-center gap-1.5">
          {(classification.intent === "meeting_request" || classification.intent === "reschedule_request") && (
            <button
              onClick={() => handleAction(() => onScheduleMeeting(threadId), "Auto-Schedule Meeting")}
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-medium bg-[var(--aiva-blue)] text-white hover:opacity-90 transition-opacity"
            >
              <Calendar size={12} />
              Auto-Schedule Meeting
            </button>
          )}

          {classification.intent === "task_action" && (
            <button
              onClick={() => handleAction(() => onTimeboxTask(threadId), "Block Time to Handle This")}
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-medium bg-[var(--aiva-blue)] text-white hover:opacity-90 transition-opacity"
            >
              <Clock size={12} />
              Block Time to Handle This
            </button>
          )}

          {classification.intent !== "scheduling_confirmation" && (
            <button
              onClick={() => handleAction(() => onDecline(threadId), "Decline Contextually")}
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-medium border border-[var(--border-hover)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:border-[var(--border-glow)] transition-colors"
            >
              <XCircle size={12} />
              Decline
            </button>
          )}

          {classification.suggestedActions?.map((action, i) => {
            if (["send_scheduling_email", "create_calendar_event", "timebox_task"].includes(action.type)) return null;
            return (
              <button
                key={i}
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-medium border border-[var(--border-hover)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:border-[var(--border-glow)] transition-colors"
              >
                {action.label}
              </button>
            );
          })}
        </div>
      </motion.div>

      <AnimatePresence>
        {actionFeedback && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="absolute top-full left-0 right-0 z-10 px-6 py-2 bg-[var(--status-success-bg)] text-[var(--status-success)] text-xs font-medium border-b border-[var(--status-success)]/20"
          >
            <CheckCircle size={12} className="inline mr-1.5" />
            {actionFeedback.message}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
