"use client";

import * as React from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

interface CommandPaletteProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children?: React.ReactNode;
}

function CommandPalette({ open, onOpenChange, children }: CommandPaletteProps) {
  React.useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        onOpenChange(!open);
      }
    };
    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, [open, onOpenChange]);

  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <AnimatePresence>
        {open && (
          <DialogPrimitive.Portal forceMount>
            <DialogPrimitive.Overlay asChild>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.15 }}
                className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
              />
            </DialogPrimitive.Overlay>
            <DialogPrimitive.Content asChild>
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: -10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: -10 }}
                transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
                className={cn(
                  "fixed top-[20%] left-1/2 z-50 w-full max-w-lg -translate-x-1/2",
                  "rounded-xl border border-[var(--border-subtle)] bg-[var(--background-main)] shadow-2xl",
                  "overflow-hidden"
                )}
              >
                <div className="flex items-center gap-3 border-b border-[var(--border-subtle)] px-4">
                  <Search size={16} className="text-[var(--text-tertiary)] shrink-0" />
                  <DialogPrimitive.Title className="sr-only">
                    Command Palette
                  </DialogPrimitive.Title>
                  <input
                    className="flex-1 h-12 bg-transparent text-[var(--text-primary)] text-base placeholder:text-[var(--text-tertiary)] focus:outline-none"
                    placeholder="Ask AIVA to find, draft, or execute..."
                    autoFocus
                  />
                  <kbd className="hidden sm:inline-flex h-5 items-center gap-1 rounded border border-[var(--border-subtle)] px-1.5 text-[10px] font-mono text-[var(--text-tertiary)]">
                    ESC
                  </kbd>
                </div>
                <div className="max-h-[300px] overflow-y-auto p-2">
                  {children || (
                    <div className="py-8 text-center text-sm text-[var(--text-tertiary)]">
                      Start typing to search...
                    </div>
                  )}
                </div>
              </motion.div>
            </DialogPrimitive.Content>
          </DialogPrimitive.Portal>
        )}
      </AnimatePresence>
    </DialogPrimitive.Root>
  );
}

interface CommandItemProps extends React.HTMLAttributes<HTMLDivElement> {
  icon?: React.ReactNode;
  shortcut?: string;
}

function CommandItem({ icon, shortcut, children, className, ...props }: CommandItemProps) {
  return (
    <div
      className={cn(
        "flex items-center gap-3 rounded-lg px-3 py-2 text-sm cursor-pointer",
        "text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-hover)]",
        "transition-colors duration-100",
        className
      )}
      {...props}
    >
      {icon && <span className="shrink-0 text-[var(--text-tertiary)]">{icon}</span>}
      <span className="flex-1">{children}</span>
      {shortcut && (
        <kbd className="text-[10px] font-mono text-[var(--text-tertiary)]">{shortcut}</kbd>
      )}
    </div>
  );
}

function CommandGroup({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="mb-2">
      <div className="px-3 py-1.5 text-[10px] font-medium uppercase tracking-[0.06em] text-[var(--text-tertiary)]">
        {label}
      </div>
      {children}
    </div>
  );
}

export { CommandPalette, CommandItem, CommandGroup };
