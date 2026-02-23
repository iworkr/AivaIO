"use client";

import { useRouter } from "next/navigation";
import { Mail, Maximize2, PenLine } from "lucide-react";
import { getBrandIcon } from "@/components/icons/brand-icons";
import type { EmailSummaryWidgetData } from "@/types";

const priorityStyles: Record<string, string> = {
  urgent: "bg-[var(--status-error-bg)] text-[var(--status-error)]",
  high: "bg-[var(--status-warning-bg)] text-[var(--status-warning)]",
  medium: "",
  low: "",
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

  const BrandIcon = getBrandIcon(data.sender) || getBrandIcon(data.provider);

  return (
    <div className="w-full bg-[var(--background-elevated)] border border-[var(--border-default)] rounded-xl p-4 flex flex-col gap-3 transition-colors hover:border-[var(--border-glow)] group">
      {/* Header: Brand + Sender + Timestamp */}
      <div className="flex items-center justify-between w-full">
        <div className="flex items-center gap-2 min-w-0">
          {BrandIcon ? (
            <BrandIcon
              size={16}
              className="shrink-0 grayscale opacity-80 group-hover:grayscale-0 group-hover:opacity-100 transition-all duration-200"
            />
          ) : (
            <Mail size={16} className="shrink-0 text-[var(--text-tertiary)]" />
          )}
          <span className="text-sm font-medium text-[var(--text-primary)] truncate">
            {data.sender}
          </span>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {data.priority && data.priority !== "medium" && data.priority !== "low" && (
            <span className={`text-[10px] px-2 py-0.5 rounded font-mono ${priorityStyles[data.priority]}`}>
              {data.priority.toUpperCase()}
            </span>
          )}
          <span className="text-xs font-mono text-[var(--text-tertiary)]">
            {timeAgo(data.timestamp)}
          </span>
        </div>
      </div>

      {/* Body: Subject + Snippet */}
      <div>
        <p className="text-[15px] font-semibold text-[var(--text-primary)] leading-snug">
          {data.subject}
        </p>
        <p className="text-sm text-[var(--text-secondary)] leading-relaxed line-clamp-2 mt-1">
          {data.snippet}
        </p>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2 pt-3 mt-1 border-t border-[var(--border-subtle)]">
        <button
          onClick={() => router.push(`/app/inbox/${data.threadId}`)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-hover)] transition-colors"
        >
          <Maximize2 size={14} />
          Read Full
        </button>
        <button
          onClick={() => router.push(`/app/inbox/${data.threadId}`)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-hover)] transition-colors"
        >
          <PenLine size={14} />
          Draft Reply
        </button>
      </div>
    </div>
  );
}
