import * as React from "react";
import { cn } from "@/lib/utils";

interface DataRowProps extends React.HTMLAttributes<HTMLDivElement> {
  active?: boolean;
  selected?: boolean;
}

const DataRow = React.forwardRef<HTMLDivElement, DataRowProps>(
  ({ className, active, selected, children, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        "flex items-center h-12 px-4 gap-3 cursor-pointer transition-colors duration-100",
        "border-b border-[var(--border-subtle)]",
        "hover:bg-[var(--surface-hover)]",
        active && "bg-[var(--surface-active)]",
        selected && "bg-[var(--aiva-blue-glow)]",
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
);
DataRow.displayName = "DataRow";

export { DataRow };
