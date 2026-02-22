"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Badge, DataRow, Button } from "@/components/ui";
import { staggerContainer, staggerItem, slideInFromRight } from "@/lib/animations";
import {
  Mail, Hash, ShoppingBag, X, CheckCircle, XCircle,
  ChevronRight, ExternalLink,
} from "lucide-react";

interface AuditEntry {
  id: string;
  status: "sent" | "blocked";
  time: string;
  channel: "GMAIL" | "SLACK" | "SHOPIFY";
  recipient: string;
  action: string;
  confidence: number;
  riskReason?: string;
  gateResults?: { gate: string; passed: boolean; detail?: string }[];
  dispatchedDraft?: string;
}

const mockAuditLog: AuditEntry[] = [
  {
    id: "A8B2",
    status: "sent",
    time: "14:02:45",
    channel: "GMAIL",
    recipient: "michael@partner.com",
    action: "Confirmed Meeting",
    confidence: 0.94,
    gateResults: Array.from({ length: 10 }, (_, i) => ({
      gate: `Gate ${i + 1}`,
      passed: true,
      detail: ["Feature Flag", "Confidence", "Supervisor", "First Touch", "Complexity", "Forbidden Topics", "Scheduling", "No Promises", "Time Window", "Attachments"][i],
    })),
    dispatchedDraft: "Hi Michael, confirmed for 3 PM tomorrow. Looking forward to it. — John",
  },
  {
    id: "A8B3",
    status: "blocked",
    time: "13:48:12",
    channel: "SHOPIFY",
    recipient: "emily@example.com",
    action: "Order Status Reply",
    confidence: 0.68,
    riskReason: "Confidence threshold not met (68%)",
    gateResults: [
      { gate: "Gate 1", passed: true, detail: "Feature Flag" },
      { gate: "Gate 2", passed: false, detail: "Confidence: 0.68 < 0.85" },
      ...Array.from({ length: 8 }, (_, i) => ({
        gate: `Gate ${i + 3}`,
        passed: true,
        detail: ["Supervisor", "First Touch", "Complexity", "Forbidden Topics", "Scheduling", "No Promises", "Time Window", "Attachments"][i],
      })),
    ],
    dispatchedDraft: "Hi Emily, I checked on your order and it appears to be processing. I'll follow up with more details shortly.",
  },
  {
    id: "A8B4",
    status: "sent",
    time: "12:30:05",
    channel: "SLACK",
    recipient: "james",
    action: "Acknowledged Receipt",
    confidence: 0.97,
    gateResults: Array.from({ length: 10 }, (_, i) => ({
      gate: `Gate ${i + 1}`,
      passed: true,
    })),
    dispatchedDraft: "Got it, thanks for the update! 👍",
  },
  {
    id: "A8B5",
    status: "blocked",
    time: "11:15:33",
    channel: "GMAIL",
    recipient: "legal@vendor.com",
    action: "Contract Discussion",
    confidence: 0.45,
    riskReason: "Forbidden topic detected (Regex: 'contract')",
    gateResults: Array.from({ length: 10 }, (_, i) => ({
      gate: `Gate ${i + 1}`,
      passed: i !== 5,
      detail: i === 5 ? "Forbidden Topics: matched 'contract'" : undefined,
    })),
  },
  {
    id: "A8B6",
    status: "sent",
    time: "10:45:10",
    channel: "GMAIL",
    recipient: "sarah@lumina.com",
    action: "Follow-up Confirmation",
    confidence: 0.91,
    gateResults: Array.from({ length: 10 }, (_, i) => ({
      gate: `Gate ${i + 1}`,
      passed: true,
    })),
    dispatchedDraft: "Thanks Sarah, all looks good. I've signed off on the report.",
  },
];

const channelIcons = {
  GMAIL: <Mail size={14} />,
  SLACK: <Hash size={14} />,
  SHOPIFY: <ShoppingBag size={14} />,
};

