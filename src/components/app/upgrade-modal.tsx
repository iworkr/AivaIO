"use client";

import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X, Zap, Calendar, Mail, Clock, Shield, CheckCircle,
  Sparkles, ArrowRight, Star,
} from "lucide-react";
import type { ProFeature, BillingInterval } from "@/types";
import { PRO_FEATURES } from "@/types";
import { useSubscription } from "@/hooks/use-subscription";

interface UpgradeModalProps {
  open: boolean;
  onClose: () => void;
  feature?: ProFeature;
}

const FEATURES_LIST = [
  { icon: Calendar, text: "Autonomous meeting scheduling" },
  { icon: Mail, text: "AI email-to-task timeboxing" },
  { icon: Sparkles, text: "Daily synthesis briefing" },
  { icon: Clock, text: "Unlimited calendar accounts" },
  { icon: Shield, text: "Fully autonomous mode" },
  { icon: Zap, text: "Unlimited AI drafts" },
];

export function UpgradeModal({ open, onClose, feature }: UpgradeModalProps) {
  const [interval, setInterval] = useState<BillingInterval>("annual");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { refresh } = useSubscription();

  const annualPrice = 99;
  const monthlyPrice = 12;
  const dailyCost = (annualPrice / 365).toFixed(2);
  const annualSavings = monthlyPrice * 12 - annualPrice;

  const handleCheckout = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ interval }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to start checkout");
        setIsLoading(false);
        return;
      }

      if (data.url) {
        window.location.href = data.url;
      }
    } catch (err) {
      setError("Something went wrong. Please try again.");
      setIsLoading(false);
    }
  }, [interval]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-center justify-center p-4"
        >
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            className="relative z-10 w-full max-w-2xl bg-[var(--background-main)] border border-[var(--border-hover)] rounded-2xl overflow-hidden shadow-2xl"
          >
            <button
              onClick={onClose}
              className="absolute top-4 right-4 z-20 h-8 w-8 rounded-full flex items-center justify-center text-[var(--text-tertiary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-hover)] transition-colors"
            >
              <X size={16} />
            </button>

            <div className="flex flex-col md:flex-row">
              {/* Left — Value Proposition */}
              <div className="flex-1 p-8 md:p-10">
                <div className="flex items-center gap-2 mb-6">
                  <div className="h-8 w-8 rounded-lg bg-[var(--aiva-blue-glow)] flex items-center justify-center">
                    <Sparkles size={16} className="text-[var(--aiva-blue)]" />
                  </div>
                  <span className="text-sm font-bold text-[var(--aiva-blue)] tracking-wider uppercase">
                    Aiva Pro
                  </span>
                </div>

                <h2 className="text-2xl md:text-[28px] font-bold text-[var(--text-primary)] leading-tight mb-3">
                  Reclaim 4 hours a week with an autonomous AI assistant.
                </h2>

                <p className="text-sm text-[var(--text-secondary)] leading-relaxed mb-8">
                  Let the Nexus Engine handle meeting scheduling, email triage, and calendar management
                  — so you can focus on work that matters.
                </p>

                {feature && PRO_FEATURES[feature] && (
                  <div className="mb-6 p-3 rounded-lg bg-[var(--aiva-blue-glow)] border border-[var(--aiva-blue)]/20">
                    <p className="text-xs text-[var(--aiva-blue)] font-medium">
                      You tried to use: {PRO_FEATURES[feature].label}
                    </p>
                    <p className="text-xs text-[var(--text-tertiary)] mt-0.5">
                      {PRO_FEATURES[feature].description}
                    </p>
                  </div>
                )}

                <div className="space-y-3">
                  {FEATURES_LIST.map(({ icon: Icon, text }) => (
                    <div key={text} className="flex items-center gap-3">
                      <div className="h-6 w-6 rounded-full bg-[var(--status-success-bg)] flex items-center justify-center shrink-0">
                        <CheckCircle size={12} className="text-[var(--status-success)]" />
                      </div>
                      <span className="text-sm text-[var(--text-secondary)]">{text}</span>
                    </div>
                  ))}
                </div>

                <div className="flex items-center gap-2 mt-8">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} size={14} className="text-yellow-400 fill-yellow-400" />
                  ))}
                  <span className="text-xs text-[var(--text-tertiary)] ml-1">
                    Trusted by 2,400+ professionals
                  </span>
                </div>
              </div>

              {/* Right — Pricing + CTA */}
              <div className="w-full md:w-[280px] bg-[var(--background-elevated)] border-t md:border-t-0 md:border-l border-[var(--border-subtle)] p-8 flex flex-col">
                {/* Interval Toggle */}
                <div className="flex items-center justify-center gap-1 bg-[var(--surface-hover)] rounded-lg p-1 mb-6">
                  <button
                    onClick={() => setInterval("monthly")}
                    className={`flex-1 text-center py-2 rounded-md text-xs font-medium transition-colors ${
                      interval === "monthly"
                        ? "bg-[var(--background-main)] text-[var(--text-primary)] shadow-sm"
                        : "text-[var(--text-tertiary)] hover:text-[var(--text-secondary)]"
                    }`}
                  >
                    Monthly
                  </button>
                  <button
                    onClick={() => setInterval("annual")}
                    className={`flex-1 text-center py-2 rounded-md text-xs font-medium transition-colors relative ${
                      interval === "annual"
                        ? "bg-[var(--background-main)] text-[var(--text-primary)] shadow-sm"
                        : "text-[var(--text-tertiary)] hover:text-[var(--text-secondary)]"
                    }`}
                  >
                    Annual
                    <span className="absolute -top-2.5 -right-1 text-[9px] font-bold text-[var(--status-success)] bg-[var(--status-success-bg)] px-1.5 py-0.5 rounded-full">
                      SAVE ${annualSavings}
                    </span>
                  </button>
                </div>

                {/* Price Display */}
                <div className="text-center mb-6">
                  {interval === "annual" ? (
                    <>
                      <div className="flex items-baseline justify-center gap-1">
                        <span className="text-4xl font-bold text-[var(--text-primary)] tabular-nums">
                          ${annualPrice}
                        </span>
                        <span className="text-sm text-[var(--text-tertiary)]">/yr</span>
                      </div>
                      <p className="text-xs text-[var(--text-tertiary)] mt-1">
                        Just ${dailyCost} / day
                      </p>
                    </>
                  ) : (
                    <>
                      <div className="flex items-baseline justify-center gap-1">
                        <span className="text-4xl font-bold text-[var(--text-primary)] tabular-nums">
                          ${monthlyPrice}
                        </span>
                        <span className="text-sm text-[var(--text-tertiary)]">/mo</span>
                      </div>
                      <p className="text-xs text-[var(--text-tertiary)] mt-1">
                        Cancel anytime
                      </p>
                    </>
                  )}
                </div>

                {/* Trial Badge */}
                <div className="flex items-center justify-center gap-2 bg-[var(--status-success-bg)] border border-[var(--status-success)]/20 rounded-lg px-3 py-2 mb-6">
                  <Shield size={14} className="text-[var(--status-success)]" />
                  <span className="text-xs font-semibold text-[var(--status-success)]">
                    7-Day Free Trial
                  </span>
                </div>

                {/* CTA */}
                <button
                  onClick={handleCheckout}
                  disabled={isLoading}
                  className="w-full py-3.5 rounded-xl bg-[var(--aiva-blue)] text-white font-semibold text-sm shadow-[0_0_20px_var(--aiva-blue-glow)] hover:brightness-110 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isLoading ? (
                    <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      Start My 7-Day Free Trial
                      <ArrowRight size={14} />
                    </>
                  )}
                </button>

                {error && (
                  <p className="text-xs text-[var(--status-error)] text-center mt-2">
                    {error}
                  </p>
                )}

                <p className="text-[10px] text-[var(--text-tertiary)] text-center mt-4 leading-relaxed">
                  Cancel anytime with one click. No hidden fees.
                  {interval === "annual" && " Billed annually."}
                </p>

                <div className="mt-auto pt-6">
                  <p className="text-[10px] text-[var(--text-tertiary)] text-center">
                    Secured by Stripe. PCI-DSS compliant.
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
