"use client";

import { motion, useScroll, useTransform } from "framer-motion";
import { useRef } from "react";
import { linearFadeIn, viewportOnce } from "@/lib/animations";
import { Sparkles, MapPin, Package, Clock } from "lucide-react";

export function GenerativeUI() {
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start end", "end start"],
  });
  const y = useTransform(scrollYProgress, [0, 1], [40, -40]);

  return (
    <section ref={containerRef} className="py-32 px-6">
      <div className="max-w-6xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 lg:gap-24">
          {/* Sticky left text */}
          <motion.div
            variants={linearFadeIn}
            initial="hidden"
            whileInView="visible"
            viewport={viewportOnce}
            className="lg:sticky lg:top-32 lg:self-start"
          >
            <p className="text-sm font-medium text-[var(--aiva-blue)] mb-3 tracking-[0.06em] uppercase">
              Generative Interfaces
            </p>
            <h2 className="text-3xl sm:text-4xl font-bold text-[var(--text-primary)] tracking-[-0.03em] mb-6">
              Stop hallucinating.
              <br />
              Start executing.
            </h2>
            <p className="text-base text-[var(--text-secondary)] leading-relaxed mb-6">
              AIVA reads your connected apps and generates rich, interactive widgets
              to solve complex requests instantly. Not just text — real UI with real data.
            </p>
            <div className="space-y-3">
              {[
                { icon: Sparkles, text: "AI-generated widgets from live data" },
                { icon: MapPin, text: "Flight, hotel, and calendar context" },
                { icon: Package, text: "Shopify orders with tracking info" },
                { icon: Clock, text: "Proactive suggestions based on schedule" },
              ].map(({ icon: Icon, text }) => (
                <div key={text} className="flex items-center gap-3">
                  <Icon size={14} className="text-[var(--aiva-blue)] shrink-0" />
                  <span className="text-sm text-[var(--text-secondary)]">{text}</span>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Scrollable right widgets */}
          <motion.div style={{ y }} className="space-y-6">
            {/* Chat + Flight widget */}
            <motion.div
              variants={linearFadeIn}
              initial="hidden"
              whileInView="visible"
              viewport={viewportOnce}
              className="rounded-xl border border-[var(--border-subtle)] bg-[var(--background-elevated)] p-6"
            >
              <div className="flex items-center gap-2 mb-4">
                <div className="h-6 w-6 rounded-full bg-[var(--aiva-blue-glow)] flex items-center justify-center">
                  <Sparkles size={12} className="text-[var(--aiva-blue)]" />
                </div>
                <span className="text-xs font-medium text-[var(--text-primary)]">AIVA</span>
                <span className="text-[10px] font-mono text-[var(--text-tertiary)]">researching...</span>
              </div>

              <p className="text-sm text-[var(--text-secondary)] mb-4 leading-relaxed">
                You land at Harry Reid Airport at 4:15 PM.
                <span className="inline-flex items-center gap-1 mx-1 px-1.5 py-0.5 rounded-full bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.1)] text-[10px] text-[var(--text-tertiary)] cursor-pointer hover:border-[var(--border-glow)]">
                  G Oct 12
                </span>
                Check-in at the Bellagio is at 3:00 PM, so you&apos;ll have about an hour.
              </p>

              {/* Inline flight widget */}
              <div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--background-main)] p-4">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[10px] font-mono text-[var(--text-tertiary)]">DELTA DL404</span>
                  <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-[var(--status-success-bg)] text-[var(--status-success)]">
                    ON TIME
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="text-center">
                    <p className="text-3xl font-bold text-[var(--text-primary)] tracking-tight">JFK</p>
                    <p className="text-xs text-[var(--text-tertiary)]">2:00 PM</p>
                  </div>
                  <div className="flex-1 mx-6 flex items-center">
                    <div className="flex-1 border-t border-dashed border-[var(--text-tertiary)]" />
                    <span className="mx-3 text-lg text-[var(--text-tertiary)]">✈</span>
                    <div className="flex-1 border-t border-dashed border-[var(--text-tertiary)]" />
                  </div>
                  <div className="text-center">
                    <p className="text-3xl font-bold text-[var(--text-primary)] tracking-tight">LAS</p>
                    <p className="text-xs text-[var(--text-tertiary)]">4:15 PM</p>
                  </div>
                </div>
                <div className="flex gap-6 mt-4 pt-3 border-t border-[var(--border-subtle)]">
                  <span className="text-[10px] font-mono text-[var(--text-tertiary)]">Gate B12</span>
                  <span className="text-[10px] font-mono text-[var(--text-tertiary)]">Terminal 4</span>
                  <span className="text-[10px] font-mono text-[var(--text-tertiary)]">Seat 12A</span>
                </div>
              </div>
            </motion.div>

            {/* Chat + Shopify widget */}
            <motion.div
              variants={linearFadeIn}
              initial="hidden"
              whileInView="visible"
              viewport={viewportOnce}
              className="rounded-xl border border-[var(--border-subtle)] bg-[var(--background-elevated)] p-6"
            >
              <div className="flex items-center gap-2 mb-4">
                <div className="h-6 w-6 rounded-full bg-[var(--aiva-blue-glow)] flex items-center justify-center">
                  <Sparkles size={12} className="text-[var(--aiva-blue)]" />
                </div>
                <span className="text-xs font-medium text-[var(--text-primary)]">AIVA</span>
              </div>

              <p className="text-sm text-[var(--text-secondary)] mb-4 leading-relaxed">
                I found John&apos;s recent order. It was fulfilled yesterday and shipped via USPS.
                Here are the details:
              </p>

              {/* Inline shopify widget */}
              <div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--background-main)] p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Package size={14} className="text-[var(--text-tertiary)]" />
                    <span className="text-xs font-mono text-[var(--text-primary)]">Order #1001</span>
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
                  <div className="flex justify-between text-xs">
                    <span className="text-[var(--text-secondary)]">Red Widget x1</span>
                    <span className="font-mono text-[var(--text-primary)]">$150.00</span>
                  </div>
                </div>
                <div className="flex items-center justify-between pt-3 border-t border-[var(--border-subtle)]">
                  <div>
                    <p className="text-xs font-mono text-[var(--text-primary)]">$450.00 total</p>
                    <p className="text-[10px] text-[var(--text-tertiary)]">3 items &middot; LTV: $1,240</p>
                  </div>
                  <button className="text-[10px] font-medium text-[var(--aiva-blue)] bg-[var(--aiva-blue-glow)] px-3 py-1.5 rounded-md hover:bg-[rgba(59,130,246,0.2)] transition-colors">
                    Draft Refund
                  </button>
                </div>
              </div>

              {/* Action suggestion */}
              <div className="mt-3 rounded-lg border border-[var(--aiva-blue-border)] bg-transparent p-3 flex items-start gap-2">
                <Sparkles size={14} className="text-[var(--aiva-blue)] mt-0.5 shrink-0" />
                <div>
                  <p className="text-xs text-[var(--text-secondary)]">
                    John is a VIP customer ($1,240 LTV). Would you like me to include a 10% loyalty discount in the refund?
                  </p>
                  <div className="flex gap-2 mt-2">
                    <button className="text-[10px] font-medium text-white bg-[var(--aiva-blue)] px-3 py-1 rounded-md hover:opacity-90 transition-opacity">
                      Include Discount
                    </button>
                    <button className="text-[10px] font-medium text-[var(--text-tertiary)] hover:text-[var(--text-secondary)] transition-colors">
                      Skip
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
