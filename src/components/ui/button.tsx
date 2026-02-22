"use client";

import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap text-sm font-medium transition-all duration-150 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--aiva-blue-ring)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--background-main)] disabled:pointer-events-none disabled:opacity-50 cursor-pointer",
  {
    variants: {
      variant: {
        primary:
          "bg-[var(--text-primary)] text-[var(--background-main)] hover:opacity-90 border border-transparent",
        secondary:
          "bg-transparent text-[var(--text-primary)] border border-[var(--border-subtle)] hover:border-[var(--border-glow)] hover:bg-[var(--surface-hover)]",
        ghost:
          "bg-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-hover)]",
        blue:
          "bg-[var(--aiva-blue)] text-white hover:opacity-90",
        destructive:
          "bg-[var(--status-error-bg)] text-[var(--status-error)] border border-[rgba(239,68,68,0.3)] hover:bg-[rgba(239,68,68,0.15)]",
        link:
          "bg-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)] underline-offset-4 hover:underline p-0 h-auto",
      },
      size: {
        sm: "h-8 rounded-md px-3 text-xs",
        md: "h-9 rounded-lg px-4 text-sm",
        lg: "h-10 rounded-lg px-6 text-sm",
        xl: "h-12 rounded-lg px-8 text-base",
        icon: "h-9 w-9 rounded-lg",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "md",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };
