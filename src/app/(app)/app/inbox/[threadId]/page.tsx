"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Avatar, Badge, ProgressBar, LoadingBar } from "@/components/ui";
import { linearFadeIn, staggerContainer, staggerItem } from "@/lib/animations";
import {
  fetchThread, fetchMessages, fetchDraft,
  fetchShopifyCustomer, fetchShopifyOrders, fetchContact,
} from "@/lib/supabase/queries";
import { useSupabaseQuery } from "@/hooks/use-supabase-query";
import { AIResponseRenderer } from "@/components/widgets";
import { EmptyStateHook } from "@/components/app/empty-state-hook";
import { useIntegrations } from "@/hooks/use-integrations";
import type { AIResponse, ShopifyWidgetData } from "@/types";
import {
  ArrowLeft, Send, X, Sparkles, Lock, MailX,
  Archive, MailOpen, Trash2, User,
  ClipboardCopy, ExternalLink, Plus, StickyNote, Ban,
  ChevronDown, ChevronRight, Tag,
} from "lucide-react";
import Link from "next/link";

type ContextState = "ecommerce" | "standard" | "promo";

function getInitials(name?: string): string {
  if (!name) return "?";
  return name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase();
}

function formatMessageTime(dateStr: string): string {
  const d = new Date(dateStr);
  const now = new Date();
  const isToday = d.toDateString() === now.toDateString();
  if (isToday) return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  return d.toLocaleDateString([], { month: "short", day: "numeric" }) + " " +
    d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

const PROMO_DOMAINS = [
  "noreply", "no-reply", "no_reply", "do-not-reply", "do_not_reply", "donotreply",
  "notifications", "news", "updates", "marketing", "promo", "deals", "offers",
  "newsletter", "recommendations", "info@", "mailer-daemon", "bounce",
  "smailer", "mailer", "digest", "announce", "campaign", "bulk",
];

function classifySender(email: string, hasShopify: boolean): ContextState {
  if (hasShopify) return "ecommerce";
  const lower = email.toLowerCase();
  if (PROMO_DOMAINS.some((d) => lower.includes(d))) return "promo";
  return "standard";
}

export default function ConversationPage() {
  const params = useParams();
  const router = useRouter();
  const { isConnected } = useIntegrations();
  const threadId = params.threadId as string;

  const { data: thread, isLoading: threadLoading } = useSupabaseQuery(
    () => fetchThread(threadId), [threadId]
  );
  const { data: messages, isLoading: messagesLoading } = useSupabaseQuery(
    () => fetchMessages(threadId), [threadId]
  );
  const { data: draft } = useSupabaseQuery(
    () => fetchDraft(threadId), [threadId]
  );

  const senderEmail = messages?.[0]?.sender_email || "";
  const senderName = messages?.[0]?.sender_name || "Unknown";

  const { data: shopifyCustomer } = useSupabaseQuery(
    () => senderEmail ? fetchShopifyCustomer(senderEmail) : Promise.resolve(null),
    [senderEmail]
  );
  const { data: shopifyOrders } = useSupabaseQuery(
    () => senderEmail ? fetchShopifyOrders(senderEmail) : Promise.resolve([]),
    [senderEmail]
  );
  const { data: contact } = useSupabaseQuery(
    () => senderEmail ? fetchContact(senderEmail) : Promise.resolve(null),
    [senderEmail]
  );

  const [draftText, setDraftText] = useState("");
  const [activeTone, setActiveTone] = useState("Professional");
  const [isSending, setIsSending] = useState(false);
  const [isRewriting, setIsRewriting] = useState(false);
  const [aiResponse, setAiResponse] = useState<AIResponse | null>(null);
  const [mobileCrmOpen, setMobileCrmOpen] = useState(false);
  const [expandedMessages, setExpandedMessages] = useState<Set<string>>(new Set());
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null);
  const [draftFocused, setDraftFocused] = useState(false);
  const [sendToast, setSendToast] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const draftRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (draft?.content) setDraftText(draft.content);
  }, [draft]);

  useEffect(() => {
    if (!shopifyOrders || shopifyOrders.length === 0) return;
    const order = shopifyOrders[0];
    const widget: ShopifyWidgetData = {
      type: "SHOPIFY_CARD",
      data: {
        orderId: order.shopify_order_id || "",
        orderName: order.order_name || `#${order.shopify_order_id}`,
        customerName: shopifyCustomer?.shopify_customer_id || "",
        financialStatus: "paid",
        fulfillmentStatus: (order.fulfillment_status as "fulfilled" | "unfulfilled" | "partial") || "unfulfilled",
        totalPrice: order.total_price || "0.00",
        currency: "$",
        lineItems: (order.line_items_summary as Array<{ title: string; qty: number }> || []).map((item) => ({
          title: item.title,
          quantity: item.qty,
          price: "0.00",
        })),
      },
    };
    setAiResponse({
      textSummary: `Found ${shopifyOrders.length} order(s) for this customer.`,
      widgets: [widget],
      citations: [{ id: order.id || "shopify", source: "shopify", snippet: order.order_name || "" }],
    });
  }, [shopifyOrders, shopifyCustomer]);

  useEffect(() => {
    if (messages && messages.length > 0) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  const confidenceScore = draft?.confidence_score || thread?.confidence_score || 0;

  const hasShopify = !!(shopifyCustomer && shopifyOrders && shopifyOrders.length > 0);
  const contextState = classifySender(senderEmail, hasShopify);

  const handleSend = useCallback(async () => {
    if (!draftText || isSending) return;
    setIsSending(true);
    setSendToast(null);
    try {
      const res = await fetch("/api/integrations/send-message", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          threadId,
          finalText: draftText,
          originalAIVADraft: draft?.content || "",
          channel: thread?.provider || "GMAIL",
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setSendToast({ type: "error", message: data.error || "Failed to send message" });
        setIsSending(false);
        return;
      }
      setSendToast({ type: "success", message: "Message sent successfully" });
      setTimeout(() => router.push("/app/inbox"), 1200);
    } catch (err) {
      setSendToast({ type: "error", message: String(err) });
      setIsSending(false);
    }
  }, [draftText, isSending, threadId, draft, thread, router]);

  const handleToneChange = async (tone: string) => {
    if (tone === activeTone || isRewriting) return;
    setActiveTone(tone);
    setIsRewriting(true);
    try {
      const res = await fetch("/api/ai/rewrite-draft", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ draft: draftText, tone }),
      });

      const contentType = res.headers.get("content-type") || "";
      if (contentType.includes("text/event-stream")) {
        const reader = res.body?.getReader();
        const decoder = new TextDecoder();
        let result = "";
        if (reader) {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            const chunk = decoder.decode(value);
            const lines = chunk.split("\n").filter((l) => l.startsWith("data: "));
            for (const line of lines) {
              const payload = line.slice(6);
              if (payload === "[DONE]") break;
              try {
                const parsed = JSON.parse(payload);
                if (parsed.text) result += parsed.text;
              } catch { /* skip malformed */ }
            }
          }
        }
        if (result) setDraftText(result);
      } else {
        const data = await res.json();
        if (data.draft) setDraftText(data.draft);
      }
    } catch { /* keep current draft */ } finally {
      setIsRewriting(false);
    }
  };

  const toggleMessageExpand = (msgId: string) => {
    setExpandedMessages((prev) => {
      const next = new Set(prev);
      if (next.has(msgId)) next.delete(msgId);
      else next.add(msgId);
      return next;
    });
  };

  const isLoading = threadLoading || messagesLoading;

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLTextAreaElement) return;
      if ((e.metaKey || e.ctrlKey) && e.key === "Enter" && draftText) {
        handleSend();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [draftText, handleSend]);

  const ltv = shopifyCustomer?.total_spent ? Number(shopifyCustomer.total_spent) : 0;
  const ordersCount = shopifyCustomer?.orders_count || 0;

  return (
    <div className="h-screen flex flex-col bg-[#000000]">
      {isLoading && <LoadingBar />}

      {/* ───────── THREAD HEADER — 64px strict ───────── */}
      <div className="h-16 flex items-center px-6 border-b border-[rgba(255,255,255,0.06)] shrink-0">
        <Link
          href="/app/inbox"
          className="lg:hidden h-8 w-8 rounded-lg flex items-center justify-center text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[rgba(255,255,255,0.04)] mr-3"
        >
          <ArrowLeft size={16} />
        </Link>

        <div className="flex-1 min-w-0">
          <h1 className="text-[var(--text-primary)] font-semibold text-lg truncate leading-tight">
            {thread?.subject || "Loading…"}
          </h1>
          <div className="flex items-center gap-2 mt-0.5">
            {thread?.priority && (
              <span className="bg-[rgba(255,255,255,0.1)] text-[var(--text-secondary)] text-[10px] font-mono px-2 py-0.5 rounded">
                {thread.priority}
              </span>
            )}
            <span className="text-[var(--text-tertiary)] text-[10px] font-mono">
              via {thread?.provider || "…"}
            </span>
          </div>
        </div>

        {confidenceScore > 0 && (
          <div className="hidden sm:flex items-center gap-2 mr-4">
            <ProgressBar value={confidenceScore * 100} />
            <span className="text-[10px] font-mono text-[var(--text-tertiary)] whitespace-nowrap">
              {Math.round(confidenceScore * 100)}% confidence
            </span>
          </div>
        )}

        <div className="flex items-center gap-1">
          <button className="h-8 w-8 rounded-lg flex items-center justify-center text-[var(--text-tertiary)] hover:text-[var(--text-primary)] hover:bg-[rgba(255,255,255,0.04)]" title="Archive">
            <Archive size={16} />
          </button>
          <button className="h-8 w-8 rounded-lg flex items-center justify-center text-[var(--text-tertiary)] hover:text-[var(--text-primary)] hover:bg-[rgba(255,255,255,0.04)]" title="Mark unread">
            <MailOpen size={16} />
          </button>
          <button className="h-8 w-8 rounded-lg flex items-center justify-center text-[var(--text-tertiary)] hover:text-[var(--text-primary)] hover:bg-[rgba(255,255,255,0.04)]" title="Delete">
            <Trash2 size={16} />
          </button>
          <button
            onClick={() => setMobileCrmOpen(!mobileCrmOpen)}
            className="xl:hidden h-8 w-8 rounded-lg flex items-center justify-center text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[rgba(255,255,255,0.04)]"
          >
            <User size={16} />
          </button>
        </div>
      </div>

      {/* ───────── SPLIT VIEW: Thread + Context Panel ───────── */}
      <div className="flex-1 flex overflow-hidden">

        {/* ═══════ CENTER PANE ═══════ */}
        <div className="flex-1 flex flex-col overflow-hidden bg-[#000000]">

          {/* ── Message Feed ── */}
          <div className={`flex-1 overflow-y-auto transition-opacity duration-200 ${isLoading ? "opacity-40" : ""}`}>
            <motion.div variants={staggerContainer} initial="hidden" animate="visible">
              {(messages || []).map((msg) => {
                const bodyText = msg.body_plain || msg.body || "";
                const isLong = bodyText.length > 300;
                const isExpanded = expandedMessages.has(msg.id);

                return (
                  <motion.div
                    key={msg.id}
                    variants={staggerItem}
                    className="py-6 px-6 border-b border-[rgba(255,255,255,0.03)]"
                  >
                    {/* Sender meta row */}
                    <div className="flex items-center">
                      <div className="h-8 w-8 rounded-full bg-zinc-900 flex items-center justify-center text-xs text-[var(--text-secondary)] shrink-0">
                        {getInitials(msg.sender_name)}
                      </div>
                      <span className="text-[var(--text-primary)] font-medium text-sm ml-3">
                        {msg.sender_name || "Unknown"}
                      </span>
                      <span className="text-[var(--text-tertiary)] font-mono text-xs ml-auto">
                        {(msg.created_at || msg.timestamp) ? formatMessageTime(msg.created_at || msg.timestamp) : ""}
                      </span>
                    </div>

                    {/* Message body — indented to align with name */}
                    <div className="mt-3 ml-11">
                      <p className={`text-sm text-[var(--text-secondary)] leading-relaxed whitespace-pre-wrap ${
                        isLong && !isExpanded ? "message-body-clamped" : ""
                      }`}>
                        {bodyText}
                      </p>
                      {isLong && (
                        <button
                          onClick={() => toggleMessageExpand(msg.id)}
                          className="mt-2 text-xs text-[var(--text-tertiary)] hover:text-[var(--text-secondary)] transition-colors"
                        >
                          {isExpanded ? "[ Show Less ]" : "[ Read More ]"}
                        </button>
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </motion.div>

            {/* AI widget */}
            {aiResponse && (
              <motion.div variants={linearFadeIn} initial="hidden" animate="visible" className="py-6 px-6 border-b border-[rgba(255,255,255,0.03)]">
                <div className="flex items-center">
                  <div className="h-8 w-8 rounded-full bg-[var(--aiva-blue-glow)] flex items-center justify-center shrink-0">
                    <Sparkles size={14} className="text-[var(--aiva-blue)]" />
                  </div>
                  <span className="text-[var(--text-primary)] font-medium text-sm ml-3">AIVA</span>
                  <span className="text-[var(--text-tertiary)] font-mono text-xs ml-auto">context resolved</span>
                </div>
                <div className="mt-3 ml-11">
                  <AIResponseRenderer response={aiResponse} />
                </div>
              </motion.div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* ── AI DRAFT ENGINE ── */}
          <div
            ref={draftRef}
            className={`relative bg-[#0A0A0A] p-4 transition-colors duration-200 ${
              draftFocused
                ? "border-t border-[rgba(59,130,246,0.5)]"
                : "border-t border-[rgba(255,255,255,0.08)]"
            }`}
          >
            {/* Loading bar for tone rewrite */}
            {isRewriting && <div className="draft-loading-bar" />}

            {/* Tone pills */}
            <div className="flex gap-2 mb-3">
              {["Friendly", "Professional", "Brief"].map((tone) => (
                <button
                  key={tone}
                  onClick={() => handleToneChange(tone)}
                  disabled={isRewriting}
                  className={`border rounded-full px-3 py-1 text-xs transition-all duration-150 ${
                    activeTone === tone
                      ? "bg-[rgba(59,130,246,0.1)] border-[#3B82F6] text-[#3B82F6]"
                      : "border-[rgba(255,255,255,0.1)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:border-[rgba(255,255,255,0.2)]"
                  } disabled:opacity-50`}
                >
                  {tone}
                </button>
              ))}
            </div>

            {/* Text editor */}
            <textarea
              value={draftText}
              onChange={(e) => setDraftText(e.target.value)}
              onFocus={() => setDraftFocused(true)}
              onBlur={() => setDraftFocused(false)}
              className={`w-full min-h-[80px] bg-transparent text-sm text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] focus:outline-none focus:ring-0 resize-none leading-relaxed border-none transition-opacity duration-200 ${
                isRewriting ? "opacity-50" : ""
              }`}
              placeholder="Write your reply, or ask AIVA to draft something…"
            />

            {/* Action footer */}
            <div className="flex items-center justify-between mt-3">
              <button
                onClick={() => setDraftText("")}
                className="text-red-400 hover:bg-red-400/10 px-3 py-1.5 rounded text-sm flex items-center gap-2 transition-colors"
              >
                <X size={14} />
                Discard
              </button>

              <div className="flex items-center gap-2">
                <button
                  className="h-8 w-8 rounded-lg flex items-center justify-center text-[var(--text-tertiary)] hover:text-[var(--text-secondary)] hover:bg-[rgba(255,255,255,0.04)] transition-colors"
                  title="Auto-send trainer"
                >
                  <Lock size={14} />
                </button>

                <button
                  onClick={handleSend}
                  disabled={isSending || !draftText}
                  className="bg-[#3B82F6] text-white font-medium text-sm px-4 py-2 rounded-md shadow-[0_0_15px_rgba(59,130,246,0.2)] hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  <Send size={14} />
                  {isSending ? "Sending…" : "Approve & Send"}
                  <kbd className="text-[9px] font-mono opacity-60">⌘↵</kbd>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* ═══════ DYNAMIC CONTEXT PANEL — 320px ═══════ */}
        <AnimatePresence>
          <div className={`${
            mobileCrmOpen
              ? "fixed inset-0 z-50 bg-[#050505]"
              : "hidden"
          } xl:relative xl:flex w-full xl:w-[320px] border-l border-[rgba(255,255,255,0.06)] bg-[#050505] flex-col overflow-y-auto`}>

            {/* Mobile close */}
            {mobileCrmOpen && (
              <div className="xl:hidden flex items-center justify-between px-4 py-3 border-b border-[rgba(255,255,255,0.06)]">
                <span className="text-sm font-medium text-[var(--text-primary)]">Contact</span>
                <button onClick={() => setMobileCrmOpen(false)} className="text-[var(--text-tertiary)] hover:text-[var(--text-primary)]">
                  <X size={16} />
                </button>
              </div>
            )}

            {/* ── 5.1 Identity Header (Always Visible) ── */}
            <div className="p-6 border-b border-[rgba(255,255,255,0.06)] flex flex-col items-center text-center">
              <div className="h-16 w-16 rounded-full bg-zinc-800 flex items-center justify-center text-2xl text-[var(--text-secondary)] mt-2">
                {getInitials(senderName)}
              </div>
              <p className="text-[var(--text-primary)] font-medium text-lg mt-4">
                {senderName}
              </p>
              <p className="text-[var(--text-tertiary)] text-sm font-mono mt-1">
                {senderEmail}
              </p>
            </div>

            {/* ── 5.2 E-Commerce / Shopify ── */}
            {contextState === "ecommerce" && (
              <motion.div variants={linearFadeIn} initial="hidden" animate="visible">
                {/* LTV Badge */}
                {ltv > 0 && (
                  <div className="bg-[rgba(34,197,94,0.1)] text-green-400 border border-green-500/20 rounded px-3 py-2 font-mono text-center mx-6 mt-4 text-sm">
                    LTV: ${ltv.toFixed(2)}
                  </div>
                )}

                {/* Orders */}
                <div className="px-6 py-4">
                  <h3 className="text-[11px] font-semibold tracking-wider uppercase text-[var(--text-tertiary)] mb-3">
                    Recent Orders
                  </h3>
                  <div className="space-y-2">
                    {(shopifyOrders || []).map((order) => {
                      const isOExpanded = expandedOrder === order.id;
                      return (
                        <div key={order.id} className="rounded-lg border border-[rgba(255,255,255,0.06)]">
                          <button
                            onClick={() => setExpandedOrder(isOExpanded ? null : order.id)}
                            className="flex items-center justify-between w-full p-3 text-left hover:bg-[rgba(255,255,255,0.04)] transition-colors"
                          >
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-mono text-[var(--text-primary)]">
                                {order.order_name || `#${order.shopify_order_id}`}
                              </span>
                              <span className="text-[10px] text-[var(--text-tertiary)]">
                                {order.created_at ? new Date(order.created_at).toLocaleDateString([], { month: "short", day: "numeric" }) : ""}
                              </span>
                            </div>
                            <div className="flex items-center gap-1.5">
                              <div className={`w-1.5 h-1.5 rounded-full ${
                                order.fulfillment_status === "fulfilled" ? "bg-[var(--status-success)]" : "bg-[var(--status-warning)]"
                              }`} />
                              <span className="text-[10px] text-[var(--text-tertiary)]">
                                {order.fulfillment_status === "fulfilled" ? "Fulfilled" : "Unfulfilled"}
                              </span>
                              {isOExpanded
                                ? <ChevronDown size={12} className="text-[var(--text-tertiary)]" />
                                : <ChevronRight size={12} className="text-[var(--text-tertiary)]" />
                              }
                            </div>
                          </button>
                          {isOExpanded && (
                            <div className="px-3 pb-3 border-t border-[rgba(255,255,255,0.06)]">
                              {order.line_items_summary && (
                                <div className="pt-2 space-y-1">
                                  {(order.line_items_summary as Array<{ title: string; qty: number }>).map((item, i) => (
                                    <p key={i} className="text-[10px] font-mono text-[var(--text-secondary)]">
                                      {item.qty}x {item.title}
                                    </p>
                                  ))}
                                </div>
                              )}
                              <div className="flex justify-between items-center mt-2 pt-2 border-t border-[rgba(255,255,255,0.06)]">
                                <span className="text-xs font-mono text-[var(--text-primary)]">${order.total_price}</span>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* E-commerce actions */}
                <div className="px-6 pb-4 mt-auto space-y-1">
                  <button className="w-full flex items-center gap-3 h-8 px-3 rounded-md text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[rgba(255,255,255,0.04)] transition-colors">
                    <ClipboardCopy size={14} /> Copy Tracking Link
                  </button>
                  <button className="w-full flex items-center gap-3 h-8 px-3 rounded-md text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[rgba(255,255,255,0.04)] transition-colors">
                    <ExternalLink size={14} /> Open in Shopify
                  </button>
                </div>
              </motion.div>
            )}

            {/* ── 5.3 Standard Contact / B2B ── */}
            {contextState === "standard" && (
              <motion.div variants={linearFadeIn} initial="hidden" animate="visible">
                <div className="px-6 py-4">
                  <h3 className="text-[11px] font-semibold tracking-wider uppercase text-[var(--text-tertiary)] mb-3">
                    Relationship
                  </h3>
                  <div className="space-y-2 text-sm text-[var(--text-secondary)]">
                    <p>
                      Last interacted{" "}
                      <span className="text-[var(--text-primary)] font-mono text-xs">
                        {contact?.last_interaction_at
                          ? `${Math.floor((Date.now() - new Date(contact.last_interaction_at).getTime()) / 86400000)}d ago`
                          : "—"}
                      </span>
                    </p>
                    <p>
                      Messages exchanged{" "}
                      <span className="text-[var(--text-primary)] font-mono text-xs">
                        {contact?.interaction_count || 0}
                      </span>
                    </p>
                  </div>

                  {/* CRM tags */}
                  <div className="flex flex-wrap gap-1.5 mt-4">
                    {(contact?.tags as string[] || []).map((tag: string, i: number) => (
                      <span
                        key={i}
                        className="inline-flex items-center gap-1 bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.1)] text-[10px] text-[var(--text-secondary)] px-2 py-0.5 rounded-full"
                      >
                        <Tag size={8} /> {tag}
                      </span>
                    ))}
                    <button className="inline-flex items-center gap-1 text-[10px] text-[var(--text-tertiary)] hover:text-[var(--text-secondary)] px-2 py-0.5 rounded-full border border-dashed border-[rgba(255,255,255,0.1)] hover:border-[rgba(255,255,255,0.2)] transition-colors">
                      <Plus size={8} /> Add tag
                    </button>
                  </div>
                </div>

                {/* Standard actions */}
                <div className="px-6 pb-4 mt-auto space-y-1">
                  <button className="w-full flex items-center gap-3 h-8 px-3 rounded-md text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[rgba(255,255,255,0.04)] transition-colors">
                    <Plus size={14} /> Create Task
                  </button>
                  <button className="w-full flex items-center gap-3 h-8 px-3 rounded-md text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[rgba(255,255,255,0.04)] transition-colors">
                    <StickyNote size={14} /> Add Note
                  </button>
                  <button className="w-full flex items-center gap-3 h-8 px-3 rounded-md text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[rgba(255,255,255,0.04)] transition-colors">
                    <Ban size={14} /> Block Sender
                  </button>
                </div>

                {!isConnected("shopify") && (
                  <div className="px-4 pb-4">
                    <EmptyStateHook type="CRM" contactName={senderName} />
                  </div>
                )}
              </motion.div>
            )}

            {/* ── 5.4 Promotional / Noise ── */}
            {contextState === "promo" && (
              <motion.div variants={linearFadeIn} initial="hidden" animate="visible" className="flex-1 flex flex-col">
                <div className="px-6 py-6 flex-1">
                  <p className="text-sm text-[var(--text-tertiary)]">
                    This appears to be a promotional or automated email.
                  </p>
                </div>
                <div className="px-6 pb-6">
                  <button className="w-full flex items-center justify-center gap-2 h-10 rounded-md border border-[rgba(255,255,255,0.1)] text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[rgba(255,255,255,0.04)] hover:border-[rgba(255,255,255,0.2)] transition-colors">
                    <MailX size={16} />
                    Unsubscribe & Archive
                  </button>
                </div>
              </motion.div>
            )}
          </div>
        </AnimatePresence>
      </div>

      <AnimatePresence>
        {sendToast && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 16 }}
            className={`fixed bottom-6 right-6 z-50 px-4 py-3 rounded-lg text-sm font-medium shadow-xl backdrop-blur-sm ${
              sendToast.type === "success"
                ? "bg-green-500/10 border border-green-500/20 text-green-400"
                : "bg-red-500/10 border border-red-500/20 text-red-400"
            }`}
            onAnimationComplete={() => {
              if (sendToast.type === "success") return;
              setTimeout(() => setSendToast(null), 4000);
            }}
          >
            {sendToast.message}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
