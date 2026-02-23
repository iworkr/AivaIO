"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { GmailIcon, SlackIcon, ShopifyIcon } from "@/components/icons/brand-icons";
import { Sparkles, AlertCircle, RotateCw } from "lucide-react";

interface ConnectionModalProps {
  provider: string | null;
  onClose: () => void;
}

const PROVIDER_CONFIG: Record<string, { name: string; icon: React.FC<{ size?: number; className?: string }> }> = {
  gmail: { name: "Gmail", icon: GmailIcon },
  slack: { name: "Slack", icon: SlackIcon },
  shopify: { name: "Shopify", icon: ShopifyIcon },
};

export function ConnectionModal({ provider, onClose }: ConnectionModalProps) {
  const [phase, setPhase] = useState<"loading" | "redirecting" | "error">("loading");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const config = provider ? PROVIDER_CONFIG[provider] : null;

  const initiateOAuth = useCallback(async (targetProvider: string) => {
    setPhase("loading");
    setErrorMessage(null);

    try {
      const res = await fetch("/api/integrations/connect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ provider: targetProvider }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || `Connection failed (${res.status})`);
      }

      const data = await res.json();

      if (!data.authUrl) {
        throw new Error("No authorization URL received");
      }

      setPhase("redirecting");
      window.location.assign(data.authUrl);
    } catch (err) {
      setPhase("error");
      setErrorMessage(
        err instanceof Error
          ? err.message
          : "We couldn't connect to the provider right now. Please try again."
      );
    }
  }, []);

  useEffect(() => {
    if (!provider || !config) return;

    setPhase("loading");
    setErrorMessage(null);

    const timer = setTimeout(() => {
      initiateOAuth(provider);
    }, 800);

    return () => clearTimeout(timer);
  }, [provider, config, initiateOAuth]);

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

            {phase !== "error" && (
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
            )}

            {phase === "error" && (
              <AlertCircle size={20} className="text-[var(--status-error)]" />
            )}

            <div className={`size-12 rounded-xl flex items-center justify-center ${
              phase === "error" ? "bg-[var(--status-error-bg)]" : "bg-[var(--surface-hover)]"
            }`}>
              <BrandIcon size={24} />
            </div>
          </div>

          {phase === "error" ? (
            <>
              <p className="text-lg font-semibold text-[var(--text-primary)] mb-2">
                Connection failed
              </p>
              <p className="text-sm text-[var(--status-error)] mb-4">
                {errorMessage}
              </p>
              <div className="flex items-center justify-center gap-3">
                <button
                  onClick={() => initiateOAuth(provider)}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[var(--aiva-blue)] text-white text-sm font-medium hover:brightness-110 transition-all"
                >
                  <RotateCw size={14} />
                  Try Again
                </button>
                <button
                  onClick={onClose}
                  className="px-4 py-2 rounded-lg border border-[var(--border-hover)] text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:border-[var(--border-glow)] transition-colors"
                >
                  Close
                </button>
              </div>
            </>
          ) : (
            <>
              <p className="text-lg font-semibold text-[var(--text-primary)] mb-2">
                {phase === "redirecting" ? `Connecting to ${config.name}…` : `Preparing ${config.name} connection`}
              </p>
              <p className="text-sm text-[var(--text-tertiary)]">
                You&apos;ll be redirected to securely authorize AIVA.
              </p>

              <div className="mt-6 h-1 w-full rounded-full bg-[var(--surface-hover)] overflow-hidden">
                <motion.div
                  className="h-full bg-[var(--aiva-blue)]/60 rounded-full"
                  initial={{ width: "0%" }}
                  animate={{ width: phase === "redirecting" ? "100%" : "60%" }}
                  transition={{ duration: phase === "redirecting" ? 0.5 : 2, ease: "linear" }}
                />
              </div>
            </>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
