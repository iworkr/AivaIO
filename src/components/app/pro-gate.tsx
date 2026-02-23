"use client";

import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Lock, Sparkles, Zap } from "lucide-react";
import { useSubscription } from "@/hooks/use-subscription";
import { UpgradeModal } from "./upgrade-modal";
import type { ProFeature } from "@/types";
import { PRO_FEATURES } from "@/types";

interface ProGateProps {
  feature: ProFeature;
  children: React.ReactNode;
  fallback?: React.ReactNode;
  mode?: "blur" | "replace" | "wrap";
}

export function ProGate({ feature, children, fallback, mode = "blur" }: ProGateProps) {
  const { canUse, loading } = useSubscription();
  const [showUpgrade, setShowUpgrade] = useState(false);

  if (loading) return <>{children}</>;
  if (canUse(feature)) return <>{children}</>;

  const featureInfo = PRO_FEATURES[feature];

  if (mode === "replace" && fallback) {
    return (
      <>
        {fallback}
        <UpgradeModal
          open={showUpgrade}
          onClose={() => setShowUpgrade(false)}
          feature={feature}
        />
      </>
    );
  }

  if (mode === "wrap") {
    return (
      <>
        <div
          onClick={() => setShowUpgrade(true)}
          className="cursor-pointer"
        >
          {children}
        </div>
        <UpgradeModal
          open={showUpgrade}
          onClose={() => setShowUpgrade(false)}
          feature={feature}
        />
      </>
    );
  }

  return (
    <>
      <div className="relative group">
        <div className="blur-[2px] opacity-60 pointer-events-none select-none">
          {children}
        </div>
        <div
          onClick={() => setShowUpgrade(true)}
          className="absolute inset-0 z-10 flex flex-col items-center justify-center cursor-pointer"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-[var(--background-elevated)]/90 backdrop-blur-md border border-[var(--border-hover)] rounded-xl px-6 py-4 text-center max-w-xs shadow-xl"
          >
            <div className="h-10 w-10 rounded-full bg-[var(--aiva-blue-glow)] flex items-center justify-center mx-auto mb-3">
              <Lock size={18} className="text-[var(--aiva-blue)]" />
            </div>
            <p className="text-sm font-semibold text-[var(--text-primary)] mb-1">
              {featureInfo.label}
            </p>
            <p className="text-xs text-[var(--text-tertiary)] mb-3 leading-relaxed">
              {featureInfo.description}
            </p>
            <div className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[var(--aiva-blue)] text-white text-xs font-semibold shadow-[0_0_15px_var(--aiva-blue-glow)] hover:brightness-110 transition-all">
              <Zap size={12} />
              Unlock with Aiva Pro
            </div>
          </motion.div>
        </div>
      </div>
      <UpgradeModal
        open={showUpgrade}
        onClose={() => setShowUpgrade(false)}
        feature={feature}
      />
    </>
  );
}

interface ProButtonProps {
  feature: ProFeature;
  children: React.ReactNode;
  onClick?: () => void;
  className?: string;
  disabled?: boolean;
}

export function ProButton({ feature, children, onClick, className = "", disabled }: ProButtonProps) {
  const { canUse } = useSubscription();
  const [showUpgrade, setShowUpgrade] = useState(false);

  if (canUse(feature)) {
    return (
      <button onClick={onClick} className={className} disabled={disabled}>
        {children}
      </button>
    );
  }

  return (
    <>
      <button
        onClick={() => setShowUpgrade(true)}
        className={`${className} relative`}
        disabled={disabled}
      >
        {children}
        <span className="absolute -top-1 -right-1 flex items-center justify-center w-4 h-4 rounded-full bg-[var(--aiva-blue)] shadow-[0_0_8px_var(--aiva-blue-glow)]">
          <Sparkles size={8} className="text-white" />
        </span>
      </button>
      <UpgradeModal
        open={showUpgrade}
        onClose={() => setShowUpgrade(false)}
        feature={feature}
      />
    </>
  );
}
