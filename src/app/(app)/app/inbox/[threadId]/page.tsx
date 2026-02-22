"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Button, Badge, Avatar, ProgressBar, Card } from "@/components/ui";
import { linearFadeIn } from "@/lib/animations";
import {
  ArrowLeft, Send, X, Sparkles, Lock, Package, Mail,
  ExternalLink, Copy, ChevronDown,
} from "lucide-react";
import Link from "next/link";

const mockThread = {
  subject: "Where is my order? Order #1042",
  sender: { name: "Emily Torres", email: "emily@example.com", initials: "ET" },
  confidenceScore: 92,
  messages: [
    {
      id: "1",
      direction: "inbound" as "inbound" | "outbound",
      sender: "Emily Torres",
      text: "Hi, I placed an order for Blue Widgets (x2) last week and haven't received any shipping confirmation. Can you check on Order #1042 for me? Thanks!",
      time: "3 hours ago",
    },
  ],
  draft: "Hi Emily, thanks for reaching out! I checked on Order #1042 — it was fulfilled yesterday and shipped via USPS. Your tracking number is 1Z999AA10123456784. You should receive it within 2-3 business days. Let me know if you need anything else!",
};

export default function ConversationPage() {
  const [draftText, setDraftText] = useState(mockThread.draft);
  const [activeTone, setActiveTone] = useState("Professional");
  const [isEditing, setIsEditing] = useState(false);

  return (
    <div className="h-screen flex flex-col">
      {/* Header */}
      <div className="h-14 border-b border-[var(--border-subtle)] px-4 flex items-center gap-3 shrink-0">
        <Link
          href="/app/inbox"
          className="lg:hidden h-8 w-8 rounded-lg flex items-center justify-center text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-hover)]"
        >
          <ArrowLeft size={16} />
        </Link>
        <div className="flex-1 min-w-0">
          <h1 className="text-sm font-medium text-[var(--text-primary)] truncate">
            {mockThread.subject}
          </h1>
          <div className="flex items-center gap-2">
            <Badge variant="high" size="sm">HIGH</Badge>
            <span className="text-xs text-[var(--text-tertiary)]">via Shopify</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="blue" size="md" className="font-mono">
            Auto-Send Confidence: {mockThread.confidenceScore}%
          </Badge>
        </div>
      </div>

      {/* Split view: Thread + CRM panel */}
      <div className="flex-1 flex overflow-hidden">
        {/* Thread + Draft */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {mockThread.messages.map((msg) => (
              <motion.div
                key={msg.id}
                variants={linearFadeIn}
                initial="hidden"
                animate="visible"
                className={`max-w-lg ${msg.direction === "outbound" ? "ml-auto" : ""}`}
              >
                <div className="flex items-center gap-2 mb-1.5">
                  <Avatar initials={mockThread.sender.initials} size="sm" />
                  <span className="text-xs font-medium text-[var(--text-primary)]">{msg.sender}</span>
                  <span className="text-[10px] text-[var(--text-tertiary)]">{msg.time}</span>
                </div>
                <div className="rounded-lg border border-[var(--border-subtle)] bg-[var(--background-elevated)] p-4">
                  <p className="text-sm text-[var(--text-secondary)] leading-relaxed">{msg.text}</p>
                </div>
              </motion.div>
            ))}

            {/* Shopify Widget injection */}
            <motion.div
              variants={linearFadeIn}
              initial="hidden"
              animate="visible"
              className="max-w-lg"
            >
              <div className="flex items-center gap-2 mb-1.5">
                <div className="h-6 w-6 rounded-full bg-[var(--aiva-blue-glow)] flex items-center justify-center">
                  <Sparkles size={10} className="text-[var(--aiva-blue)]" />
                </div>
                <span className="text-xs font-medium text-[var(--text-primary)]">AIVA</span>
                <span className="text-[10px] text-[var(--text-tertiary)]">context resolved</span>
              </div>
              <div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--background-main)] p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Package size={14} className="text-[var(--text-tertiary)]" />
                    <span className="text-xs font-mono text-[var(--text-primary)]">Order #1042</span>
                  </div>
                  <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-[var(--status-success-bg)] text-[var(--status-success)]">
                    FULFILLED
                  </span>
                </div>
                <div className="space-y-1.5 mb-3">
                  <div className="flex justify-between text-xs">
                    <span className="text-[var(--text-secondary)]">Blue Widget x2</span>
                    <span className="font-mono text-[var(--text-primary)]">$300.00</span>
                  </div>
                </div>
                <div className="flex items-center justify-between pt-3 border-t border-[var(--border-subtle)]">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-mono text-[var(--text-tertiary)]">USPS 1Z999AA1...</span>
                  </div>
                  <button className="text-[10px] font-medium text-[var(--aiva-blue)] hover:underline flex items-center gap-1">
                    Insert Tracking into Draft
                    <ChevronDown size={10} />
                  </button>
                </div>
              </div>
            </motion.div>
          </div>

          {/* AI Draft Box */}
          <div className="border-t border-[var(--border-subtle)] bg-[var(--background-elevated)]">
            {/* Confidence bar */}
            <div className="px-4 pt-3">
              <ProgressBar value={mockThread.confidenceScore} />
              <p className="text-[10px] text-[var(--text-tertiary)] mt-1">
                Auto-Send Confidence: {mockThread.confidenceScore}% &middot; Safe to auto-send
              </p>
            </div>

            {/* Tone controls */}
            <div className="px-4 pt-3 flex gap-2">
              {["Friendly", "Professional", "Brief"].map((tone) => (
                <button
                  key={tone}
                  onClick={() => setActiveTone(tone)}
                  className={`text-[10px] font-medium px-2.5 py-1 rounded-md border transition-all duration-150 ${
                    activeTone === tone
                      ? "border-[var(--aiva-blue-border)] text-[var(--aiva-blue)] bg-[var(--aiva-blue-glow)]"
                      : "border-[var(--border-subtle)] text-[var(--text-tertiary)] hover:text-[var(--text-secondary)] hover:border-[var(--border-glow)]"
                  }`}
                >
                  {tone}
                </button>
              ))}
            </div>

            {/* Text area */}
            <div className="p-4">
              <textarea
                value={draftText}
                onChange={(e) => {
                  setDraftText(e.target.value);
                  setIsEditing(true);
                }}
                className="w-full min-h-[80px] bg-transparent text-sm text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] focus:outline-none resize-none leading-relaxed"
                placeholder="Write your reply..."
              />
            </div>

            {/* Action row */}
            <div className="px-4 pb-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="sm" onClick={() => setDraftText("")}>
                  <X size={14} />
                  Discard
                </Button>
              </div>
              <div className="flex items-center gap-2">
                <button className="h-8 w-8 rounded-lg flex items-center justify-center text-[var(--text-tertiary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-hover)]">
                  <Lock size={14} />
                </button>
                <Button variant="blue" size="md">
                  <Send size={14} />
                  Approve & Send
                  <kbd className="text-[9px] font-mono opacity-60 ml-1">⌘↵</kbd>
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* CRM Panel - Right sidebar */}
        <div className="hidden xl:flex w-[300px] border-l border-[var(--border-subtle)] bg-[var(--background-elevated)] flex-col overflow-y-auto">
          {/* Identity card */}
          <div className="p-4 border-b border-[var(--border-subtle)]">
            <div className="flex items-center gap-3 mb-3">
              <Avatar initials="ET" size="lg" />
              <div>
                <p className="text-sm font-medium text-[var(--text-primary)]">Emily Torres</p>
                <p className="text-xs text-[var(--text-tertiary)]">emily@example.com</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="font-mono text-[var(--status-warning)]">
                $450.00 LTV
              </Badge>
              <Badge variant="outline">Returning Customer</Badge>
            </div>
          </div>

          {/* Order history */}
          <div className="p-4">
            <h3 className="text-[10px] font-medium uppercase tracking-[0.06em] text-[var(--text-tertiary)] mb-3">
              Order History
            </h3>
            <div className="space-y-2">
              {[
                { id: "#1042", date: "Feb 20", status: "Fulfilled", amount: "$300.00" },
                { id: "#1038", date: "Feb 10", status: "Fulfilled", amount: "$150.00" },
              ].map((order) => (
                <div key={order.id} className="rounded-lg border border-[var(--border-subtle)] p-3">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-mono text-[var(--text-primary)]">{order.id}</span>
                    <div className="flex items-center gap-1.5">
                      <div className="w-1.5 h-1.5 rounded-full bg-[var(--status-success)]" />
                      <span className="text-[10px] text-[var(--text-tertiary)]">{order.status}</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-[var(--text-tertiary)]">{order.date}</span>
                    <span className="text-xs font-mono text-[var(--text-secondary)]">{order.amount}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Quick actions */}
          <div className="p-4 border-t border-[var(--border-subtle)] mt-auto">
            <Button variant="ghost" size="sm" className="w-full justify-start">
              <Copy size={14} /> Copy Tracking Link
            </Button>
            <Button variant="ghost" size="sm" className="w-full justify-start">
              <ExternalLink size={14} /> Open in Shopify
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
