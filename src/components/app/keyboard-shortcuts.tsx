"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import { scaleIn } from "@/lib/animations";

const shortcuts = [
  { category: "Navigation", items: [
    { keys: ["⌘", "K"], desc: "Open command palette" },
    { keys: ["G", "I"], desc: "Go to Inbox" },
    { keys: ["G", "V"], desc: "Go to VIP" },
    { keys: ["G", "S"], desc: "Go to Settings" },
    { keys: ["⌘", "⇧", "L"], desc: "Toggle theme" },
  ]},
  { category: "Inbox", items: [
    { keys: ["J"], desc: "Move down" },
    { keys: ["K"], desc: "Move up" },
    { keys: ["↵"], desc: "Open conversation" },
    { keys: ["E"], desc: "Archive" },
    { keys: ["X"], desc: "Multi-select" },
    { keys: ["⌘", "⇧", "U"], desc: "Mark unread" },
  ]},
  { category: "Drafts", items: [
    { keys: ["⌘", "↵"], desc: "Approve & Send" },
    { keys: ["⇥"], desc: "Edit draft" },
    { keys: ["⌘", "J"], desc: "Cycle tone" },
  ]},
];

export function KeyboardShortcuts() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "?" && !(e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement)) {
        e.preventDefault();
        setOpen((o) => !o);
      }
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
            onClick={() => setOpen(false)}
          />
          <motion.div
            variants={scaleIn}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-lg rounded-xl border border-[var(--border-subtle)] bg-[var(--background-main)] shadow-2xl overflow-hidden"
          >
            <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--border-subtle)]">
              <h2 className="text-sm font-semibold text-[var(--text-primary)]">Keyboard Shortcuts</h2>
              <button onClick={() => setOpen(false)} className="text-[var(--text-tertiary)] hover:text-[var(--text-primary)]">
                <X size={16} />
              </button>
            </div>
            <div className="p-4 max-h-[60vh] overflow-y-auto">
              {shortcuts.map((group) => (
                <div key={group.category} className="mb-6 last:mb-0">
                  <p className="text-[10px] font-medium uppercase tracking-[0.06em] text-[var(--text-tertiary)] mb-2">
                    {group.category}
                  </p>
                  <div className="space-y-1">
                    {group.items.map((item) => (
                      <div key={item.desc} className="flex items-center justify-between h-8 px-2 rounded-md hover:bg-[var(--surface-hover)]">
                        <span className="text-xs text-[var(--text-secondary)]">{item.desc}</span>
                        <div className="flex items-center gap-1">
                          {item.keys.map((key, i) => (
                            <kbd
                              key={i}
                              className="inline-flex items-center justify-center min-w-[24px] h-6 px-1.5 rounded border border-[var(--border-subtle)] bg-[var(--background-elevated)] text-[10px] font-mono text-[var(--text-tertiary)]"
                            >
                              {key}
                            </kbd>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
