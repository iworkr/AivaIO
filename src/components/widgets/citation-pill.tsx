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
          className="inline-flex items-center gap-1.5 ml-1 px-2 py-0.5 rounded-full cursor-pointer align-middle
            bg-[rgba(255,255,255,0.06)] border border-[rgba(255,255,255,0.04)]
            text-[11px] text-[var(--text-secondary)] font-mono
            hover:bg-[rgba(255,255,255,0.1)] transition-colors duration-150"
        >
          <Icon size={12} className="opacity-50" />
          <span>{label}</span>
        </button>
      </Popover.Trigger>

      <Popover.Portal>
        <Popover.Content
          className="w-80 rounded-xl border border-[rgba(255,255,255,0.08)] bg-[#0A0A0A] p-4 shadow-2xl z-50"
          sideOffset={6}
          align="start"
        >
          <div className="flex items-center gap-2 mb-2.5">
            <Icon size={13} className="text-[var(--text-tertiary)]" />
            <span className="text-[10px] font-mono text-[var(--text-tertiary)] uppercase tracking-wider">
              {source}
            </span>
          </div>
          <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
            {snippet}
          </p>
          <button className="mt-3 text-[11px] text-[var(--aiva-blue)] hover:underline font-medium">
            Open full message →
          </button>
          <Popover.Arrow className="fill-[#0A0A0A]" />
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
}
