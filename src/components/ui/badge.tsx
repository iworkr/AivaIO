import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium transition-colors",
  {
    variants: {
      variant: {
        default:
          "bg-[var(--surface-hover)] text-[var(--text-secondary)] border border-[var(--border-subtle)]",
        urgent:
          "bg-[var(--status-error-bg)] text-[var(--status-error)]",
        high:
          "bg-[var(--status-warning-bg)] text-[var(--status-warning)]",
        success:
          "bg-[var(--status-success-bg)] text-[var(--status-success)]",
        blue:
          "bg-[var(--aiva-blue-glow)] text-[var(--aiva-blue)]",
        fyi:
          "bg-[var(--surface-hover)] text-[var(--text-tertiary)]",
        outline:
          "border border-[var(--border-subtle)] text-[var(--text-secondary)] bg-transparent",
      },
      size: {
        sm: "text-[10px] px-1.5 py-0 h-[18px] tracking-[0.06em] uppercase",
        md: "text-xs px-2 py-0.5",
        lg: "text-sm px-3 py-1",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "md",
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, size, ...props }: BadgeProps) {
  return (
    <span className={cn(badgeVariants({ variant, size }), className)} {...props} />
  );
}

export { Badge, badgeVariants };
