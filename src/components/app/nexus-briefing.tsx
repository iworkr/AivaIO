"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import {
  Calendar, Clock, AlertTriangle, Inbox,
  CheckCircle, ArrowRight, Sparkles, Users,
} from "lucide-react";
import type { DailyBriefing } from "@/types";

interface NexusBriefingProps {
  onAskAiva: (query: string) => void;
}

export function NexusBriefing({ onAskAiva }: NexusBriefingProps) {
  const [briefing, setBriefing] = useState<DailyBriefing | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/ai/nexus/briefing")
      .then((r) => r.ok ? r.json() : null)
      .then((data) => { if (data) setBriefing(data); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="bg-[var(--background-elevated)] border border-[var(--border-subtle)] rounded-xl p-4 animate-pulse">
            <div className="h-4 bg-[var(--surface-hover)] rounded w-1/2 mb-3" />
            <div className="h-8 bg-[var(--surface-hover)] rounded w-3/4 mb-2" />
            <div className="h-3 bg-[var(--surface-hover)] rounded w-full" />
          </div>
        ))}
      </div>
    );
  }

  if (!briefing) return null;

  const { calendarDensity, inboxSummary, meetingPreps, triageActions } = briefing;
  const capacityPercent = calendarDensity.totalHours > 0
    ? Math.round((calendarDensity.totalHours / 8) * 100)
    : 0;

  return (
    <div className="space-y-4">
      {/* Density + Inbox Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Calendar Density */}
        <motion.div
          whileHover={{ y: -2 }}
          className="bg-[var(--background-elevated)] border border-[var(--border-subtle)] rounded-xl p-4 hover:border-[var(--border-glow)] transition-colors cursor-default"
        >
          <div className="flex items-center gap-2 mb-3">
            <div className="h-6 w-6 rounded-full bg-[var(--aiva-blue-glow)] flex items-center justify-center">
              <Calendar size={12} className="text-[var(--aiva-blue)]" />
            </div>
            <span className="text-[10px] font-semibold tracking-wider uppercase text-[var(--text-tertiary)]">
              Today&apos;s Calendar
            </span>
          </div>
          <div className="flex items-end gap-2">
            <span className="text-2xl font-bold text-[var(--text-primary)] tabular-nums">
              {calendarDensity.totalMeetings}
            </span>
            <span className="text-xs text-[var(--text-tertiary)] mb-1">
              meeting{calendarDensity.totalMeetings !== 1 ? "s" : ""}
            </span>
          </div>
          <div className="mt-2 flex items-center gap-2">
            <div className="flex-1 h-1.5 bg-[var(--surface-hover)] rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${
                  capacityPercent > 80 ? "bg-[var(--status-error)]" : capacityPercent > 50 ? "bg-[var(--status-warning)]" : "bg-[var(--aiva-blue)]"
                }`}
                style={{ width: `${Math.min(100, capacityPercent)}%` }}
              />
            </div>
            <span className="text-[10px] font-mono text-[var(--text-tertiary)]">
              {calendarDensity.freeHours}h free
            </span>
          </div>
        </motion.div>

        {/* Inbox Summary */}
        <motion.div
          whileHover={{ y: -2 }}
          className="bg-[var(--background-elevated)] border border-[var(--border-subtle)] rounded-xl p-4 hover:border-[var(--border-glow)] transition-colors cursor-default"
        >
          <div className="flex items-center gap-2 mb-3">
            <div className="h-6 w-6 rounded-full bg-amber-500/10 flex items-center justify-center">
              <Inbox size={12} className="text-amber-400" />
            </div>
            <span className="text-[10px] font-semibold tracking-wider uppercase text-[var(--text-tertiary)]">
              Inbox
            </span>
          </div>
          <div className="flex items-end gap-2">
            <span className="text-2xl font-bold text-[var(--text-primary)] tabular-nums">
              {inboxSummary.unread}
            </span>
            <span className="text-xs text-[var(--text-tertiary)] mb-1">unread</span>
          </div>
          <div className="flex items-center gap-3 mt-2">
            {inboxSummary.urgent > 0 && (
              <span className="text-[10px] font-mono text-[var(--status-error)]">
                {inboxSummary.urgent} urgent
              </span>
            )}
            {inboxSummary.needsReply > 0 && (
              <span className="text-[10px] font-mono text-[var(--status-warning)]">
                {inboxSummary.needsReply} drafts
              </span>
            )}
          </div>
        </motion.div>

        {/* Focus Time */}
        <motion.div
          whileHover={{ y: -2 }}
          className="bg-[var(--background-elevated)] border border-[var(--border-subtle)] rounded-xl p-4 hover:border-[var(--border-glow)] transition-colors cursor-default"
        >
          <div className="flex items-center gap-2 mb-3">
            <div className="h-6 w-6 rounded-full bg-[var(--status-success-bg)] flex items-center justify-center">
              <Clock size={12} className="text-[var(--status-success)]" />
            </div>
            <span className="text-[10px] font-semibold tracking-wider uppercase text-[var(--text-tertiary)]">
              Focus Available
            </span>
          </div>
          <div className="flex items-end gap-2">
            <span className="text-2xl font-bold text-[var(--text-primary)] tabular-nums">
              {calendarDensity.freeHours}h
            </span>
            <span className="text-xs text-[var(--text-tertiary)] mb-1">open</span>
          </div>
          <button
            onClick={() => onAskAiva("Block focus time for my most important task today")}
            className="mt-2 text-[10px] text-[var(--aiva-blue)] hover:underline"
          >
            Auto-block focus time →
          </button>
        </motion.div>

        {/* AIVA Actions */}
        <motion.div
          whileHover={{ y: -2 }}
          className="bg-[var(--background-elevated)] border border-[var(--border-subtle)] rounded-xl p-4 hover:border-[var(--border-glow)] transition-colors cursor-default"
        >
          <div className="flex items-center gap-2 mb-3">
            <div className="h-6 w-6 rounded-full bg-[var(--aiva-blue-glow)] flex items-center justify-center">
              <Sparkles size={12} className="text-[var(--aiva-blue)]" />
            </div>
            <span className="text-[10px] font-semibold tracking-wider uppercase text-[var(--text-tertiary)]">
              AIVA Status
            </span>
          </div>
          <div className="flex items-end gap-2">
            <span className="text-2xl font-bold text-[var(--text-primary)] tabular-nums">
              {inboxSummary.autoHandled}
            </span>
            <span className="text-xs text-[var(--text-tertiary)] mb-1">auto-handled</span>
          </div>
          <p className="text-[10px] text-[var(--text-tertiary)] mt-1">
            Nexus Engine active
          </p>
        </motion.div>
      </div>

      {/* Meeting Preps */}
      {meetingPreps.length > 0 && (
        <div className="bg-[var(--background-elevated)] border border-[var(--border-subtle)] rounded-xl overflow-hidden">
          <div className="px-4 py-3 border-b border-[var(--border-subtle)]">
            <h3 className="text-xs font-semibold text-[var(--text-primary)] flex items-center gap-2">
              <Users size={12} className="text-[var(--aiva-blue)]" />
              Meeting Prep
            </h3>
          </div>
          <div className="divide-y divide-[var(--border-subtle)]">
            {meetingPreps.slice(0, 3).map((prep, i) => (
              <div key={i} className="px-4 py-3 flex items-center gap-3 hover:bg-[var(--surface-hover)] transition-colors">
                <div className="h-8 w-8 rounded-lg bg-[var(--aiva-blue-glow)] flex items-center justify-center text-[var(--aiva-blue)] shrink-0">
                  <Calendar size={14} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-[var(--text-primary)] truncate">
                    {prep.eventTitle}
                  </p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-[10px] font-mono text-[var(--text-tertiary)]">
                      {new Date(prep.startTime).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}
                    </span>
                    {prep.attendees.length > 0 && (
                      <span className="text-[10px] text-[var(--text-tertiary)]">
                        · {prep.attendees.length} attendee{prep.attendees.length !== 1 ? "s" : ""}
                      </span>
                    )}
                    {prep.relatedThreadIds.length > 0 && (
                      <span className="text-[10px] text-[var(--aiva-blue)]">
                        · {prep.relatedThreadIds.length} related email{prep.relatedThreadIds.length !== 1 ? "s" : ""}
                      </span>
                    )}
                  </div>
                </div>
                <span className="text-[10px] text-[var(--text-tertiary)]">{prep.contextSummary}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Urgent Triage */}
      {triageActions.length > 0 && (
        <div className="bg-[var(--background-elevated)] border border-[var(--border-subtle)] rounded-xl overflow-hidden">
          <div className="px-4 py-3 border-b border-[var(--border-subtle)]">
            <h3 className="text-xs font-semibold text-[var(--text-primary)] flex items-center gap-2">
              <AlertTriangle size={12} className="text-[var(--status-warning)]" />
              Needs Attention
            </h3>
          </div>
          <div className="divide-y divide-[var(--border-subtle)]">
            {triageActions.map((action, i) => (
              <Link
                key={i}
                href={`/app/inbox/${action.threadId}`}
                className="px-4 py-3 flex items-center gap-3 hover:bg-[var(--surface-hover)] transition-colors group"
              >
                <div className="h-8 w-8 rounded-lg bg-[var(--status-error-bg)] flex items-center justify-center text-[var(--status-error)] shrink-0">
                  <AlertTriangle size={14} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-[var(--text-secondary)] truncate">{action.reason}</p>
                </div>
                <ArrowRight size={14} className="text-[var(--text-tertiary)] group-hover:text-[var(--text-primary)] transition-colors" />
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
