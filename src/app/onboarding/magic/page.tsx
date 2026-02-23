"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Button, ProgressBar } from "@/components/ui";
import { useAuth } from "@/hooks/use-auth";
import { updateUserSettings } from "@/lib/supabase/queries";
import { GmailIcon, SlackIcon, ShopifyIcon } from "@/components/icons/brand-icons";
import { UpgradeModal } from "@/components/app/upgrade-modal";
import {
  ArrowRight, Mail, Hash, ShoppingBag, Sparkles, Check,
  Loader2, Shield, Lock, Calendar, FileText, Clock,
  CheckCircle, Zap, Star,
} from "lucide-react";

/* ═════════════════ Types ═════════════════ */

interface MagicItem {
  type: "drafted_reply" | "extracted_task";
  title: string;
  from: string;
  fromEmail: string;
  snippet: string;
  aiAction: string;
  scheduledTime?: string;
  priority: "urgent" | "high" | "medium" | "low";
  threadId?: string;
}

interface SSEStatus {
  phase: string;
  message: string;
}

/* ═════════════════ Constants ═════════════════ */

const INTEGRATIONS = [
  { icon: GmailIcon, name: "Gmail", desc: "Email inbox & sent history", provider: "gmail" },
  { icon: SlackIcon, name: "Slack", desc: "Channels & direct messages", provider: "slack" },
  { icon: ShopifyIcon, name: "Shopify", desc: "Orders & customers", provider: "shopify" },
];

const AIVA_GLOW_KEYFRAMES = {
  boxShadow: [
    "0 0 40px rgba(59,130,246,0.08)",
    "0 0 80px rgba(59,130,246,0.18)",
    "0 0 40px rgba(59,130,246,0.08)",
  ],
};

/* ═════════════════ Step Wrapper ═════════════════ */

function StepShell({ children, stepKey }: { children: React.ReactNode; stepKey: string }) {
  return (
    <motion.div
      key={stepKey}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      className="w-full max-w-xl mx-auto text-center"
    >
      {children}
    </motion.div>
  );
}

/* ═════════════════ Demo Items (Inbox Zero Fallback) ═════════════════ */

const DEMO_ITEMS: MagicItem[] = [
  { type: "drafted_reply", title: "Meeting with Sarah", from: "Sarah Chen", fromEmail: "sarah@acme.co", snippet: "Re: Q1 Planning", aiAction: "Draft reply proposing Tuesday at 2 PM", priority: "high" },
  { type: "drafted_reply", title: "Follow up on proposal", from: "James Wright", fromEmail: "james@startup.io", snippet: "Re: Partnership Proposal", aiAction: "Draft a follow-up asking for timeline", priority: "medium" },
  { type: "drafted_reply", title: "Reschedule standup", from: "Emily Torres", fromEmail: "emily@team.co", snippet: "Team Standup", aiAction: "Draft reply suggesting Wednesday 10 AM", priority: "medium" },
  { type: "extracted_task", title: "Review Q3 Report", from: "David Park", fromEmail: "david@corp.com", snippet: "From David's email", aiAction: "Auto-scheduled for Tomorrow at 10 AM", priority: "high" },
  { type: "extracted_task", title: "Submit expense report", from: "Finance Team", fromEmail: "finance@corp.com", snippet: "Monthly expenses", aiAction: "Due Friday — blocked 30 min", priority: "medium" },
  { type: "extracted_task", title: "Prepare client deck", from: "Lisa Huang", fromEmail: "lisa@agency.co", snippet: "Client presentation", aiAction: "Blocked 2 hours Thursday morning", priority: "high" },
  { type: "extracted_task", title: "Sign updated NDA", from: "Legal Dept", fromEmail: "legal@corp.com", snippet: "Contract update", aiAction: "Flagged for review today", priority: "urgent" },
  { type: "extracted_task", title: "Book flight to NYC", from: "Travel Bot", fromEmail: "travel@corp.com", snippet: "Upcoming trip", aiAction: "Scheduled for this afternoon", priority: "medium" },
  { type: "extracted_task", title: "Update project timeline", from: "PM Tool", fromEmail: "pm@tool.io", snippet: "Sprint planning", aiAction: "Added to Friday focus block", priority: "low" },
  { type: "extracted_task", title: "Review candidate resume", from: "HR Team", fromEmail: "hr@corp.com", snippet: "Senior Dev Candidate", aiAction: "Blocked 15 min tomorrow", priority: "medium" },
];

/* ═════════════════ Main Component ═════════════════ */

