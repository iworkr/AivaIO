"use client";

import { motion } from "framer-motion";

function LoadingBar() {
  return (
    <div className="fixed top-0 left-0 right-0 h-[2px] z-[9999] overflow-hidden">
      <motion.div
        className="h-full bg-[var(--aiva-blue)]"
        initial={{ x: "-100%" }}
        animate={{ x: "100%" }}
        transition={{
          repeat: Infinity,
          duration: 1.5,
          ease: "easeInOut",
        }}
        style={{ width: "40%" }}
      />
    </div>
  );
}

function ProgressBar({ value }: { value: number }) {
  return (
    <div className="h-[2px] w-full bg-[var(--surface-hover)] overflow-hidden rounded-full">
      <motion.div
        className="h-full bg-[var(--aiva-blue)]"
        initial={{ width: 0 }}
        animate={{ width: `${Math.min(100, Math.max(0, value))}%` }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      />
    </div>
  );
}

export { LoadingBar, ProgressBar };
