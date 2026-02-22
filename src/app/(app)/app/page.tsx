"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/hooks/use-auth";
import { useSupabaseQuery } from "@/hooks/use-supabase-query";
import { fetchThreads } from "@/lib/supabase/queries";
import { AIResponseRenderer, ResearchingState, CitationPill } from "@/components/widgets";
import type { AIResponse } from "@/types";
import {
  ArrowUp, Paperclip, Mic, Sparkles,
  AlertCircle, Calendar, Ghost, FileText,
  Video, Pencil, Slash, X,
} from "lucide-react";

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  text: string;
  widgets?: AIResponse["widgets"];
  citations?: AIResponse["citations"];
  isStreaming?: boolean;
}

const PLACEHOLDERS = [
  "Ask AIVA what your day looks like…",
  "Summarize the Acme Corp thread…",
  "Where is John's Shopify order?",
  "Draft an email to Sarah pushing our meeting…",
  "Show me all VIP messages from this week…",
];

const SLASH_COMMANDS = [
  { cmd: "/triage", label: "Fetch unread high-priority emails", icon: AlertCircle },
  { cmd: "/briefing", label: "Re-generate the morning summary", icon: Sparkles },
  { cmd: "/clear", label: "Clear the current chat feed", icon: X },
];

function getGreeting(): string {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

function BriefingCard({
  icon, iconColor, title, body, action, onAction,
}: {
  icon: React.ReactNode;
  iconColor: string;
  title: string;
  body: string;
  action: string;
  onAction: () => void;
}) {
  return (
    <motion.div
      whileHover={{ y: -2, borderColor: "rgba(255,255,255,0.15)" }}
      className="bg-[#0A0A0A] border border-[rgba(255,255,255,0.06)] rounded-2xl p-5 flex flex-col gap-3 min-w-[260px] flex-1 cursor-default transition-colors"
    >
      <div className="flex items-center gap-2">
        <div className={`h-6 w-6 rounded-full flex items-center justify-center ${iconColor}`}>
          {icon}
        </div>
        <span className="text-sm font-medium text-[var(--text-primary)]">{title}</span>
      </div>
      <p className="text-sm text-[var(--text-secondary)] leading-relaxed">{body}</p>
      <button
        onClick={onAction}
        className="self-start text-xs text-[var(--text-tertiary)] hover:text-[var(--text-primary)] border border-[rgba(255,255,255,0.1)] rounded-md px-3 py-1.5 hover:border-[rgba(255,255,255,0.2)] hover:bg-[rgba(255,255,255,0.04)] transition-all"
      >
        {action}
      </button>
    </motion.div>
  );
}

export default function DashboardPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [chatActive, setChatActive] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [isThinking, setIsThinking] = useState(false);
  const [placeholderIdx, setPlaceholderIdx] = useState(0);
  const [showSlash, setShowSlash] = useState(false);
  const [inputFocused, setInputFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const feedEndRef = useRef<HTMLDivElement>(null);

  const { data: threads } = useSupabaseQuery(() => fetchThreads("Needs Review"), []);
  const { data: urgentThreads } = useSupabaseQuery(() => fetchThreads("Urgent"), []);

  const draftCount = threads?.length || 0;
  const urgentCount = urgentThreads?.length || 0;
  const firstName = (user?.user_metadata?.full_name as string)?.split(" ")[0] ||
    (user?.email?.split("@")[0]) || "there";

  useEffect(() => {
    const interval = setInterval(() => {
      setPlaceholderIdx((i) => (i + 1) % PLACEHOLDERS.length);
    }, 3500);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (messages.length > 0) {
      feedEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  const sendMessage = useCallback(async (text: string) => {
    if (!text.trim() || isThinking) return;

    if (text === "/clear") {
      setMessages([]);
      setChatActive(false);
      setInputValue("");
      return;
    }

    if (text === "/briefing") {
      setMessages([]);
      setChatActive(false);
      setInputValue("");
      return;
    }

    setChatActive(true);
    setInputValue("");
    setShowSlash(false);

    const userMsg: ChatMessage = {
      id: `u-${Date.now()}`,
      role: "user",
      text: text.startsWith("/triage") ? "Show me all unread high-priority emails." : text,
    };
    setMessages((prev) => [...prev, userMsg]);
    setIsThinking(true);

    try {
      const res = await fetch("/api/ai/orchestrate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: userMsg.text }),
      });
      const data: AIResponse = await res.json();

      const assistantMsg: ChatMessage = {
        id: `a-${Date.now()}`,
        role: "assistant",
        text: data.textSummary || "",
        widgets: data.widgets,
        citations: data.citations,
      };
      setMessages((prev) => [...prev, assistantMsg]);
    } catch {
      setMessages((prev) => [
        ...prev,
        { id: `a-${Date.now()}`, role: "assistant", text: "Something went wrong. Try again." },
      ]);
    } finally {
      setIsThinking(false);
    }
  }, [isThinking]);

  const handleSubmit = () => {
    if (inputValue.trim()) sendMessage(inputValue);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setInputValue(val);
    setShowSlash(val === "/");
  };

  return (
    <div className="h-screen flex flex-col bg-[#000000]">

      <AnimatePresence mode="wait">
      {/* ═══════ BRIEFING STATE ═══════ */}
      {!chatActive ? (
          <motion.div
            key="briefing"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="flex-1 flex flex-col items-center justify-center px-6"
          >
            {/* Greeting */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
              className="w-full max-w-4xl mb-10"
            >
              <h1 className="text-[32px] font-semibold text-[var(--text-primary)] leading-tight">
                {getGreeting()}, {firstName}.
              </h1>
              <p className="text-sm text-[var(--text-tertiary)] mt-2">
                Here&apos;s what needs your attention.
              </p>
            </motion.div>

            {/* Briefing Cards */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
              className="w-full max-w-4xl grid grid-cols-1 md:grid-cols-3 gap-4 mb-12"
            >
              <BriefingCard
                icon={<FileText size={14} className="text-red-400" />}
                iconColor="bg-red-500/10"
                title="Triage"
                body={
                  draftCount > 0
                    ? `${draftCount} draft${draftCount > 1 ? "s" : ""} waiting for your approval.${urgentCount > 0 ? ` ${urgentCount} urgent.` : ""}`
                    : "No drafts pending. You're all clear."
                }
                action="Review Drafts"
                onAction={() => router.push("/app/inbox?filter=drafts")}
              />
              <BriefingCard
                icon={<Calendar size={14} className="text-blue-400" />}
                iconColor="bg-blue-500/10"
                title="Calendar"
                body="Your next meeting starts soon. Check your schedule."
                action="View Schedule"
                onAction={() => sendMessage("What does my day look like?")}
              />
              <BriefingCard
                icon={<Ghost size={14} className="text-amber-400" />}
                iconColor="bg-amber-500/10"
                title="Follow-ups"
                body="Check if anyone is waiting on your reply."
                action="Draft a friendly bump"
                onAction={() => sendMessage("Who am I waiting on a reply from? Draft a follow-up.")}
              />
            </motion.div>

            {/* Input (centered) */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
              className="w-full max-w-3xl"
            >
              <div className="relative">
                {/* Slash command popup */}
                <AnimatePresence>
                  {showSlash && (
                    <motion.div
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 8 }}
                      className="absolute bottom-full mb-2 left-0 right-0 bg-[#0A0A0A] border border-[rgba(255,255,255,0.1)] rounded-xl backdrop-blur-md overflow-hidden z-10"
                    >
                      {SLASH_COMMANDS.map((cmd) => {
                        const Icon = cmd.icon;
                        return (
                          <button
                            key={cmd.cmd}
                            onClick={() => {
                              setInputValue("");
                              setShowSlash(false);
                              sendMessage(cmd.cmd);
                            }}
                            className="flex items-center gap-3 w-full px-4 py-3 text-left hover:bg-[rgba(255,255,255,0.04)] transition-colors"
                          >
                            <Icon size={14} className="text-[var(--text-tertiary)]" />
                            <span className="text-sm text-[var(--text-primary)] font-mono">{cmd.cmd}</span>
                            <span className="text-xs text-[var(--text-tertiary)] ml-auto">{cmd.label}</span>
                          </button>
                        );
                      })}
                    </motion.div>
                  )}
                </AnimatePresence>

                <div className={`flex items-center min-h-[56px] rounded-full bg-[#0A0A0A] px-5 transition-all duration-200 ${
                  inputFocused
                    ? "border border-[rgba(59,130,246,0.4)] shadow-[0_0_15px_rgba(59,130,246,0.1)]"
                    : "border border-[rgba(255,255,255,0.1)]"
                }`}>
                  <Sparkles size={16} className="text-[var(--aiva-blue)] shrink-0 mr-3" />
                  <input
                    ref={inputRef}
                    value={inputValue}
                    onChange={handleInputChange}
                    onKeyDown={handleKeyDown}
                    onFocus={() => setInputFocused(true)}
                    onBlur={() => setInputFocused(false)}
                    placeholder={PLACEHOLDERS[placeholderIdx]}
                    className="flex-1 bg-transparent text-sm text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] focus:outline-none"
                  />
                  <div className="flex items-center gap-2 ml-3">
                    <button className="h-8 w-8 rounded-full flex items-center justify-center text-[var(--text-tertiary)] hover:text-[var(--text-secondary)] hover:bg-[rgba(255,255,255,0.04)]">
                      <Paperclip size={16} />
                    </button>
                    <button className="h-8 w-8 rounded-full flex items-center justify-center text-[var(--text-tertiary)] hover:text-[var(--text-secondary)] hover:bg-[rgba(255,255,255,0.04)]">
                      <Mic size={16} />
                    </button>
                    <button
                      onClick={handleSubmit}
                      disabled={!inputValue.trim()}
                      className={`h-8 w-8 rounded-full flex items-center justify-center transition-all ${
                        inputValue.trim()
                          ? "bg-blue-500 text-white shadow-[0_0_10px_rgba(59,130,246,0.3)]"
                          : "bg-[rgba(255,255,255,0.05)] text-[var(--text-tertiary)]"
                      }`}
                    >
                      <ArrowUp size={16} />
                    </button>
                  </div>
                </div>
              </div>
              <p className="text-center text-[10px] text-[var(--text-tertiary)] mt-3 font-mono">
                Type <span className="text-[var(--text-secondary)]">/</span> for commands · Press <span className="text-[var(--text-secondary)]">Enter</span> to send
              </p>
            </motion.div>
          </motion.div>
        ) : (
        <motion.div
          key="chat"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.25, ease: "easeOut" }}
          className="flex-1 flex flex-col overflow-hidden"
        >
          {/* Chat feed */}
          <div className="flex-1 overflow-y-auto">
            <div className="max-w-4xl mx-auto px-6">
              {messages.map((msg) => (
                <motion.div
                  key={msg.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                  className={`py-6 ${msg.role === "user" ? "" : "border-b border-[rgba(255,255,255,0.03)]"}`}
                >
                  {msg.role === "user" ? (
                    <div className="flex items-start gap-3">
                      <div className="h-8 w-8 rounded-full bg-blue-500/10 flex items-center justify-center text-xs text-blue-400 shrink-0">
                        {firstName[0]?.toUpperCase() || "?"}
                      </div>
                      <div className="pt-1">
                        <p className="text-[15px] text-[var(--text-primary)] leading-relaxed">{msg.text}</p>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-start gap-3">
                      <div className="h-8 w-8 rounded-full bg-[var(--aiva-blue-glow)] flex items-center justify-center shrink-0">
                        <Sparkles size={14} className="text-[var(--aiva-blue)]" />
                      </div>
                      <div className="flex-1 pt-1 flex flex-col gap-4">
                        {msg.text && (
                          <p className="text-[15px] text-[#F4F4F5] leading-relaxed">
                            {msg.text}
                            {msg.citations && msg.citations.length > 0 && (
                              <span className="inline-flex items-center gap-1 ml-1.5">
                                {msg.citations.map((cite) => (
                                  <CitationPill
                                    key={cite.id}
                                    source={cite.source}
                                    label={cite.source === "gmail" ? "Gmail" : cite.source === "shopify" ? "Shopify" : cite.source}
                                    snippet={cite.snippet}
                                    messageId={cite.id}
                                  />
                                ))}
                              </span>
                            )}
                          </p>
                        )}
                        {msg.widgets && msg.widgets.length > 0 && (
                          <AIResponseRenderer
                            response={{
                              textSummary: "",
                              widgets: msg.widgets,
                              citations: msg.citations || [],
                            }}
                          />
                        )}
                      </div>
                    </div>
                  )}
                </motion.div>
              ))}

              {/* Thinking state */}
              {isThinking && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="py-6"
                >
                  <div className="flex items-start gap-3">
                    <div className="h-8 w-8 rounded-full bg-[var(--aiva-blue-glow)] flex items-center justify-center shrink-0">
                      <Sparkles size={14} className="text-[var(--aiva-blue)]" />
                    </div>
                    <div className="flex-1 pt-1">
                      <ResearchingState integrations={["gmail", "slack", "shopify"]} />
                    </div>
                  </div>
                </motion.div>
              )}

              <div ref={feedEndRef} />
            </div>
          </div>

          {/* Input (docked bottom) */}
          <div className="border-t border-[rgba(255,255,255,0.06)] bg-[#000000] px-6 py-4">
            <div className="max-w-3xl mx-auto relative">
              <AnimatePresence>
                {showSlash && (
                  <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 8 }}
                    className="absolute bottom-full mb-2 left-0 right-0 bg-[#0A0A0A] border border-[rgba(255,255,255,0.1)] rounded-xl backdrop-blur-md overflow-hidden z-10"
                  >
                    {SLASH_COMMANDS.map((cmd) => {
                      const Icon = cmd.icon;
                      return (
                        <button
                          key={cmd.cmd}
                          onClick={() => {
                            setInputValue("");
                            setShowSlash(false);
                            sendMessage(cmd.cmd);
                          }}
                          className="flex items-center gap-3 w-full px-4 py-3 text-left hover:bg-[rgba(255,255,255,0.04)] transition-colors"
                        >
                          <Icon size={14} className="text-[var(--text-tertiary)]" />
                          <span className="text-sm text-[var(--text-primary)] font-mono">{cmd.cmd}</span>
                          <span className="text-xs text-[var(--text-tertiary)] ml-auto">{cmd.label}</span>
                        </button>
                      );
                    })}
                  </motion.div>
                )}
              </AnimatePresence>

              <div className={`flex items-center min-h-[56px] rounded-full bg-[#0A0A0A] px-5 transition-all duration-200 ${
                inputFocused
                  ? "border border-[rgba(59,130,246,0.4)] shadow-[0_0_15px_rgba(59,130,246,0.1)]"
                  : "border border-[rgba(255,255,255,0.1)]"
              }`}>
                <Sparkles size={16} className="text-[var(--aiva-blue)] shrink-0 mr-3" />
                <input
                  ref={inputRef}
                  value={inputValue}
                  onChange={handleInputChange}
                  onKeyDown={handleKeyDown}
                  onFocus={() => setInputFocused(true)}
                  onBlur={() => setInputFocused(false)}
                  placeholder="Ask AIVA anything…"
                  className="flex-1 bg-transparent text-sm text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] focus:outline-none"
                />
                <div className="flex items-center gap-2 ml-3">
                  <button className="h-8 w-8 rounded-full flex items-center justify-center text-[var(--text-tertiary)] hover:text-[var(--text-secondary)] hover:bg-[rgba(255,255,255,0.04)]">
                    <Paperclip size={16} />
                  </button>
                  <button className="h-8 w-8 rounded-full flex items-center justify-center text-[var(--text-tertiary)] hover:text-[var(--text-secondary)] hover:bg-[rgba(255,255,255,0.04)]">
                    <Mic size={16} />
                  </button>
                  <button
                    onClick={handleSubmit}
                    disabled={!inputValue.trim() || isThinking}
                    className={`h-8 w-8 rounded-full flex items-center justify-center transition-all ${
                      inputValue.trim() && !isThinking
                        ? "bg-blue-500 text-white shadow-[0_0_10px_rgba(59,130,246,0.3)]"
                        : "bg-[rgba(255,255,255,0.05)] text-[var(--text-tertiary)]"
                    }`}
                  >
                    <ArrowUp size={16} />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