export default function MagicOnboardingPage() {
  const [step, setStep] = useState<"welcome" | "connect" | "working" | "reveal" | "paywall">("welcome");
  const [connectingProvider, setConnectingProvider] = useState<string | null>(null);
  const [connectError, setConnectError] = useState<string | null>(null);
  const [gmailConnected, setGmailConnected] = useState(false);
  const [magicStatus, setMagicStatus] = useState<SSEStatus | null>(null);
  const [magicItems, setMagicItems] = useState<MagicItem[]>([]);
  const [timeSaved, setTimeSaved] = useState(0);
  const [isInboxZero, setIsInboxZero] = useState(false);
  const [revealedCount, setRevealedCount] = useState(0);
  const [showUpgrade, setShowUpgrade] = useState(false);
  const [finishing, setFinishing] = useState(false);
  const router = useRouter();
  const { user } = useAuth();
  const sseRef = useRef<EventSource | null>(null);

  /* ── Check if Gmail is already connected ── */
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("success") === "true" && params.get("integration") === "gmail") {
      setGmailConnected(true);
      setStep("working");
      window.history.replaceState({}, "", "/onboarding/magic");
    }
  }, []);

  /* ── Handle Gmail connect ── */
  const handleConnect = useCallback(async (provider: string) => {
    setConnectingProvider(provider);
    setConnectError(null);
    try {
      const res = await fetch("/api/integrations/connect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ provider, returnTo: "/onboarding/magic" }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || `Connection failed (${res.status})`);
      }
      const data = await res.json();
      if (data.authUrl) {
        window.location.assign(data.authUrl);
      }
    } catch (err) {
      setConnectError(err instanceof Error ? err.message : "Connection failed. Try again.");
      setConnectingProvider(null);
      setTimeout(() => setConnectError(null), 5000);
    }
  }, []);

  /* ── Run Magic SSE pipeline ── */
  const runMagicPipeline = useCallback(() => {
    if (sseRef.current) sseRef.current.close();

    const eventSource = new EventSource("/api/onboarding/magic");
    sseRef.current = eventSource;

    eventSource.addEventListener("status", (e) => {
      try {
        const data = JSON.parse(e.data);
        setMagicStatus(data);
      } catch { /* skip */ }
    });

    eventSource.addEventListener("complete", (e) => {
      try {
        const data = JSON.parse(e.data);
        const items: MagicItem[] = data.items || [];
        const saved = data.timeSaved || 0;
        const inboxZero = data.inboxZero || false;

        if (inboxZero || items.length === 0) {
          setIsInboxZero(true);
          setMagicItems(DEMO_ITEMS);
          setTimeSaved(45);
        } else {
          setMagicItems(items);
          setTimeSaved(saved);
        }

        setTimeout(() => setStep("reveal"), 800);
      } catch { /* skip */ }
      eventSource.close();
    });

    eventSource.addEventListener("error", () => {
      // LLM timeout fallback: drop into dashboard
      setMagicItems(DEMO_ITEMS);
      setTimeSaved(45);
      setIsInboxZero(true);
      setTimeout(() => setStep("reveal"), 500);
      eventSource.close();
    });
  }, []);

  /* ── Trigger pipeline when entering "working" step ── */
  useEffect(() => {
    if (step === "working") {
      runMagicPipeline();
    }
    return () => {
      sseRef.current?.close();
    };
  }, [step, runMagicPipeline]);

  /* ── Card dealing animation for reveal ── */
  useEffect(() => {
    if (step !== "reveal" || magicItems.length === 0) return;
    setRevealedCount(0);
    let i = 0;
    const interval = setInterval(() => {
      i++;
      setRevealedCount(i);
      if (i >= magicItems.length) clearInterval(interval);
    }, 150);
    return () => clearInterval(interval);
  }, [step, magicItems.length]);

  /* ── Finish onboarding ── */
  const finishOnboarding = useCallback(async (startTrial: boolean) => {
    setFinishing(true);
    if (user) {
      await updateUserSettings(user.id, { onboarding_completed: true }).catch(() => {});
    }
    if (startTrial) {
      setShowUpgrade(true);
    } else {
      router.push("/app");
    }
  }, [user, router]);

  /* ── Progress value ── */
  const progressMap = { welcome: 10, connect: 30, working: 60, reveal: 85, paywall: 100 };

  return (
    <div className="min-h-screen bg-[#000000] flex flex-col items-center justify-center relative overflow-hidden">
      {/* Aiva Glow background */}
      <div className="absolute inset-0 pointer-events-none">
        <motion.div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full"
          animate={AIVA_GLOW_KEYFRAMES}
          transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
          style={{ filter: "blur(120px)" }}
        />
      </div>

      {/* Progress bar */}
      <div className="fixed top-0 left-0 right-0 z-50 px-0">
        <div className="h-[2px] bg-[var(--border-subtle)]">
          <motion.div
            className="h-full bg-[var(--aiva-blue)]"
            animate={{ width: `${progressMap[step]}%` }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          />
        </div>
      </div>

      <div className="relative z-10 w-full px-6 py-16 flex flex-col items-center justify-center min-h-screen">
        <AnimatePresence mode="wait">

          {/* ═══════ STEP 1: Welcome ═══════ */}
          {step === "welcome" && (
            <StepShell stepKey="welcome">
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.6, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
                className="mb-8"
              >
                <div className="h-16 w-16 rounded-2xl bg-[var(--aiva-blue-glow)] flex items-center justify-center mx-auto mb-8 shadow-[0_0_30px_var(--aiva-blue-glow)]">
                  <Sparkles size={28} className="text-[var(--aiva-blue)]" />
                </div>
                <h1 className="text-4xl font-bold text-[var(--text-primary)] tracking-[-0.04em] mb-4">
                  Welcome to Aiva.
                </h1>
                <h2 className="text-4xl font-bold text-[var(--text-tertiary)] tracking-[-0.04em] mb-6">
                  Let&apos;s reclaim your time.
                </h2>
                <p className="text-base text-[var(--text-secondary)] max-w-md mx-auto leading-relaxed">
                  Aiva needs to understand your workflow. Connect your primary communication channel to let Aiva organize your first 10 tasks.
                </p>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.5 }}
              >
                <Button
                  size="xl"
                  onClick={() => setStep("connect")}
                  className="shadow-[0_0_20px_var(--aiva-blue-glow)]"
                >
                  Start Setup
                  <ArrowRight size={16} />
                </Button>
              </motion.div>
            </StepShell>
          )}

          {/* ═══════ STEP 2: Connect ═══════ */}
          {step === "connect" && (
            <StepShell stepKey="connect">
              <div className="mb-8">
                <h2 className="text-3xl font-bold text-[var(--text-primary)] tracking-[-0.03em] mb-3">
                  Connect your tools
                </h2>
                <p className="text-sm text-[var(--text-secondary)] max-w-md mx-auto">
                  AIVA works best with your communication channels connected. Start with Gmail for the best experience.
                </p>
              </div>

              <div className="space-y-3 mb-6 max-w-sm mx-auto">
                {INTEGRATIONS.map(({ icon: Icon, name, desc, provider }) => {
                  const isGmail = provider === "gmail";
                  const isConnecting = connectingProvider === provider;
                  return (
                    <motion.div
                      key={provider}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: isGmail ? 0.1 : 0.2 }}
                      className={`flex items-center gap-4 rounded-xl border p-4 transition-all ${
                        isGmail
                          ? "bg-[var(--background-elevated)] border-[var(--aiva-blue-border)] shadow-[0_0_15px_var(--aiva-blue-glow)]"
                          : "bg-[var(--background-elevated)] border-[var(--border-subtle)]"
                      }`}
                    >
                      <div className="h-10 w-10 rounded-lg bg-[var(--surface-hover)] flex items-center justify-center">
                        <Icon size={18} />
                      </div>
                      <div className="flex-1 text-left">
                        <p className="text-sm font-medium text-[var(--text-primary)]">{name}</p>
                        <p className="text-xs text-[var(--text-tertiary)]">{desc}</p>
                      </div>
                      <Button
                        variant={isGmail ? "blue" : "secondary"}
                        size="sm"
                        onClick={() => handleConnect(provider)}
                        disabled={isConnecting}
                      >
                        {isConnecting ? <Loader2 size={14} className="animate-spin" /> : "Connect"}
                      </Button>
                    </motion.div>
                  );
                })}
              </div>

              <AnimatePresence>
                {connectError && (
                  <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="mb-4 max-w-sm mx-auto rounded-lg bg-[var(--status-error-bg)] border border-[var(--status-error)]/20 px-4 py-3"
                  >
                    <p className="text-xs text-[var(--status-error)]">{connectError}</p>
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="flex items-center justify-center gap-2 text-[var(--text-tertiary)] mb-6">
                <Lock size={12} />
                <span className="text-xs">
                  Secure, read-only access. We never train public models on your data.
                </span>
              </div>

              <button
                onClick={() => {
                  setIsInboxZero(true);
                  setMagicItems(DEMO_ITEMS);
                  setTimeSaved(45);
                  setStep("working");
                }}
                className="text-xs text-[var(--text-tertiary)] hover:text-[var(--text-secondary)] transition-colors"
              >
                Skip for now — show me a demo
              </button>
            </StepShell>
          )}

          {/* ═══════ STEP 3: Working Magic ═══════ */}
          {step === "working" && (
            <StepShell stepKey="working">
              <motion.div
                animate={AIVA_GLOW_KEYFRAMES}
                transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                className="h-20 w-20 rounded-2xl bg-[var(--aiva-blue-glow)] flex items-center justify-center mx-auto mb-10"
              >
                <Sparkles size={32} className="text-[var(--aiva-blue)]" />
              </motion.div>

              <h2 className="text-2xl font-bold text-[var(--text-primary)] tracking-[-0.03em] mb-4">
                {isInboxZero ? "Preparing your demo…" : "Working magic…"}
              </h2>

              <AnimatePresence mode="wait">
                <motion.p
                  key={magicStatus?.message || "init"}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                  className="text-sm text-[var(--text-secondary)] mb-8 h-6"
                >
                  {magicStatus?.message || "Initializing…"}
                </motion.p>
              </AnimatePresence>

              <div className="max-w-xs mx-auto">
                <div className="space-y-3">
                  {[
                    { label: "Syncing with Gmail", phase: "connecting" },
                    { label: "Scanning recent emails", phase: "scanning" },
                    { label: "Extracting action items", phase: "extracting" },
                    { label: "Drafting responses", phase: "analyzing" },
                    { label: "Organizing your day", phase: "done" },
                  ].map((s, i) => {
                    const currentPhases = ["connecting", "scanning", "extracting", "analyzing", "done"];
                    const currentIdx = currentPhases.indexOf(magicStatus?.phase || "");
                    const stepIdx = currentPhases.indexOf(s.phase);
                    const isDone = currentIdx >= stepIdx && currentIdx >= 0;
                    const isActive = currentIdx === stepIdx - 1 || (currentIdx === -1 && stepIdx === 0);

                    return (
                      <motion.div
                        key={s.phase}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: i * 0.15 }}
                        className="flex items-center gap-3"
                      >
                        <div className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 transition-all ${
                          isDone
                            ? "bg-[var(--status-success)]"
                            : isActive
                              ? "bg-[var(--aiva-blue-glow)] border border-[var(--aiva-blue)]"
                              : "bg-[var(--surface-hover)] border border-[var(--border-subtle)]"
                        }`}>
                          {isDone && <Check size={10} className="text-white" />}
                          {isActive && (
                            <motion.div
                              className="w-2 h-2 rounded-full bg-[var(--aiva-blue)]"
                              animate={{ scale: [1, 1.3, 1] }}
                              transition={{ duration: 1, repeat: Infinity }}
                            />
                          )}
                        </div>
                        <span className={`text-xs font-mono transition-colors ${
                          isDone ? "text-[var(--text-secondary)]" : isActive ? "text-[var(--text-primary)]" : "text-[var(--text-tertiary)]"
                        }`}>
                          {s.label}
                        </span>
                      </motion.div>
                    );
                  })}
                </div>
              </div>
            </StepShell>
          )}

          {/* ═══════ STEP 4: The Reveal ═══════ */}
          {step === "reveal" && (
            <motion.div
              key="reveal"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="w-full max-w-5xl mx-auto"
            >
              {/* Value Banner */}
              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                className="text-center mb-8"
              >
                {isInboxZero && (
                  <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-xs text-[var(--aiva-blue)] font-mono mb-3"
                  >
                    DEMO MODE — Your inbox is clean! Here&apos;s how Aiva handles a typical day.
                  </motion.p>
                )}
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.3 }}
                  className="inline-flex items-center gap-3 bg-[var(--aiva-blue-glow)] border border-[var(--aiva-blue-border)] rounded-full px-6 py-3"
                >
                  <Sparkles size={16} className="text-[var(--aiva-blue)]" />
                  <span className="text-sm font-semibold text-[var(--text-primary)]">
                    Aiva just organized {magicItems.length} threads, saving you an estimated {timeSaved} minutes.
                  </span>
                </motion.div>
              </motion.div>

              {/* Split View */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-8">
                {/* Left: Drafted Replies */}
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <Mail size={14} className="text-[var(--aiva-blue)]" />
                    <span className="text-xs font-semibold tracking-wider uppercase text-[var(--text-tertiary)]">
                      Drafted Replies
                    </span>
                  </div>
                  <div className="space-y-2">
                    {magicItems
                      .filter((item) => item.type === "drafted_reply")
                      .map((item, i) => (
                        <motion.div
                          key={`reply-${i}`}
                          initial={{ opacity: 0, x: -30, scale: 0.95 }}
                          animate={
                            i < revealedCount
                              ? { opacity: 1, x: 0, scale: 1 }
                              : { opacity: 0, x: -30, scale: 0.95 }
                          }
                          transition={{
                            duration: 0.4,
                            ease: [0.16, 1, 0.3, 1],
                          }}
                          className="bg-[var(--background-elevated)] border border-[var(--border-subtle)] rounded-xl p-4 hover:border-[var(--border-glow)] transition-colors"
                        >
                          <div className="flex items-start gap-3">
                            <div className="h-8 w-8 rounded-lg bg-[var(--aiva-blue-glow)] flex items-center justify-center shrink-0 mt-0.5">
                              <Mail size={14} className="text-[var(--aiva-blue)]" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="text-sm font-semibold text-[var(--text-primary)] truncate">
                                  {item.title}
                                </span>
                                <PriorityBadge priority={item.priority} />
                              </div>
                              <p className="text-xs text-[var(--text-tertiary)] mb-1.5">
                                From {item.from}
                              </p>
                              <div className="flex items-center gap-1.5 text-xs text-[var(--aiva-blue)]">
                                <Sparkles size={10} />
                                <span>{item.aiAction}</span>
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      ))}
                  </div>
                </div>

                {/* Right: Extracted Tasks */}
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <Calendar size={14} className="text-[var(--status-success)]" />
                    <span className="text-xs font-semibold tracking-wider uppercase text-[var(--text-tertiary)]">
                      Extracted Tasks
                    </span>
                  </div>
                  <div className="space-y-2">
                    {magicItems
                      .filter((item) => item.type === "extracted_task")
                      .map((item, i) => {
                        const globalIdx = magicItems.filter(it => it.type === "drafted_reply").length + i;
                        return (
                          <motion.div
                            key={`task-${i}`}
                            initial={{ opacity: 0, x: 30, scale: 0.95 }}
                            animate={
                              globalIdx < revealedCount
                                ? { opacity: 1, x: 0, scale: 1 }
                                : { opacity: 0, x: 30, scale: 0.95 }
                            }
                            transition={{
                              duration: 0.4,
                              ease: [0.16, 1, 0.3, 1],
                            }}
                            className="bg-[var(--background-elevated)] border border-[var(--border-subtle)] rounded-xl p-4 hover:border-[var(--border-glow)] transition-colors"
                          >
                            <div className="flex items-start gap-3">
                              <div className="h-8 w-8 rounded-lg bg-[var(--status-success-bg)] flex items-center justify-center shrink-0 mt-0.5">
                                <CheckCircle size={14} className="text-[var(--status-success)]" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1">
                                  <span className="text-sm font-semibold text-[var(--text-primary)] truncate">
                                    {item.title}
                                  </span>
                                  <PriorityBadge priority={item.priority} />
                                </div>
                                <p className="text-xs text-[var(--text-tertiary)] mb-1.5">
                                  From {item.from}&apos;s email
                                </p>
                                <div className="flex items-center gap-1.5 text-xs text-[var(--status-success)]">
                                  <Clock size={10} />
                                  <span>{item.aiAction}</span>
                                </div>
                              </div>
                            </div>
                          </motion.div>
                        );
                      })}
                  </div>
                </div>
              </div>

              {/* CTA */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: magicItems.length * 0.15 + 0.3, duration: 0.5 }}
                className="flex flex-col items-center gap-4"
              >
                <Button
                  size="xl"
                  onClick={() => setStep("paywall")}
                  className="shadow-[0_0_20px_var(--aiva-blue-glow)]"
                >
                  <Sparkles size={16} />
                  See My Dashboard
                  <ArrowRight size={16} />
                </Button>
              </motion.div>
            </motion.div>
          )}

          {/* ═══════ STEP 5: Paywall ═══════ */}
          {step === "paywall" && (
            <motion.div
              key="paywall"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="w-full max-w-5xl mx-auto relative"
            >
              {/* Blurred background showing organized items */}
              <div className="absolute inset-0 blur-[3px] opacity-30 pointer-events-none">
                <div className="grid grid-cols-2 gap-3">
                  {magicItems.slice(0, 6).map((item, i) => (
                    <div key={i} className="bg-[var(--background-elevated)] border border-[var(--border-subtle)] rounded-xl p-4">
                      <p className="text-sm text-[var(--text-primary)]">{item.title}</p>
                      <p className="text-xs text-[var(--text-tertiary)]">{item.aiAction}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Paywall overlay */}
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                className="relative z-10 max-w-lg mx-auto bg-[var(--background-elevated)]/95 backdrop-blur-xl border border-[var(--border-hover)] rounded-2xl p-10 text-center shadow-2xl"
              >
                <div className="h-14 w-14 rounded-2xl bg-[var(--aiva-blue-glow)] flex items-center justify-center mx-auto mb-6 shadow-[0_0_30px_var(--aiva-blue-glow)]">
                  <Sparkles size={24} className="text-[var(--aiva-blue)]" />
                </div>

                <h2 className="text-2xl font-bold text-[var(--text-primary)] tracking-[-0.03em] mb-3">
                  Let Aiva handle the rest.
                </h2>

                <p className="text-sm text-[var(--text-secondary)] leading-relaxed mb-6 max-w-sm mx-auto">
                  Aiva successfully organized your top {magicItems.length} priorities.
                  Upgrade to Aiva Pro to unlock unlimited autonomous scheduling, full task extraction, and the daily synthesis briefing.
                </p>

                {/* Features */}
                <div className="space-y-2 mb-8 text-left max-w-xs mx-auto">
                  {[
                    "Unlimited autonomous scheduling",
                    "AI email-to-task extraction",
                    "Daily synthesis briefing",
                    "Full Nexus Engine access",
                  ].map((feat) => (
                    <div key={feat} className="flex items-center gap-2.5">
                      <CheckCircle size={14} className="text-[var(--status-success)] shrink-0" />
                      <span className="text-sm text-[var(--text-secondary)]">{feat}</span>
                    </div>
                  ))}
                </div>

                {/* Trial badge */}
                <div className="inline-flex items-center gap-2 bg-[var(--status-success-bg)] border border-[var(--status-success)]/20 rounded-lg px-4 py-2 mb-6">
                  <Shield size={14} className="text-[var(--status-success)]" />
                  <span className="text-xs font-semibold text-[var(--status-success)]">
                    7-Day Free Trial. Cancel anytime.
                  </span>
                </div>

                <div className="space-y-3">
                  <Button
                    size="xl"
                    onClick={() => finishOnboarding(true)}
                    disabled={finishing}
                    className="w-full shadow-[0_0_20px_var(--aiva-blue-glow)]"
                  >
                    {finishing ? (
                      <Loader2 size={16} className="animate-spin" />
                    ) : (
                      <>
                        <Zap size={16} />
                        Start My 7-Day Free Trial
                      </>
                    )}
                  </Button>

                  <button
                    onClick={() => finishOnboarding(false)}
                    className="text-xs text-[var(--text-tertiary)] hover:text-[var(--text-secondary)] transition-colors"
                  >
                    Continue with Aiva Basic (Manual scheduling only)
                  </button>
                </div>

                <div className="flex items-center justify-center gap-1.5 mt-6">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} size={12} className="text-yellow-400 fill-yellow-400" />
                  ))}
                  <span className="text-[10px] text-[var(--text-tertiary)] ml-1">
                    Trusted by 2,400+ professionals
                  </span>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <UpgradeModal
        open={showUpgrade}
        onClose={() => {
          setShowUpgrade(false);
          router.push("/app");
        }}
      />
    </div>
  );
}

/* ═════════════════ Sub-Components ═════════════════ */

function PriorityBadge({ priority }: { priority: string }) {
  const config: Record<string, { bg: string; text: string; label: string }> = {
    urgent: { bg: "bg-[var(--status-error-bg)]", text: "text-[var(--status-error)]", label: "URGENT" },
    high: { bg: "bg-amber-500/10", text: "text-amber-400", label: "HIGH" },
    medium: { bg: "bg-[var(--surface-hover)]", text: "text-[var(--text-tertiary)]", label: "MED" },
    low: { bg: "bg-[var(--surface-hover)]", text: "text-[var(--text-tertiary)]", label: "LOW" },
  };
  const c = config[priority] || config.medium;
  return (
    <span className={`${c.bg} ${c.text} text-[9px] font-bold px-1.5 py-0.5 rounded tracking-wider`}>
      {c.label}
    </span>
  );
}
