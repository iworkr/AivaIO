"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Button, ToggleSwitch, ProgressBar } from "@/components/ui";
import { pageTransition } from "@/lib/animations";
import { useAuth } from "@/hooks/use-auth";
import { updateUserSettings } from "@/lib/supabase/queries";
import {
  ArrowRight, Sun, Moon, Command, Mail, Hash, ShoppingBag,
  Sparkles, Check, Loader2,
} from "lucide-react";

const totalSteps = 6;
const USE_MAGIC_ONBOARDING = true;

function StepWrapper({
  children,
  stepKey,
}: {
  children: React.ReactNode;
  stepKey: number;
}) {
  return (
    <motion.div
      key={stepKey}
      variants={pageTransition}
      initial="hidden"
      animate="visible"
      exit="exit"
      className="w-full max-w-lg mx-auto text-center"
    >
      {children}
    </motion.div>
  );
}

const integrations = [
  { icon: Mail, name: "Gmail", desc: "Email inbox & sent history", provider: "gmail", color: "#EA4335" },
  { icon: Hash, name: "Slack", desc: "Channels & direct messages", provider: "slack", color: "#E01E5A" },
  { icon: ShoppingBag, name: "Shopify", desc: "Orders, customers & support", provider: "shopify", color: "#96BF48" },
];

