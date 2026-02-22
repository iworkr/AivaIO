"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { X } from "lucide-react";

interface ToastProps {
  message: string;
  icon?: React.ReactNode;
  duration?: number;
  onClose?: () => void;
  visible: boolean;
}

function Toast({ message, icon, duration = 4000, onClose, visible }: ToastProps) {
  const [show, setShow] = useState(visible);

  useEffect(() => {
    setShow(visible);
    if (visible && duration > 0) {
      const timer = setTimeout(() => {
        setShow(false);
        onClose?.();
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [visible, duration, onClose]);

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0, y: 16, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 8, scale: 0.95 }}
          transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
          className={cn(
            "fixed bottom-6 right-6 z-50 flex items-center gap-3",
            "rounded-lg border border-[var(--border-subtle)] bg-[var(--background-sidebar)] px-4 py-3",
            "text-sm text-[var(--text-secondary)] shadow-xl"
          )}
        >
          {icon && <span className="shrink-0">{icon}</span>}
          <span>{message}</span>
          <button
            onClick={() => {
              setShow(false);
              onClose?.();
            }}
            className="shrink-0 text-[var(--text-tertiary)] hover:text-[var(--text-primary)] transition-colors"
          >
            <X size={14} />
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export { Toast };