export default function AuditPage() {
  const [selectedEntry, setSelectedEntry] = useState<AuditEntry | null>(null);

  return (
    <div className="h-screen flex flex-col">
      {/* Header */}
      <div className="h-12 border-b border-[var(--border-subtle)] px-4 flex items-center">
        <h1 className="text-sm font-medium text-[var(--text-primary)]">Audit Log</h1>
        <span className="text-xs text-[var(--text-tertiary)] ml-3">
          {mockAuditLog.length} actions today
        </span>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Audit feed */}
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          animate="visible"
          className="flex-1 overflow-y-auto"
        >
          {/* Column headers */}
          <div className="flex items-center h-8 px-4 gap-3 border-b border-[var(--border-subtle)] text-[10px] uppercase tracking-[0.06em] text-[var(--text-tertiary)] sticky top-0 bg-[var(--background-main)] z-10">
            <span className="w-3" />
            <span className="w-16">Time</span>
            <span className="w-4" />
            <span className="w-32">Recipient</span>
            <span className="flex-1">Action</span>
            <span className="w-16 text-right">Score</span>
          </div>

          {mockAuditLog.map((entry) => (
            <motion.div key={entry.id} variants={staggerItem}>
              <DataRow
                onClick={() => setSelectedEntry(entry)}
                active={selectedEntry?.id === entry.id}
                className="cursor-pointer"
              >
                <div className={`w-2 h-2 rounded-full shrink-0 ${
                  entry.status === "sent" ? "bg-[var(--status-success)]" : "bg-[var(--status-warning)]"
                }`} />
                <span className="w-16 text-xs font-mono text-[var(--text-tertiary)]">{entry.time}</span>
                <span className="text-[var(--text-tertiary)] shrink-0">{channelIcons[entry.channel]}</span>
                <span className="w-32 text-sm font-medium text-[var(--text-primary)] truncate">{entry.recipient}</span>
                <span className="text-sm text-[var(--text-secondary)] truncate flex-1">{entry.action}</span>
                <span className={`w-16 text-right text-xs font-mono ${
                  entry.status === "blocked" ? "text-[var(--status-error)]" : "text-[var(--text-secondary)]"
                }`}>
                  {entry.status === "blocked" ? "BLOCK" : entry.confidence.toFixed(2)}
                </span>
                <ChevronRight size={12} className="text-[var(--text-tertiary)] shrink-0" />
              </DataRow>
            </motion.div>
          ))}
        </motion.div>

        {/* Detail drawer */}
        <AnimatePresence>
          {selectedEntry && (
            <motion.div
              variants={slideInFromRight}
              initial="hidden"
              animate="visible"
              exit="exit"
              className="w-[400px] border-l border-[var(--border-subtle)] bg-[var(--background-elevated)] overflow-y-auto shrink-0"
            >
              {/* Drawer header */}
              <div className="flex items-center justify-between p-4 border-b border-[var(--border-subtle)]">
                <h2 className="text-sm font-semibold text-[var(--text-primary)]">
                  Dispatch Report #{selectedEntry.id}
                </h2>
                <button
                  onClick={() => setSelectedEntry(null)}
                  className="h-7 w-7 rounded-lg flex items-center justify-center text-[var(--text-tertiary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-hover)]"
                >
                  <X size={14} />
                </button>
              </div>

              {/* Status */}
              <div className="p-4 border-b border-[var(--border-subtle)]">
                <Badge
                  variant={selectedEntry.status === "sent" ? "success" : "urgent"}
                  size="md"
                >
                  {selectedEntry.status === "sent" ? "Dispatched" : "Blocked"}
                </Badge>
                {selectedEntry.riskReason && (
                  <p className="text-xs text-[var(--status-error)] mt-2 font-mono">
                    {selectedEntry.riskReason}
                  </p>
                )}
              </div>

              {/* 10-Gate checklist */}
              <div className="p-4 border-b border-[var(--border-subtle)]">
                <h3 className="text-[10px] font-medium uppercase tracking-[0.06em] text-[var(--text-tertiary)] mb-3">
                  Boolean Gate Sequence
                </h3>
                <div className="space-y-1.5">
                  {selectedEntry.gateResults?.map((gate, i) => (
                    <div
                      key={i}
                      className={`flex items-center gap-2 text-xs py-1 px-2 rounded ${
                        !gate.passed ? "bg-[var(--status-error-bg)]" : ""
                      }`}
                    >
                      {gate.passed ? (
                        <CheckCircle size={12} className="text-[var(--status-success)] shrink-0" />
                      ) : (
                        <XCircle size={12} className="text-[var(--status-error)] shrink-0" />
                      )}
                      <span className={gate.passed ? "text-[var(--text-secondary)]" : "text-[var(--status-error)]"}>
                        {gate.gate}
                        {gate.detail && (
                          <span className="text-[var(--text-tertiary)]"> — {gate.detail}</span>
                        )}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Dispatched message */}
              {selectedEntry.dispatchedDraft && (
                <div className="p-4 border-b border-[var(--border-subtle)]">
                  <h3 className="text-[10px] font-medium uppercase tracking-[0.06em] text-[var(--text-tertiary)] mb-3">
                    Dispatched Message
                  </h3>
                  <div className="rounded-lg bg-[var(--background-main)] border border-[var(--border-subtle)] p-3">
                    <p className="text-xs font-mono text-[var(--text-secondary)] leading-relaxed whitespace-pre-wrap">
                      {selectedEntry.dispatchedDraft}
                    </p>
                  </div>
                </div>
              )}

              {/* Action */}
              <div className="p-4">
                <Button variant="secondary" size="sm" className="w-full">
                  <ExternalLink size={14} />
                  Follow Up on This Thread
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
