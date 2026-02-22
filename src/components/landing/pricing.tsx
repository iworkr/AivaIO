"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { linearFadeIn, viewportOnce } from "@/lib/animations";
import { Button } from "@/components/ui";
import { Check } from "lucide-react";

const plans = [
  {
    name: "Starter",
    description: "For personal inbox control.",
    monthly: 29,
    annual: 23,
    features: [
      "1 email account",
      "AI drafts & tone matching",
      "Priority inbox",
      "Basic integrations",
      "500 AI drafts/month",
    ],
    cta: "Start Free",
    highlighted: false,
  },
  {
    name: "Team",
    description: "For client work + collaboration.",
    monthly: 79,
    annual: 63,
    features: [
      "5 email accounts",
      "Auto-send with approval",
      "Unlimited channels",
      "Shopify + CRM integration",
      "Unlimited AI drafts",
      "Safety Vault & audit log",
      "Tone calibration per member",
    ],
    cta: "Start Free",
    highlighted: true,
  },
  {
    name: "Enterprise",
    description: "SSO, audit logs, API.",
    monthly: null,
    annual: null,
    features: [
      "Unlimited seats",
      "SSO / SAML",
      "Custom AI models",
      "SOC 2 compliance",
      "Dedicated support",
      "Custom integrations",
      "SLA guarantees",
    ],
    cta: "Contact Sales",
    highlighted: false,
  },
];

export function Pricing() {
  const [annual, setAnnual] = useState(false);

  return (
    <section id="pricing" className="py-32 px-6">
      <motion.div
        variants={linearFadeIn}
        initial="hidden"
        whileInView="visible"
        viewport={viewportOnce}
        className="max-w-5xl mx-auto"
      >
        <div className="text-center mb-12">
          <h2 className="text-3xl sm:text-4xl font-bold text-[var(--text-primary)] tracking-[-0.03em] mb-4">
            Simple, transparent pricing.
          </h2>
          <p className="text-base text-[var(--text-secondary)] mb-8">
            Start free. Upgrade when your team is ready.
          </p>

          {/* Toggle */}
          <div className="inline-flex items-center gap-3 rounded-full border border-[var(--border-subtle)] p-1">
            <button
              onClick={() => setAnnual(false)}
              className={`text-sm px-4 py-1.5 rounded-full transition-all duration-150 ${
                !annual
                  ? "bg-[var(--text-primary)] text-[var(--background-main)] font-medium"
                  : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
              }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setAnnual(true)}
              className={`text-sm px-4 py-1.5 rounded-full transition-all duration-150 flex items-center gap-2 ${
                annual
                  ? "bg-[var(--text-primary)] text-[var(--background-main)] font-medium"
                  : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
              }`}
            >
              Annual
              <span className="text-[10px] font-medium text-[var(--aiva-blue)]">Save 20%</span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {plans.map((plan) => (
            <motion.div
              key={plan.name}
              className={`rounded-xl border p-6 flex flex-col ${
                plan.highlighted
                  ? "border-[var(--aiva-blue-border)] bg-[var(--background-elevated)]"
                  : "border-[var(--border-subtle)] bg-[var(--background-main)]"
              }`}
              whileHover={{ y: -2 }}
              transition={{ duration: 0.15 }}
            >
              <div className="mb-6">
                <h3 className="text-base font-semibold text-[var(--text-primary)] tracking-[-0.02em] mb-1">
                  {plan.name}
                </h3>
                <p className="text-sm text-[var(--text-secondary)]">{plan.description}</p>
              </div>

              <div className="mb-6">
                {plan.monthly !== null ? (
                  <div className="flex items-baseline gap-1">
                    <AnimatePresence mode="wait">
                      <motion.span
                        key={annual ? "annual" : "monthly"}
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 10 }}
                        transition={{ duration: 0.2 }}
                        className="text-4xl font-bold text-[var(--text-primary)] tracking-tight"
                      >
                        ${annual ? plan.annual : plan.monthly}
                      </motion.span>
                    </AnimatePresence>
                    <span className="text-sm text-[var(--text-tertiary)]">/mo</span>
                  </div>
                ) : (
                  <p className="text-4xl font-bold text-[var(--text-primary)] tracking-tight">Custom</p>
                )}
              </div>

              <ul className="space-y-2.5 mb-8 flex-1">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-center gap-2 text-sm text-[var(--text-secondary)]">
                    <Check size={14} className="text-[var(--text-tertiary)] shrink-0" />
                    {feature}
                  </li>
                ))}
              </ul>

              <Button
                variant={plan.highlighted ? "blue" : "secondary"}
                className="w-full"
              >
                {plan.cta}
              </Button>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </section>
  );
}
