"use client";

import { useRouter } from "next/navigation";
import { Mail, Hash, ShoppingBag, ExternalLink, Pencil } from "lucide-react";
import type { EmailSummaryWidgetData } from "@/types";

const providerIcons = {
  gmail: Mail,
  slack: Hash,
  shopify: ShoppingBag,
};

const priorityStyles: Record<string, string> = {
  urgent: "bg-red-500/10 text-red-400",
  high: "bg-amber-500/10 text-amber-400",
  medium: "bg-zinc-500/10 text-zinc-400",
  low: "bg-zinc-500/10 text-zinc-500",
};

function timeAgo(ts: string): string {
  try {
    const diff = Date.now() - new Date(ts).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    return `${Math.floor(hrs / 24)}d ago`;
  } catch {
    return "";
  }
}

export function EmailSummaryTile({ data }: { data: EmailSummaryWidgetData["data"] }) {
  const router = useRouter();
  const Icon = providerIcons[data.provider] || Mail;

  return (
    <div className="w-full bg-[#0A0A0A] border border-[rgba(255,255,255,0.08)] rounded-xl p-4 hover:border-[rgba(255,255,255,0.15)] transition-colors group">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="h-6 w-6 rounded-full bg-[rgba(255,255,255,0.04)] flex items-center justify-center shrink-0">
            <Icon size={12} className="text-[var(--text-tertiary)]" />
          </div>
          <span className="text-sm font-medium text-[var(--text-primary)] truncate">
            {data.sender}
          </span>
          <span className="text-[11px] text-[var(--text-tertiary)] font-mono shrink-0">
            {timeAgo(data.timestamp)}
          </span>
        </div>
        {data.priority && data.priority !== "medium" && (
          <span className={`text-[10px] px-2 py-0.5 rounded font-mono shrink-0 ${priorityStyles[data.priority] || priorityStyles.medium}`}>
            {data.priority.toUpperCase()}
          </span>
        )}
      </div>

      {/* Body */}
      <div className="mt-2.5">
        <p className="text-sm font-medium text-[var(--text-primary)] leading-snug">
          {data.subject}
        </p>
        <p className="text-sm text-[var(--text-secondary)] leading-relaxed mt-1 line-clamp-2">
          {data.snippet}
        </p>
      </div>

      {/* Actions */}
      <div className="border-t border-[rgba(255,255,255,0.04)] mt-3 pt-3 flex gap-2">
        <button
          onClick={() => router.push(`/app/inbox/${data.threadId}`)}
          className="inline-flex items-center gap-1.5 text-[11px] text-[var(--text-tertiary)] hover:text-[var(--text-primary)] px-2.5 py-1.5 rounded-md border border-[rgba(255,255,255,0.06)] hover:border-[rgba(255,255,255,0.15)] hover:bg-[rgba(255,255,255,0.03)] transition-all"
        >
          <ExternalLink size={11} />
          Read Full
        </button>
        <button
          onClick={() => router.push(`/app/inbox/${data.threadId}`)}
          className="inline-flex items-center gap-1.5 text-[11px] text-[var(--text-tertiary)] hover:text-[var(--text-primary)] px-2.5 py-1.5 rounded-md border border-[rgba(255,255,255,0.06)] hover:border-[rgba(255,255,255,0.15)] hover:bg-[rgba(255,255,255,0.03)] transition-all"
        >
          <Pencil size={11} />
          Draft Reply
        </button>
      </div>
    </div>
  );
}
