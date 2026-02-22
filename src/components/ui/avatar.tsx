import * as React from "react";
import { cn } from "@/lib/utils";

interface AvatarProps extends React.HTMLAttributes<HTMLDivElement> {
  src?: string;
  alt?: string;
  initials?: string;
  size?: "sm" | "md" | "lg" | "xl";
}

function Avatar({ src, alt, initials, size = "md", className, ...props }: AvatarProps) {
  const sizeClasses = {
    sm: "h-6 w-6 text-[10px]",
    md: "h-8 w-8 text-xs",
    lg: "h-10 w-10 text-sm",
    xl: "h-16 w-16 text-2xl",
  };

  return (
    <div
      className={cn(
        "relative inline-flex shrink-0 items-center justify-center rounded-full overflow-hidden",
        "bg-[rgba(255,255,255,0.05)] text-[var(--text-primary)] font-medium",
        sizeClasses[size],
        className
      )}
      {...props}
    >
      {src ? (
        <img
          src={src}
          alt={alt || ""}
          className="h-full w-full object-cover grayscale-[20%]"
        />
      ) : (
        <span>{initials || "?"}</span>
      )}
    </div>
  );
}

export { Avatar };
