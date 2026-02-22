"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Mail, Hash, Phone, ShoppingBag, Calendar } from "lucide-react";

interface ResearchingStateProps {
  integrations?: string[];
  onComplete?: () => void;
}

const integrationConfig: Record<string, { icon: React.ElementType; label: string; color: string }> = {
  gmail: { icon: Mail, label: "Gmail", color: "#EA4335" },
  slack: { icon: Hash, label: "Slack", color: "#E01E5A" },
  whatsapp: { icon: Phone, label: "WhatsApp", color: "#25D366" },
  shopify: { icon: ShoppingBag, label: "Shopify", color: "#96BF48" },
  calendar: { icon: Calendar, label: "Calendar", color: "#4285F4" },
};

const phases = [
  { label: "> parsing_intent...", duration: 300 },
  { label: "> querying integrations...", duration: 2200 },
  { label: "> synthesizing_response...", duration: 500 },
];

export function ResearchingState({ integrations = ["gmail", "slack", "shopify"], onComplete }: ResearchingStateProps) {
  const [phase, setPhase] = useState(0);
  const [activeIntegrations, setActiveIntegrations] = useState<Set<string>>(new Set());
  const [microCopy, setMicroCopy] = useState(phases[0].label);

  useEffect(() => {
    let timeout: NodeJS.Timeout;

    if (phase === 0) {
      setMicroCopy(phases[0].label);
      timeout = setTimeout(() => setPhase(1), phases[0].duration);
    } else if (phase === 1) {
      integrations.forEach((int, i) => {
        setTimeout(() => {
          setActiveIntegrations((prev) => new Set([...prev, int]));
          setMicroCopy(`> querying: ${int} (scanning recent data...)`);
        }, i * 600);
      });
      timeout = setTimeout(() => setPhase(2), phases[1].duration);
    } else if (phase === 2) {
      setMicroCopy(phases[2].label);
      timeout = setTimeout(() => {
        setPhase(3);
        onComplete?.();
      }, phases[2].duration);
    }

    return () => clearTimeout(timeout);
  }, [phase, integrations, onComplete]);

  if (phase === 3) return null;

  return (
    <div className="flex flex-col items-center gap-4 py-8">
      {/* Progress bar */}
      <div className="w-full max-w-xs h-[1px] bg-[var(--border-subtle)] overflow-hidden rounded-full">
        <motion.div
          className="h-full bg-[var(--aiva-blue)]"
          initial={{ width: "0%" }}
          animate={{ width: phase === 0 ? "10%" : phase === 1 ? "70%" : "95%" }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        />
      </div>

      {/* Integration logos */}
      <AnimatePresence>
        {phase === 1 && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="flex items-center gap-4"
          >
            {integrations.map((int) => {
              const config = integrationConfig[int];
              if (!config) return null;
              const Icon = config.icon;
              const isActive = activeIntegrations.has(int);
              return (
                <motion.div
                  key={int}
                  animate={{ opacity: isActive ? 1 : 0.3 }}
                  transition={{ duration: 0.2 }}
                  className="flex flex-col items-center gap-1"
                >
                  <Icon
                    size={24}
                    style={{ color: isActive ? config.color : "var(--text-tertiary)" }}
                    className="transition-colors duration-200"
                  />
                </motion.div>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Micro-copy */}
      <motion.p
        key={microCopy}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="text-[11px] font-mono text-[var(--text-secondary)]"
      >
        {microCopy}
      </motion.p>
    </div>
  );
}
