"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AlertTriangle, CreditCard, X } from "lucide-react";
import { useSubscription } from "@/hooks/use-subscription";

export function DunningBanner() {
  const { subscription, isPro } = useSubscription();
  const [dismissed, setDismissed] = useState(false);
  const [loading, setLoading] = useState(false);

  if (!subscription.paymentFailed || dismissed) return null;

  const graceDate = subscription.graceDeadline
    ? new Date(subscription.graceDeadline).toLocaleDateString("en-US", { month: "short", day: "numeric" })
    : null;

  const handleUpdate = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/stripe/portal", { method: "POST" });
      const data = await res.json();
      if (data.url) window.location.href = data.url;
    } catch {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ height: 0, opacity: 0 }}
        animate={{ height: "auto", opacity: 1 }}
        exit={{ height: 0, opacity: 0 }}
        className="bg-[var(--status-error-bg)] border-b border-[var(--status-error)]/20"
      >
        <div className="max-w-screen-xl mx-auto px-4 py-2.5 flex items-center gap-3">
          <AlertTriangle size={14} className="text-[var(--status-error)] shrink-0" />
          <p className="text-xs text-[var(--status-error)] flex-1">
            <span className="font-semibold">Payment failed.</span>{" "}
            Update your payment method to keep Aiva Pro access.
            {graceDate && (
              <span className="opacity-75"> Pro features expire on {graceDate}.</span>
            )}
          </p>
          <button
            onClick={handleUpdate}
            disabled={loading}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[var(--status-error)] text-white text-xs font-medium hover:brightness-110 transition-all disabled:opacity-50"
          >
            <CreditCard size={12} />
            {loading ? "Loading…" : "Update Payment"}
          </button>
          <button
            onClick={() => setDismissed(true)}
            className="text-[var(--status-error)]/60 hover:text-[var(--status-error)] transition-colors"
          >
            <X size={14} />
          </button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
