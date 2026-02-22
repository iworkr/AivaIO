"use client";

import { motion } from "framer-motion";
import { staggerContainer, staggerItem, viewportOnce } from "@/lib/animations";
import { BentoCard, LottieAnimation } from "@/components/ui";
import { Inbox, Zap, PenTool, LayoutGrid, ArrowDownUp, Sparkles, Package } from "lucide-react";

export function BentoGrid() {
  return (
    <section id="features" className="py-32 px-6">
      <motion.div
        variants={staggerContainer}
        initial="hidden"
        whileInView="visible"
        viewport={viewportOnce}
        className="max-w-6xl mx-auto"
      >
        <motion.div variants={staggerItem} className="text-center mb-16">
          <p className="text-sm font-medium text-[var(--aiva-blue)] mb-3 tracking-[0.06em] uppercase">
            A new species of productivity
          </p>
          <h2 className="text-3xl sm:text-4xl font-bold text-[var(--text-primary)] tracking-[-0.03em] mb-4">
            Purpose-built for modern teams.
          </h2>
          <p className="text-base text-[var(--text-secondary)] max-w-xl mx-auto">
            Move faster with AI that understands context, respects boundaries,
            and operates on your approval.
          </p>
        </motion.div>

        {/* Bento grid with 1px gap hairline effect */}
        <motion.div
          variants={staggerItem}
          className="grid grid-cols-1 md:grid-cols-3 gap-px bg-[var(--border-subtle)] rounded-xl overflow-hidden"
        >
          {/* Unified Inbox - spans 2 cols */}
          <BentoCard className="md:col-span-2 rounded-none p-8">
            <div className="flex items-start justify-between mb-6">
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <Inbox size={18} className="text-[var(--aiva-blue)]" />
                  <h3 className="text-lg font-semibold text-[var(--text-primary)] tracking-[-0.02em]">
                    Unified Inbox.
                  </h3>
                </div>
                <p className="text-sm text-[var(--text-secondary)] max-w-md leading-relaxed">
                  A command center for communication. Stop context-switching between
                  Gmail, Slack, and WhatsApp. Everything in one dense, keyboard-navigable list.
                </p>
              </div>
            </div>
            <LottieAnimation
              src="/lottie/inbox-merge.json"
              loop
              autoplay
              playOnView
              className="mb-4"
              style={{ width: 120, height: 80 }}
            />
            {/* Mock inbox preview */}
            <div className="rounded-lg border border-[var(--border-subtle)] overflow-hidden bg-[var(--background-main)]">
              {[
                { icon: "G", name: "Sarah Chen", text: "Q4 Revenue Report", tag: "URGENT" },
                { icon: "S", name: "James Wright", text: "#eng — Deployment complete", tag: "FYI" },
                { icon: "W", name: "Emily Torres", text: "Where is my order?", tag: "HIGH" },
              ].map((msg, i) => (
                <div key={i} className="flex items-center h-10 px-3 gap-2 border-b border-[var(--border-subtle)] last:border-b-0">
                  <span className="text-[9px] font-mono text-[var(--text-tertiary)] w-3">{msg.icon}</span>
                  <span className={`text-[9px] uppercase tracking-wider px-1 py-0.5 rounded ${
                    msg.tag === "URGENT" ? "bg-[var(--status-error-bg)] text-[var(--status-error)]" :
                    msg.tag === "HIGH" ? "bg-[var(--status-warning-bg)] text-[var(--status-warning)]" :
                    "bg-[var(--surface-hover)] text-[var(--text-tertiary)]"
                  }`}>{msg.tag}</span>
                  <span className="text-[11px] font-medium text-[var(--text-primary)] w-20 truncate">{msg.name}</span>
                  <span className="text-[11px] text-[var(--text-secondary)] truncate flex-1">{msg.text}</span>
                </div>
              ))}
            </div>
          </BentoCard>

          {/* AI Priority Engine */}
          <BentoCard className="rounded-none p-8">
            <div className="flex items-center gap-2 mb-3">
              <Zap size={18} className="text-[var(--aiva-blue)]" />
              <h3 className="text-lg font-semibold text-[var(--text-primary)] tracking-[-0.02em]">
                AI Priority Engine.
              </h3>
            </div>
            <p className="text-sm text-[var(--text-secondary)] mb-6 leading-relaxed">
              Know what matters instantly. Intent, urgency, and confidence scored.
            </p>
            <div className="space-y-2.5">
              {[
                { label: "Urgent", score: "98%", variant: "urgent" as const },
                { label: "Needs Reply", score: "87%", variant: "high" as const },
                { label: "FYI", score: "40%", variant: "fyi" as const },
              ].map((tag) => (
                <motion.div
                  key={tag.label}
                  className="flex items-center justify-between rounded-lg border border-[var(--border-subtle)] px-3 py-2"
                  whileHover={{ x: 2 }}
                  transition={{ duration: 0.15 }}
                >
                  <span className="text-sm text-[var(--text-primary)]">{tag.label}</span>
                  <span className="text-xs font-mono text-[var(--text-secondary)]">{tag.score}</span>
                </motion.div>
              ))}
            </div>
          </BentoCard>

          {/* Smart Drafts */}
          <BentoCard className="rounded-none p-8">
            <div className="flex items-center gap-2 mb-3">
              <PenTool size={18} className="text-[var(--aiva-blue)]" />
              <h3 className="text-lg font-semibold text-[var(--text-primary)] tracking-[-0.02em]">
                Smart Drafts.
              </h3>
            </div>
            <p className="text-sm text-[var(--text-secondary)] mb-6 leading-relaxed">
              Reply faster without sounding robotic. Tone matched to you.
            </p>
            <LottieAnimation
              src="/lottie/typing-cursor.json"
              loop
              autoplay
              playOnView
              className="mb-3"
              style={{ width: 48, height: 32 }}
            />
            <div className="rounded-lg border border-[var(--border-subtle)] bg-[var(--background-main)] p-3">
              <div className="flex gap-2 mb-3">
                {["Friendly", "Professional", "Brief"].map((tone) => (
                  <span
                    key={tone}
                    className={`text-[10px] px-2 py-0.5 rounded-md border transition-colors duration-150 cursor-pointer ${
                      tone === "Professional"
                        ? "border-[var(--aiva-blue-border)] text-[var(--aiva-blue)] bg-[var(--aiva-blue-glow)]"
                        : "border-[var(--border-subtle)] text-[var(--text-tertiary)] hover:text-[var(--text-secondary)]"
                    }`}
                  >
                    {tone}
                  </span>
                ))}
              </div>
              <p className="text-[11px] text-[var(--text-secondary)] leading-relaxed">
                Hi Sarah, thanks for sending this over. I&apos;ve reviewed the Q4 numbers and
                everything looks solid. Happy to sign off — let me know if you need
                anything else.
                <span className="inline-block w-[2px] h-3 bg-[var(--aiva-blue)] ml-0.5 animate-pulse" />
              </p>
            </div>
          </BentoCard>

          {/* Generative UI - spans 2 cols */}
          <BentoCard className="md:col-span-2 rounded-none p-8">
            <div className="flex items-center gap-2 mb-3">
              <LayoutGrid size={18} className="text-[var(--aiva-blue)]" />
              <h3 className="text-lg font-semibold text-[var(--text-primary)] tracking-[-0.02em]">
                Generative UI & Shopify Context.
              </h3>
            </div>
            <p className="text-sm text-[var(--text-secondary)] mb-6 max-w-lg leading-relaxed">
              Not just text. AIVA pulls live data from Shopify and your calendar to
              render beautiful, actionable widgets directly in your chat.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Flight card mock */}
              <div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--background-main)] p-4">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[10px] font-mono text-[var(--text-tertiary)]">DELTA DL404</span>
                  <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-[var(--status-success-bg)] text-[var(--status-success)]">
                    ON TIME
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-[var(--text-primary)] tracking-tight">JFK</p>
                    <p className="text-[10px] text-[var(--text-tertiary)]">2:00 PM</p>
                  </div>
                  <div className="flex-1 mx-4 flex items-center">
                    <div className="flex-1 border-t border-dashed border-[var(--text-tertiary)]" />
                    <span className="mx-2 text-[var(--text-tertiary)]">✈</span>
                    <div className="flex-1 border-t border-dashed border-[var(--text-tertiary)]" />
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-[var(--text-primary)] tracking-tight">LAS</p>
                    <p className="text-[10px] text-[var(--text-tertiary)]">4:15 PM</p>
                  </div>
                </div>
                <div className="flex gap-4 mt-3 pt-3 border-t border-[var(--border-subtle)]">
                  <span className="text-[10px] font-mono text-[var(--text-tertiary)]">Gate B12</span>
                  <span className="text-[10px] font-mono text-[var(--text-tertiary)]">Terminal 4</span>
                </div>
              </div>

              {/* Shopify order card mock */}
              <div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--background-main)] p-4">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[10px] font-mono text-[var(--text-tertiary)]">ORDER #1042</span>
                  <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-[var(--status-success-bg)] text-[var(--status-success)]">
                    FULFILLED
                  </span>
                </div>
                <div className="space-y-2 mb-3">
                  <div className="flex justify-between text-xs">
                    <span className="text-[var(--text-secondary)]">Blue Widget x2</span>
                    <span className="font-mono text-[var(--text-primary)]">$150.00</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-[var(--text-secondary)]">Red Widget x1</span>
                    <span className="font-mono text-[var(--text-primary)]">$300.00</span>
                  </div>
                </div>
                <div className="flex justify-between items-center pt-3 border-t border-[var(--border-subtle)]">
                  <span className="text-xs font-mono text-[var(--text-primary)]">$450.00</span>
                  <button className="text-[10px] text-[var(--aiva-blue)] hover:underline">
                    Insert Tracking
                  </button>
                </div>
              </div>
            </div>
          </BentoCard>
        </motion.div>
      </motion.div>
    </section>
  );
}
