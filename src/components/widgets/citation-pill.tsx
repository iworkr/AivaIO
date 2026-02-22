"use client";

import { useState } from "react";
import * as Popover from "@radix-ui/react-popover";
import { Mail, Hash, Phone, ShoppingBag } from "lucide-react";

interface CitationPillProps {
  source: "gmail" | "slack" | "whatsapp" | "shopify";
  label: string;
  snippet: string;
  messageId?: string;
}

const sourceIcons = {
  gmail: Mail,
  slack: Hash,
  whatsapp: Phone,
  shopify: ShoppingBag,
};

export function CitationPill({ source, label, snippet }: CitationPillProps) {
  const [open, setOpen] = useState(false);
  const Icon = sourceIcons[source] || Mail;

  return (
    <Popover.Root open={open} onOpenChange={setOpen}>
      <Popover.Trigger asChild>
        <button
          className="inline-flex items-center gap-1 mx-0.5 px-1.5 py-0.5 rounded-full cursor-pointer
            bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.1)]
            text-[10px] text-[var(--text-tertiary)]
            hover:border-[rgba(255,255,255,0.4)] transition-colors duration-150"
          style={{ height: 18 }}
        >
          <Icon size={10} />
          <span>{label}</span>
        </button>
      </Popover.Trigger>

      <Popover.Portal>
        <Popover.Content
          className="w-80 rounded-lg border border-[var(--border-subtle)] bg-[var(--background-main)] p-3 shadow-xl z-50"
          sideOffset={5}
          align="start"
        >
          <div className="flex items-center gap-2 mb-2">
            <Icon size={12} className="text-[var(--text-tertiary)]" />
            <span className="text-[10px] font-mono text-[var(--text-tertiary)] uppercase tracking-wider">
              {source}
            </span>
          </div>
          <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
            {snippet}
          </p>
          <button className="mt-2 text-[10px] text-[var(--aiva-blue)] hover:underline">
            Open full message
          </button>
          <Popover.Arrow className="fill-[var(--border-subtle)]" />
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
}
