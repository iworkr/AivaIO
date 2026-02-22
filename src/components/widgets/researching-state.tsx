"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Mail, Hash, Phone, ShoppingBag, Calendar, Search, Database } from "lucide-react";

interface ResearchingStateProps {
  integrations?: string[];
  toolsActive?: string[];
  onComplete?: () => void;
}

const integrationConfig: Record<string, { icon: React.ElementType; label: string; color: string }> = {
  gmail: { icon: Mail, label: "Gmail", color: "#EA4335" },
  slack: { icon: Hash, label: "Slack", color: "#E01E5A" },
  whatsapp: { icon: Phone, label: "WhatsApp", color: "#25D366" },
  shopify: { icon: ShoppingBag, label: "Shopify", color: "#96BF48" },
  calendar: { icon: Calendar, label: "Calendar", color: "#4285F4" },
  search_inbox: { icon: Search, label: "Inbox", color: "#3B82F6" },
  get_shopify_orders: { icon: ShoppingBag, label: "Shopify", color: "#96BF48" },
  get_contact_info: { icon: Database, label: "CRM", color: "#8B5CF6" },
  get_thread_detail: { icon: Mail, label: "Thread", color: "#EA4335" },
};

const THINKING_PHRASES = [
  "> parsing_intent...",
  "> querying integrations...",
  "> scanning_inbox...",
  "> synthesizing_response...",
];

export function ResearchingState({ integrations = ["gmail"], toolsActive, onComplete }: ResearchingStateProps) {
  const [phase, setPhase] = useState(0);
  const [activeIntegrations, setActiveIntegrations] = useState<Set<string>>(new Set());
  const [microCopy, setMicroCopy] = useState(THINKING_PHRASES[0]);

  const displayIntegrations = toolsActive && toolsActive.length > 0
    ? toolsActive
    : integrations;

  useEffect(() => {
    let timeout: NodeJS.Timeout;

    if (phase === 0) {
      setMicroCopy(THINKING_PHRASES[0]);
      timeout = setTimeout(() => setPhase(1), 400);
    } else if (phase === 1) {
      displayIntegrations.forEach((int, i) => {
        setTimeout(() => {
          setActiveIntegrations((prev) => new Set([...prev, int]));
          const config = integrationConfig[int];
          const label = config?.label || int;
          setMicroCopy(`> querying: ${label.toLowerCase()} (scanning recent data...)`);
        }, i * 500);
      });
      timeout = setTimeout(() => setPhase(2), Math.max(1500, displayIntegrations.length * 600));
    } else if (phase === 2) {
      setMicroCopy(THINKING_PHRASES[3]);
      timeout = setTimeout(() => {
        setPhase(3);
        onComplete?.();
      }, 600);
    }

    return () => clearTimeout(timeout);
  }, [phase, displayIntegrations, onComplete]);

  if (phase === 3) return null;

  return (
    <div className="flex flex-col gap-3 py-2">
      <div className="w-full max-w-xs h-[1px] bg-[var(--border-subtle)] overflow-hidden rounded-full">
        <motion.div
          className="h-full bg-[var(--aiva-blue)]"
          initial={{ width: "0%" }}
          animate={{ width: phase === 0 ? "10%" : phase === 1 ? "70%" : "95%" }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        />
      </div>

      <AnimatePresence>
        {phase === 1 && (
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            className="flex items-center gap-3"
          >
            {displayIntegrations.map((int) => {
              const config = integrationConfig[int];
              if (!config) return null;
              const Icon = config.icon;
              const isActive = activeIntegrations.has(int);
              return (
                <motion.div
                  key={int}
                  animate={{ opacity: isActive ? 1 : 0.3 }}
                  transition={{ duration: 0.2 }}
                  className="flex items-center gap-1.5"
                >
                  <Icon
                    size={14}
                    style={{ color: isActive ? config.color : "var(--text-tertiary)" }}
                    className="transition-colors duration-200"
                  />
                  <span className="text-[11px] font-mono" style={{ color: isActive ? config.color : "var(--text-tertiary)" }}>
                    {config.label}
                  </span>
                </motion.div>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>

      <motion.p
        key={microCopy}
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.7 }}
        className="text-[11px] font-mono text-[var(--text-secondary)]"
      >
        {microCopy}
      </motion.p>
    </div>
  );
}
