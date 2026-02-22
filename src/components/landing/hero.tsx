"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Button, Badge } from "@/components/ui";
import { linearFadeIn, staggerContainer, staggerItem } from "@/lib/animations";
import { ArrowRight, Play } from "lucide-react";

export function Hero() {
  return (
    <section className="relative min-h-screen flex flex-col items-center justify-center px-6 pt-32 pb-16 overflow-hidden">
      {/* Blue glow radial gradient */}
      <div
        className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[600px] pointer-events-none"
        style={{
          background: "radial-gradient(ellipse at center top, var(--aiva-blue-glow) 0%, transparent 60%)",
        }}
      />

      <motion.div
        variants={staggerContainer}
        initial="hidden"
        animate="visible"
        className="relative z-10 max-w-4xl mx-auto text-center"
      >
        {/* Micro-badge */}
        <motion.div variants={staggerItem} className="mb-6">
          <Badge
            variant="outline"
            className="px-3 py-1 text-xs cursor-pointer hover:border-[var(--border-glow)] transition-colors duration-150"
          >
            Introducing AIVA 2.0 <ArrowRight size={12} className="ml-1 inline" />
          </Badge>
        </motion.div>

        {/* H1 */}
        <motion.h1
          variants={staggerItem}
          className="text-5xl sm:text-6xl lg:text-7xl font-bold text-[var(--text-primary)] tracking-[-0.04em] leading-[1.05] mb-6"
        >
          The AI executive assistant
          <br />
          <span className="text-[var(--text-secondary)]">for modern communication.</span>
        </motion.h1>

        {/* Subtext */}
        <motion.p
          variants={staggerItem}
          className="text-base sm:text-lg text-[var(--text-secondary)] max-w-2xl mx-auto mb-8 sm:mb-10 leading-relaxed px-2 sm:px-0"
        >
          Connect Gmail, Slack, and Shopify. AIVA prioritizes what matters, drafts
          replies in your tone, and auto-sends the routine — so nothing important
          slips through.
        </motion.p>

        {/* CTAs */}
        <motion.div variants={staggerItem} className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4">
          <Button variant="secondary" size="xl" className="group" asChild>
            <Link href="/auth/register">
              Start Free
              <ArrowRight size={16} className="transition-transform duration-150 group-hover:translate-x-0.5" />
            </Link>
          </Button>
          <Button variant="ghost" size="xl" className="text-[var(--text-secondary)]">
            <Play size={14} className="mr-1" />
            Watch 2-minute tour
          </Button>
        </motion.div>
      </motion.div>

      {/* Product shot mockup */}
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1], delay: 0.4 }}
        className="relative z-10 mt-16 w-full max-w-5xl mx-auto"
      >
        <div className="relative rounded-xl border border-[var(--border-subtle)] bg-[var(--background-elevated)] overflow-hidden shadow-2xl">
          {/* Mock app screenshot */}
          <div className="flex h-[400px] sm:h-[500px]">
            {/* Sidebar mock */}
            <div className="hidden sm:flex w-[200px] bg-[var(--background-sidebar)] border-r border-[var(--border-subtle)] flex-col p-4 gap-2">
              <div className="flex items-center gap-2 mb-4">
                <img src="/aiva-mark.svg" alt="" className="h-5 w-5" />
                <span className="text-xs font-medium text-[var(--text-primary)]">AIVA</span>
              </div>
              {["Inbox", "VIP", "Drafts", "Tasks"].map((item, i) => (
                <div
                  key={item}
                  className={`h-8 rounded-md px-3 flex items-center text-xs ${
                    i === 0
                      ? "bg-[var(--surface-hover)] text-[var(--text-primary)]"
                      : "text-[var(--text-secondary)]"
                  }`}
                >
                  {item}
                  {i === 0 && (
                    <span className="ml-auto text-[10px] bg-[var(--aiva-blue-glow)] text-[var(--aiva-blue)] px-1.5 rounded-full">
                      12
                    </span>
                  )}
                </div>
              ))}
              <div className="mt-4 pt-4 border-t border-[var(--border-subtle)]">
                <p className="text-[10px] uppercase tracking-[0.06em] text-[var(--text-tertiary)] mb-2">
                  Integrations
                </p>
                {["Gmail", "Slack", "Shopify"].map((item) => (
                  <div key={item} className="flex items-center gap-2 h-7 text-xs text-[var(--text-secondary)]">
                    <div className="w-1.5 h-1.5 rounded-full bg-[var(--status-success)]" />
                    {item}
                  </div>
                ))}
              </div>
            </div>

            {/* Inbox mock */}
            <div className="flex-1 flex flex-col">
              <div className="h-12 border-b border-[var(--border-subtle)] px-4 flex items-center gap-3">
                <div className="flex gap-1.5">
                  {["All", "Needs Review", "Urgent"].map((f, i) => (
                    <span
                      key={f}
                      className={`text-xs px-2.5 py-1 rounded-full ${
                        i === 0
                          ? "bg-[var(--surface-active)] text-[var(--text-primary)]"
                          : "text-[var(--text-tertiary)]"
                      }`}
                    >
                      {f}
                    </span>
                  ))}
                </div>
              </div>
              <div className="flex-1 overflow-hidden">
                {[
                  { name: "Sarah Chen", subj: "Q4 Revenue Report — need sign-off", badge: "URGENT", time: "2m", draft: true },
                  { name: "James Wright", subj: "Updated deployment docs, FYI", badge: "FYI", time: "1h", draft: false },
                  { name: "Emily Torres", subj: "Where is my order? #1042", badge: "HIGH", time: "3h", draft: true },
                  { name: "Michael Park", subj: "Meeting tomorrow at 3pm confirmed", badge: "", time: "4h", draft: false },
                  { name: "Lisa Johnson", subj: "Re: Partnership proposal Q1", badge: "", time: "5h", draft: true },
                  { name: "David Kim", subj: "Slack: New feature deployed to staging", badge: "FYI", time: "6h", draft: false },
                  { name: "Anna Schmidt", subj: "Invoice #4892 — payment pending", badge: "HIGH", time: "8h", draft: false },
                ].map((msg, i) => (
                  <div
                    key={i}
                    className={`flex items-center h-12 px-4 gap-3 border-b border-[var(--border-subtle)] ${
                      i === 0 ? "bg-[var(--surface-hover)]" : ""
                    }`}
                  >
                    <div className="w-4 h-4 rounded bg-[var(--surface-hover)]" />
                    {msg.badge && (
                      <span className={`text-[9px] uppercase tracking-wider px-1.5 py-0.5 rounded-full ${
                        msg.badge === "URGENT" ? "bg-[var(--status-error-bg)] text-[var(--status-error)]" :
                        msg.badge === "HIGH" ? "bg-[var(--status-warning-bg)] text-[var(--status-warning)]" :
                        "bg-[var(--surface-hover)] text-[var(--text-tertiary)]"
                      }`}>
                        {msg.badge}
                      </span>
                    )}
                    <span className="text-xs font-medium text-[var(--text-primary)] w-24 truncate">{msg.name}</span>
                    <span className="text-xs text-[var(--text-secondary)] truncate flex-1">{msg.subj}</span>
                    {msg.draft && <div className="w-1.5 h-1.5 rounded-full bg-[var(--aiva-blue)]" />}
                    <span className="text-[10px] font-mono text-[var(--text-tertiary)] shrink-0">{msg.time}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Bottom gradient mask */}
          <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-[var(--background-main)] to-transparent" />
        </div>
      </motion.div>
    </section>
  );
}
