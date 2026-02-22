"use client";

import { useRef } from "react";
import { motion } from "framer-motion";
import { linearFadeIn, viewportOnce } from "@/lib/animations";
import { Star } from "lucide-react";
import { Avatar } from "@/components/ui";

const testimonials = [
  {
    quote: "AIVA saves me 8 hours a week. It perfectly mimics my tone and handles my Shopify support automatically.",
    author: "Sarah Chen",
    title: "Founder, Lumina Commerce",
    initials: "SC",
  },
  {
    quote: "The generative UI widgets are a game-changer. My team actually trusts the auto-send now because of the Safety Vault.",
    author: "James Wright",
    title: "VP Engineering, Strata Labs",
    initials: "JW",
  },
  {
    quote: "Inbox zero every day. The priority engine catches things I would have missed. It's like having a chief of staff.",
    author: "Emily Torres",
    title: "CEO, Kinetic Brands",
    initials: "ET",
  },
  {
    quote: "We reduced our first-response time by 70%. The Shopify context injection means we never ask customers to repeat themselves.",
    author: "Michael Park",
    title: "Head of CX, Velvet Labs",
    initials: "MP",
  },
  {
    quote: "The tone calibration is eerily accurate. After two days it sounds exactly like me. My clients can't tell the difference.",
    author: "Lisa Johnson",
    title: "Managing Director, Apex Consulting",
    initials: "LJ",
  },
];

export function Testimonials() {
  const scrollRef = useRef<HTMLDivElement>(null);

  return (
    <section className="py-32 px-6">
      <motion.div
        variants={linearFadeIn}
        initial="hidden"
        whileInView="visible"
        viewport={viewportOnce}
        className="max-w-6xl mx-auto"
      >
        <div className="text-center mb-12">
          <h2 className="text-3xl sm:text-4xl font-bold text-[var(--text-primary)] tracking-[-0.03em] mb-4">
            Trusted by modern teams.
          </h2>
          <p className="text-base text-[var(--text-secondary)]">
            Operators, founders, and support teams trust AIVA with their most critical communication.
          </p>
        </div>

        {/* Draggable carousel */}
        <div className="relative">
          <motion.div
            ref={scrollRef}
            className="flex gap-4 overflow-x-auto pb-4 cursor-grab active:cursor-grabbing scrollbar-hide"
            style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
          >
            {testimonials.map((t, i) => (
              <motion.div
                key={i}
                className="min-w-[320px] sm:min-w-[380px] rounded-xl border border-[var(--border-subtle)] bg-[var(--background-main)] p-6 shrink-0"
                whileHover={{ y: -2 }}
                transition={{ duration: 0.15 }}
              >
                <div className="flex gap-0.5 mb-4">
                  {Array.from({ length: 5 }).map((_, j) => (
                    <Star
                      key={j}
                      size={12}
                      className="text-[var(--text-primary)] fill-[var(--text-primary)]"
                    />
                  ))}
                </div>
                <p className="text-sm text-[var(--text-secondary)] leading-relaxed mb-6">
                  &ldquo;{t.quote}&rdquo;
                </p>
                <div className="flex items-center gap-3">
                  <Avatar initials={t.initials} size="md" />
                  <div>
                    <p className="text-sm font-medium text-[var(--text-primary)]">{t.author}</p>
                    <p className="text-xs text-[var(--text-tertiary)]">{t.title}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </motion.div>
    </section>
  );
}
