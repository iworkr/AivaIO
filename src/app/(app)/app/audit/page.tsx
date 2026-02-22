"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Badge, DataRow, Button, LoadingBar } from "@/components/ui";
import { staggerContainer, staggerItem, slideInFromRight } from "@/lib/animations";
import { fetchAuditLogs } from "@/lib/supabase/queries";
import { useSupabaseQuery } from "@/hooks/use-supabase-query";
import {
  Mail, Hash, ShoppingBag, X, CheckCircle, XCircle,
  ChevronRight, ExternalLink, Phone,
} from "lucide-react";

const channelIcons: Record<string, React.ReactNode> = {
  GMAIL: <Mail size={14} />,
  SLACK: <Hash size={14} />,
  SHOPIFY: <ShoppingBag size={14} />,
  WHATSAPP: <Phone size={14} />,
};

export default function AuditPage() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [selectedEntry, setSelectedEntry] = useState<any | null>(null);
  const [page, setPage] = useState(0);

  const { data: logs, isLoading } = useSupabaseQuery(
    () => fetchAuditLogs(page, 50), [page]
  );

  return (
    <div className="h-screen flex flex-col">
      {isLoading && <LoadingBar />}

      <div className="h-12 border-b border-[var(--border-subtle)] px-4 flex items-center">
        <h1 className="text-sm font-medium text-[var(--text-primary)]">Audit Log</h1>
        <span className="text-xs text-[var(--text-tertiary)] ml-3">
          {(logs || []).length} actions
        </span>
        <div className="flex-1" />
        <div className="flex gap-2">
          <Button variant="ghost" size="sm" disabled={page === 0} onClick={() => setPage(page - 1)}>
            Previous
          </Button>
          <Button variant="ghost" size="sm" onClick={() => setPage(page + 1)} disabled={(logs || []).length < 50}>
            Next
          </Button>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        <div className={`flex-1 overflow-y-auto transition-opacity ${isLoading ? "opacity-50" : ""}`}>
          <div className="flex items-center h-8 px-4 gap-3 border-b border-[var(--border-subtle)] text-[10px] uppercase tracking-[0.06em] text-[var(--text-tertiary)] sticky top-0 bg-[var(--background-main)] z-10">
            <span className="w-3" />
            <span className="w-16">Time</span>
            <span className="w-4" />
            <span className="w-32">Recipient</span>
            <span className="flex-1">Action</span>
            <span className="w-16 text-right">Score</span>
          </div>

          {(!logs || logs.length === 0) && !isLoading ? (
            <div className="py-16 text-center text-sm text-[var(--text-tertiary)]">
              No audit entries yet. Actions will appear here as AIVA processes messages.
            </div>
          ) : (
            <motion.div variants={staggerContainer} initial="hidden" animate="visible">
              {(logs || []).map((entry) => {
                const isSent = entry.action === "AUTO_SEND";
                const time = entry.sent_at
                  ? new Date(entry.sent_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })
                  : "";
                return (
                  <motion.div key={entry.id} variants={staggerItem}>
                    <DataRow
                      onClick={() => setSelectedEntry(entry)}
                      active={selectedEntry?.id === entry.id}
                      className="cursor-pointer"
                    >
                      <div className={`w-2 h-2 rounded-full shrink-0 ${
                        isSent ? "bg-[var(--status-success)]" : "bg-[var(--status-warning)]"
                      }`} />
                      <span className="w-16 text-xs font-mono text-[var(--text-tertiary)]">{time}</span>
                      <span className="text-[var(--text-tertiary)] shrink-0">
                        {channelIcons[entry.channel] || <Mail size={14} />}
                      </span>
                      <span className="w-32 text-sm font-medium text-[var(--text-primary)] truncate">
                        {entry.recipient || "—"}
                      </span>
                      <span className="text-sm text-[var(--text-secondary)] truncate flex-1">
                        {entry.action?.replace(/_/g, " ")}
                      </span>
                      <span className={`w-16 text-right text-xs font-mono ${
                        !isSent ? "text-[var(--status-error)]" : "text-[var(--text-secondary)]"
                      }`}>
                        {!isSent ? "BLOCK" : entry.confidence_score ? Number(entry.confidence_score).toFixed(2) : "—"}
                      </span>
                      <ChevronRight size={12} className="text-[var(--text-tertiary)] shrink-0" />
                    </DataRow>
                  </motion.div>
                );
              })}
            </motion.div>
          )}
        </div>

        <AnimatePresence>
          {selectedEntry && (
            <motion.div
              variants={slideInFromRight}
              initial="hidden"
              animate="visible"
              exit="exit"
              className="w-[400px] border-l border-[var(--border-subtle)] bg-[var(--background-elevated)] overflow-y-auto shrink-0"
            >
              <div className="flex items-center justify-between p-4 border-b border-[var(--border-subtle)]">
                <h2 className="text-sm font-semibold text-[var(--text-primary)]">
                  Dispatch Report
                </h2>
                <button
                  onClick={() => setSelectedEntry(null)}
                  className="h-7 w-7 rounded-lg flex items-center justify-center text-[var(--text-tertiary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-hover)]"
                >
                  <X size={14} />
                </button>
              </div>

              <div className="p-4 border-b border-[var(--border-subtle)]">
                <Badge variant={selectedEntry.action === "AUTO_SEND" ? "success" : "urgent"} size="md">
                  {selectedEntry.action === "AUTO_SEND" ? "Dispatched" : "Blocked"}
                </Badge>
                {selectedEntry.risk_reason && (
                  <p className="text-xs text-[var(--status-error)] mt-2 font-mono">
                    {selectedEntry.risk_reason as string}
                  </p>
                )}
              </div>

              <div className="p-4 border-b border-[var(--border-subtle)]">
                <h3 className="text-[10px] font-medium uppercase tracking-[0.06em] text-[var(--text-tertiary)] mb-3">
                  Details
                </h3>
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between">
                    <span className="text-[var(--text-tertiary)]">Channel</span>
                    <span className="text-[var(--text-secondary)]">{selectedEntry.channel as string}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[var(--text-tertiary)]">Recipient</span>
                    <span className="text-[var(--text-secondary)]">{selectedEntry.recipient as string}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[var(--text-tertiary)]">Confidence</span>
                    <span className="text-[var(--text-secondary)] font-mono">
                      {selectedEntry.confidence_score ? Number(selectedEntry.confidence_score).toFixed(2) : "N/A"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[var(--text-tertiary)]">Time</span>
                    <span className="text-[var(--text-secondary)] font-mono">
                      {selectedEntry.sent_at ? new Date(selectedEntry.sent_at as string).toLocaleString() : "—"}
                    </span>
                  </div>
                </div>
              </div>

              {selectedEntry.dispatched_draft && (
                <div className="p-4 border-b border-[var(--border-subtle)]">
                  <h3 className="text-[10px] font-medium uppercase tracking-[0.06em] text-[var(--text-tertiary)] mb-3">
                    Dispatched Message
                  </h3>
                  <div className="rounded-lg bg-[var(--background-main)] border border-[var(--border-subtle)] p-3">
                    <p className="text-xs font-mono text-[var(--text-secondary)] leading-relaxed whitespace-pre-wrap">
                      {selectedEntry.dispatched_draft as string}
                    </p>
                  </div>
                </div>
              )}

              <div className="p-4">
                <Button variant="secondary" size="sm" className="w-full">
                  <ExternalLink size={14} /> Follow Up on This Thread
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
