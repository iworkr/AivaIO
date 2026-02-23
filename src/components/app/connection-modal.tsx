"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { GmailIcon, SlackIcon, ShopifyIcon } from "@/components/icons/brand-icons";
import { Sparkles } from "lucide-react";

interface ConnectionModalProps {
  provider: string | null;
  onClose: () => void;
}

const PROVIDER_CONFIG: Record<string, { name: string; icon: React.FC<{ size?: number; className?: string }>; connectUrl: string }> = {
  gmail: { name: "Gmail", icon: GmailIcon, connectUrl: "/api/integrations/connect?provider=gmail" },
  slack: { name: "Slack", icon: SlackIcon, connectUrl: "/api/integrations/connect?provider=slack" },
  shopify: { name: "Shopify", icon: ShopifyIcon, connectUrl: "/api/integrations/connect?provider=shopify" },
};

export function ConnectionModal({ provider, onClose }: ConnectionModalProps) {
  const [redirecting, setRedirecting] = useState(false);
  const config = provider ? PROVIDER_CONFIG[provider] : null;

  useEffect(() => {
    if (!config) return;

    const timer = setTimeout(() => {
      setRedirecting(true);
      window.location.assign(config.connectUrl);
    }, 1200);

    return () => clearTimeout(timer);
  }, [config]);

  if (!provider || !config) return null;
  const BrandIcon = config.icon;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] flex items-center justify-center backdrop-blur-sm bg-[var(--background-main)]/60"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
          className="bg-[var(--background-elevated)] border border-[var(--border-hover)] rounded-2xl w-[400px] p-8 text-center"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Animated linkage: AIVA <--> Integration */}
          <div className="flex items-center justify-center gap-6 mb-6">
            <div className="size-12 rounded-xl bg-[var(--aiva-blue-glow)] flex items-center justify-center">
              <Sparkles size={20} className="text-[var(--aiva-blue)]" />
            </div>

            <div className="flex items-center gap-1">
              {[0, 1, 2].map((i) => (
                <motion.div
                  key={i}
                  className="w-1.5 h-1.5 rounded-full bg-[var(--border-glow)]"
                  animate={{
                    opacity: [0.2, 1, 0.2],
                    scale: [0.8, 1.2, 0.8],
                  }}
                  transition={{
                    duration: 1.2,
                    repeat: Infinity,
                    delay: i * 0.2,
                  }}
                />
              ))}
            </div>

            <div className="size-12 rounded-xl bg-[var(--surface-hover)] flex items-center justify-center">
              <BrandIcon size={24} />
            </div>
          </div>

          <p className="text-lg font-semibold text-[var(--text-primary)] mb-2">
            {redirecting ? `Connecting to ${config.name}…` : `Redirecting to ${config.name}`}
          </p>
          <p className="text-sm text-[var(--text-tertiary)]">
            You&apos;ll be redirected to securely authorize AIVA.
          </p>

          <div className="mt-6 h-1 w-full rounded-full bg-[var(--surface-hover)] overflow-hidden">
            <motion.div
              className="h-full bg-[var(--aiva-blue)]/60 rounded-full"
              initial={{ width: "0%" }}
              animate={{ width: "100%" }}
              transition={{ duration: 1.2, ease: "linear" }}
            />
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
