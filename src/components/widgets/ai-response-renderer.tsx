"use client";

import { motion } from "framer-motion";
import { linearFadeIn } from "@/lib/animations";
import { FlightWidget } from "./flight-widget";
import { ShopifyWidget } from "./shopify-widget";
import { CalendarWidget } from "./calendar-widget";
import { ActionWidget } from "./action-widget";
import { CitationPill } from "./citation-pill";
import type { AIResponse, WidgetData } from "@/types";

function renderWidget(widget: WidgetData, index: number) {
  switch (widget.type) {
    case "FLIGHT_CARD":
      return <FlightWidget key={index} data={widget.data} />;
    case "SHOPIFY_CARD":
      return <ShopifyWidget key={index} data={widget.data} />;
    case "CALENDAR_CARD":
      return <CalendarWidget key={index} data={widget.data} />;
    case "ACTION_CARD":
      return <ActionWidget key={index} data={widget.data} />;
    default:
      return null;
  }
}

export function AIResponseRenderer({ response }: { response: AIResponse }) {
  return (
    <motion.div
      variants={linearFadeIn}
      initial="hidden"
      animate="visible"
      className="flex flex-col gap-4"
    >
      {response.textSummary && (
        <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
          {response.textSummary}
          {response.citations.map((cite) => (
            <CitationPill
              key={cite.id}
              source={cite.source}
              label={cite.source.charAt(0).toUpperCase() + " " + cite.id.slice(0, 6)}
              snippet={cite.snippet}
              messageId={cite.id}
            />
          ))}
        </p>
      )}

      {response.widgets.map((widget, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: i * 0.15, duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
        >
          {renderWidget(widget, i)}
        </motion.div>
      ))}
    </motion.div>
  );
}
