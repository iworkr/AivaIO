"use client";

import { cn } from "@/lib/utils";

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}

function EmptyState({ icon, title, description, action, className }: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center py-16 px-8 text-center",
        className
      )}
    >
      {icon && (
        <div className="mb-4 text-[var(--text-tertiary)]">{icon}</div>
      )}
      <h3 className="text-sm font-medium text-[var(--text-primary)] mb-1">
        {title}
      </h3>
      {description && (
        <p className="text-sm text-[var(--text-tertiary)] max-w-sm mb-4">
          {description}
        </p>
      )}
      {action}
    </div>
  );
}

export { EmptyState };
