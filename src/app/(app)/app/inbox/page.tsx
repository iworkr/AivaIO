"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Badge, DataRow, EmptyState } from "@/components/ui";
import { staggerContainer, staggerItem } from "@/lib/animations";
import {
  Mail, Hash, Phone, ShoppingBag, Sparkles, Archive,
  FileText, CheckCircle, Filter,
} from "lucide-react";
import type { Priority, MessageProvider } from "@/types";

interface MockMessage {
  id: string;
  provider: MessageProvider;
  sender: string;
  subject: string;
  priority: Priority;
  time: string;
  hasDraft: boolean;
  unread: boolean;
}

const mockMessages: MockMessage[] = [
  { id: "1", provider: "GMAIL", sender: "Sarah Chen", subject: "Q4 Revenue Report — need your sign-off by EOD", priority: "URGENT", time: "2m", hasDraft: true, unread: true },
  { id: "2", provider: "SLACK", sender: "James Wright", subject: "#eng — Updated the deployment docs, FYI", priority: "FYI", time: "1h", hasDraft: false, unread: true },
  { id: "3", provider: "SHOPIFY", sender: "Emily Torres", subject: "Where is my order? Order #1042 — Blue Widgets x2", priority: "HIGH", time: "3h", hasDraft: true, unread: true },
  { id: "4", provider: "GMAIL", sender: "Michael Park", subject: "Re: Meeting tomorrow at 3pm confirmed", priority: "NORMAL", time: "4h", hasDraft: false, unread: false },
  { id: "5", provider: "GMAIL", sender: "Lisa Johnson", subject: "Re: Partnership proposal Q1 2026 — next steps", priority: "HIGH", time: "5h", hasDraft: true, unread: false },
  { id: "6", provider: "SLACK", sender: "David Kim", subject: "#product — New feature deployed to staging env", priority: "FYI", time: "6h", hasDraft: false, unread: false },
  { id: "7", provider: "GMAIL", sender: "Anna Schmidt", subject: "Invoice #4892 — payment pending review", priority: "HIGH", time: "8h", hasDraft: false, unread: false },
  { id: "8", provider: "WHATSAPP", sender: "Carlos Martinez", subject: "Hey, are we still on for lunch Friday?", priority: "LOW", time: "12h", hasDraft: true, unread: false },
  { id: "9", provider: "GMAIL", sender: "Rachel Kim", subject: "Quarterly board meeting — agenda attached", priority: "NORMAL", time: "1d", hasDraft: false, unread: false },
  { id: "10", provider: "SHOPIFY", sender: "Tom Wilson", subject: "Return request for Order #1038", priority: "HIGH", time: "1d", hasDraft: true, unread: false },
];

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

export default function InboxPage() {
  const [activeFilter, setActiveFilter] = useState<string>("All");
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const filteredMessages = mockMessages.filter((msg) => {
    if (activeFilter === "Needs Review") return msg.hasDraft;
    if (activeFilter === "Urgent") return msg.priority === "URGENT" || msg.priority === "HIGH";
    return true;
  });

  return (
    <div className="h-screen flex flex-col">
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
          {filteredMessages.length} messages
        </span>
      </div>

      {/* Message list */}
      <motion.div
        variants={staggerContainer}
        initial="hidden"
        animate="visible"
        className="flex-1 overflow-y-auto"
      >
        {filteredMessages.length === 0 ? (
          <EmptyState
            icon={<CheckCircle size={32} />}
            title="Inbox Zero. All channels clear."
          />
        ) : (
          filteredMessages.map((msg) => {
            const badge = priorityBadge[msg.priority];
            return (
              <motion.div key={msg.id} variants={staggerItem}>
                <DataRow
                  active={selectedId === msg.id}
                  onClick={() => setSelectedId(msg.id)}
                  className="group"
                >
                  <span className="text-[var(--text-tertiary)] shrink-0 opacity-50 group-hover:opacity-100 transition-opacity">
                    {providerIcons[msg.provider]}
                  </span>
                  {badge && (
                    <Badge variant={badge.variant} size="sm" className="shrink-0">
                      {badge.label}
                    </Badge>
                  )}
                  <span className={`text-sm font-medium truncate w-28 shrink-0 ${
                    msg.unread ? "text-[var(--text-primary)]" : "text-[var(--text-secondary)]"
                  }`}>
                    {msg.sender}
                  </span>
                  <span className="text-sm text-[var(--text-secondary)] truncate flex-1">
                    {msg.subject}
                  </span>
                  {msg.hasDraft && (
                    <Sparkles size={14} className="text-[var(--aiva-blue)] shrink-0" />
                  )}
                  <span className="text-[10px] font-mono text-[var(--text-tertiary)] shrink-0 w-8 text-right">
                    {msg.time}
                  </span>
                  {/* Quick actions on hover */}
                  <div className="hidden group-hover:flex items-center gap-1 shrink-0">
                    <button className="h-6 w-6 rounded flex items-center justify-center text-[var(--text-tertiary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-hover)]">
                      <Archive size={12} />
                    </button>
                    <button className="h-6 w-6 rounded flex items-center justify-center text-[var(--text-tertiary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-hover)]">
                      <FileText size={12} />
                    </button>
                  </div>
                </DataRow>
              </motion.div>
            );
          })
        )}
      </motion.div>
    </div>
  );
}