export default function OnboardingPage() {
  const routerForRedirect = useRouter();
  useEffect(() => {
    if (USE_MAGIC_ONBOARDING) routerForRedirect.replace("/onboarding/magic");
  }, [routerForRedirect]);

  const [step, setStep] = useState(0);
  const [theme, setTheme] = useState<"dark" | "light">("dark");
  const [changelog, setChangelog] = useState(false);
  const [marketing, setMarketing] = useState(false);
  const [finishing, setFinishing] = useState(false);
  const [connectedProviders, setConnectedProviders] = useState<Set<string>>(new Set());
  const [connectingProvider, setConnectingProvider] = useState<string | null>(null);
  const [connectError, setConnectError] = useState<string | null>(null);
  const router = useRouter();
  const { user } = useAuth();

  const next = async () => {
    if (step < totalSteps - 1) {
      setStep(step + 1);
      return;
    }

    setFinishing(true);
    try {
      if (user) {
        await updateUserSettings(user.id, {
          theme,
          subscribe_changelog: changelog,
          subscribe_marketing: marketing,
          onboarding_completed: true,
        });
      }
    } catch {
      // Settings save failed — don't block the user from entering the app
    }
    router.push("/app/inbox");
  };

  const selectTheme = (t: "dark" | "light") => {
    setTheme(t);
    document.documentElement.classList.remove("dark", "light");
    document.documentElement.classList.add(t);
  };

  const handleConnect = async (provider: string) => {
    setConnectingProvider(provider);
    setConnectError(null);
    try {
      const res = await fetch("/api/integrations/connect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ provider }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || `Connection failed (${res.status})`);
      }

      const data = await res.json();
      if (data.authUrl) {
        window.location.assign(data.authUrl);
      } else {
        throw new Error("No authorization URL received");
      }
    } catch (err) {
      setConnectError(
        err instanceof Error
          ? err.message
          : "We couldn't connect right now. Please try again."
      );
      setTimeout(() => setConnectError(null), 5000);
    } finally {
      setConnectingProvider(null);
    }
  };

  return (
    <div className="min-h-screen bg-[var(--background-main)] flex flex-col items-center justify-center px-6 py-16">
      {/* Progress */}
      <div className="w-full max-w-xs mb-12">
        <ProgressBar value={((step + 1) / totalSteps) * 100} />
      </div>

      <AnimatePresence mode="wait">
        {/* Step 0: Welcome */}
        {step === 0 && (
          <StepWrapper stepKey={0}>
            <div className="mb-8">
              <img src="/aiva-mark.svg" alt="AIVA" className="h-16 w-16 mx-auto mb-6" />
              <h1 className="text-3xl font-bold text-[var(--text-primary)] tracking-[-0.03em] mb-3">
                Welcome to AIVA
              </h1>
              <p className="text-base text-[var(--text-secondary)] max-w-sm mx-auto">
                AIVA is a purpose-built system for managing communication.
                Streamline your inbox, drafts, and integrations.
              </p>
            </div>
            <Button size="xl" onClick={next}>
              Get started
              <ArrowRight size={16} />
            </Button>
          </StepWrapper>
        )}

        {/* Step 1: Theme selection */}
        {step === 1 && (
          <StepWrapper stepKey={1}>
            <h2 className="text-2xl font-bold text-[var(--text-primary)] tracking-[-0.03em] mb-2">
              Choose your style
            </h2>
            <p className="text-sm text-[var(--text-secondary)] mb-8">
              Change your theme at any time via the command menu or settings.
            </p>

            <div className="grid grid-cols-2 gap-4 mb-8 max-w-sm mx-auto">
              {([
                { value: "light" as const, label: "Light", icon: Sun, bg: "#fff", text: "#111" },
                { value: "dark" as const, label: "Dark", icon: Moon, bg: "#0A0A0A", text: "#f4f4f5" },
              ]).map((opt) => {
                const Icon = opt.icon;
                return (
                  <button
                    key={opt.value}
                    onClick={() => selectTheme(opt.value)}
                    className={`rounded-xl border-2 p-4 transition-all duration-150 cursor-pointer ${
                      theme === opt.value
                        ? "border-[var(--aiva-blue)]"
                        : "border-[var(--border-subtle)] hover:border-[var(--border-glow)]"
                    }`}
                  >
                    <div
                      className="rounded-lg h-24 mb-3 flex items-center justify-center border border-[var(--border-subtle)]"
                      style={{ background: opt.bg }}
                    >
                      <Icon size={24} style={{ color: opt.text }} />
                    </div>
                    <p className="text-sm font-medium text-[var(--text-primary)]">{opt.label}</p>
                  </button>
                );
              })}
            </div>

            <Button size="lg" onClick={next}>
              Continue
              <ArrowRight size={16} />
            </Button>
          </StepWrapper>
        )}

        {/* Step 2: Command menu intro */}
        {step === 2 && (
          <StepWrapper stepKey={2}>
            <h2 className="text-2xl font-bold text-[var(--text-primary)] tracking-[-0.03em] mb-2">
              Meet the command menu
            </h2>
            <p className="text-sm text-[var(--text-secondary)] mb-8">
              Complete any action in seconds by typing it into the command menu.
            </p>

            <div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--background-elevated)] p-8 mb-8 max-w-sm mx-auto">
              <p className="text-sm text-[var(--text-secondary)] mb-4">
                Try opening the command menu with:
              </p>
              <div className="flex items-center justify-center gap-3">
                <kbd className="inline-flex items-center justify-center h-12 w-12 rounded-lg border border-[var(--border-subtle)] bg-[var(--background-main)] text-[var(--text-primary)]">
                  <Command size={20} />
                </kbd>
                <kbd className="inline-flex items-center justify-center h-12 w-12 rounded-lg border border-[var(--border-subtle)] bg-[var(--background-main)] text-lg font-semibold text-[var(--text-primary)]">
                  K
                </kbd>
              </div>
            </div>

            <Button size="lg" onClick={next}>
              Continue
              <ArrowRight size={16} />
            </Button>
          </StepWrapper>
        )}

        {/* Step 3: Connect integrations */}
        {step === 3 && (
          <StepWrapper stepKey={3}>
            <h2 className="text-2xl font-bold text-[var(--text-primary)] tracking-[-0.03em] mb-2">
              Connect your tools
            </h2>
            <p className="text-sm text-[var(--text-secondary)] mb-8">
              AIVA works best with your existing communication channels connected.
            </p>

            <div className="space-y-3 mb-8 max-w-sm mx-auto">
              {integrations.map(({ icon: Icon, name, desc, provider }) => {
                const isConnected = connectedProviders.has(provider);
                const isConnecting = connectingProvider === provider;
                return (
                  <div
                    key={name}
                    className="flex items-center gap-4 rounded-xl border border-[var(--border-subtle)] bg-[var(--background-elevated)] p-4"
                  >
                    <div className="h-10 w-10 rounded-lg bg-[var(--surface-hover)] flex items-center justify-center">
                      <Icon size={18} className="text-[var(--text-secondary)]" />
                    </div>
                    <div className="flex-1 text-left">
                      <p className="text-sm font-medium text-[var(--text-primary)]">{name}</p>
                      <p className="text-xs text-[var(--text-tertiary)]">{desc}</p>
                    </div>
                    {isConnected ? (
                      <div className="flex items-center gap-1.5 text-xs font-medium text-[var(--status-success)]">
                        <Check size={14} />
                        Connected
                      </div>
                    ) : (
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => handleConnect(provider)}
                        disabled={isConnecting}
                      >
                        {isConnecting ? <Loader2 size={14} className="animate-spin" /> : "Connect"}
                      </Button>
                    )}
                  </div>
                );
              })}
            </div>

            <AnimatePresence>
              {connectError && (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 8 }}
                  className="mb-4 mx-auto max-w-sm rounded-lg bg-[var(--status-error-bg)] border border-[var(--status-error)]/20 px-4 py-3"
                >
                  <p className="text-xs text-[var(--status-error)]">
                    {connectError}
                  </p>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="flex items-center justify-center gap-3">
              <Button variant="ghost" onClick={next}>
                Skip for now
              </Button>
              <Button size="lg" onClick={next} disabled={!!connectingProvider}>
                Continue
                <ArrowRight size={16} />
              </Button>
            </div>
          </StepWrapper>
        )}

        {/* Step 4: Tone calibration */}
        {step === 4 && (
          <StepWrapper stepKey={4}>
            <div className="mb-8">
              <div className="inline-flex items-center justify-center h-12 w-12 rounded-full bg-[var(--aiva-blue-glow)] mb-4">
                <Sparkles size={24} className="text-[var(--aiva-blue)]" />
              </div>
              <h2 className="text-2xl font-bold text-[var(--text-primary)] tracking-[-0.03em] mb-2">
                Calibrating your tone
              </h2>
              <p className="text-sm text-[var(--text-secondary)] max-w-sm mx-auto">
                AIVA will analyze your communication history to learn your personal
                writing style once your email is connected.
              </p>
            </div>

            <div className="max-w-xs mx-auto mb-8">
              <div className="space-y-3 text-left">
                {[
                  { label: "Scanning sent emails...", done: connectedProviders.has("gmail") },
                  { label: "Extracting tone dimensions...", done: false },
                  { label: "Building vocabulary profile...", done: false },
                  { label: "Selecting golden exemplars...", done: false },
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <div className={`w-1.5 h-1.5 rounded-full ${
                      item.done ? "bg-[var(--status-success)]" : "bg-[var(--text-tertiary)]"
                    }`} />
                    <span className={`text-xs font-mono ${
                      item.done ? "text-[var(--text-secondary)]" : "text-[var(--text-tertiary)]"
                    }`}>
                      {item.label}
                    </span>
                  </div>
                ))}
              </div>
              <p className="text-xs text-[var(--text-tertiary)] mt-4">
                Tone calibration will run automatically after your first sync.
              </p>
            </div>

            <Button size="lg" onClick={next}>
              Continue
              <ArrowRight size={16} />
            </Button>
          </StepWrapper>
        )}

        {/* Step 5: Subscribe */}
        {step === 5 && (
          <StepWrapper stepKey={5}>
            <h2 className="text-2xl font-bold text-[var(--text-primary)] tracking-[-0.03em] mb-2">
              Subscribe to updates
            </h2>
            <p className="text-sm text-[var(--text-secondary)] mb-8">
              AIVA is constantly evolving. Subscribe to learn about changes.
            </p>

            <div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--background-elevated)] max-w-sm mx-auto mb-8 divide-y divide-[var(--border-subtle)]">
              <div className="flex items-center justify-between p-4">
                <div className="text-left">
                  <p className="text-sm font-medium text-[var(--text-primary)]">Subscribe to changelog</p>
                  <p className="text-xs text-[var(--text-tertiary)]">Bi-weekly email about new features</p>
                </div>
                <ToggleSwitch checked={changelog} onCheckedChange={setChangelog} />
              </div>
              <div className="flex items-center justify-between p-4">
                <div className="text-left">
                  <p className="text-sm font-medium text-[var(--text-primary)]">Marketing & onboarding</p>
                  <p className="text-xs text-[var(--text-tertiary)]">Occasional tips to get the most out of AIVA</p>
                </div>
                <ToggleSwitch checked={marketing} onCheckedChange={setMarketing} />
              </div>
            </div>

            <Button size="xl" onClick={next} disabled={finishing}>
              {finishing ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  Setting up...
                </>
              ) : (
                <>
                  Enter AIVA
                  <ArrowRight size={16} />
                </>
              )}
            </Button>
          </StepWrapper>
        )}
      </AnimatePresence>

      {/* Bottom step indicators */}
      <div className="flex items-center gap-2 mt-12">
        {Array.from({ length: totalSteps }).map((_, i) => (
          <div
            key={i}
            className={`h-1.5 rounded-full transition-all duration-300 ${
              i === step
                ? "w-6 bg-[var(--text-primary)]"
                : i < step
                ? "w-1.5 bg-[var(--text-secondary)]"
                : "w-1.5 bg-[var(--text-tertiary)]"
            }`}
          />
        ))}
      </div>
    </div>
  );
}
