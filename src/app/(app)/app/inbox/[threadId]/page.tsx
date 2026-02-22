"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Button, Badge, Avatar, ProgressBar, LoadingBar } from "@/components/ui";
import { linearFadeIn } from "@/lib/animations";
import { fetchThread, fetchMessages, fetchDraft, fetchShopifyCustomer, fetchShopifyOrders } from "@/lib/supabase/queries";
import { useSupabaseQuery } from "@/hooks/use-supabase-query";
import { AIResponseRenderer } from "@/components/widgets";
import type { AIResponse, ShopifyWidgetData } from "@/types";
import {
  ArrowLeft, Send, X, Sparkles, Lock,
  ExternalLink, Copy, User,
} from "lucide-react";
import Link from "next/link";

export default function ConversationPage() {
  const params = useParams();
  const router = useRouter();
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
  const { data: shopifyCustomer } = useSupabaseQuery(
    () => senderEmail ? fetchShopifyCustomer(senderEmail) : Promise.resolve(null),
    [senderEmail]
  );
  const { data: shopifyOrders } = useSupabaseQuery(
    () => senderEmail ? fetchShopifyOrders(senderEmail) : Promise.resolve([]),
    [senderEmail]
  );

  const [draftText, setDraftText] = useState("");
  const [activeTone, setActiveTone] = useState("Professional");
  const [isSending, setIsSending] = useState(false);
  const [aiResponse, setAiResponse] = useState<AIResponse | null>(null);
  const [mobileCrmOpen, setMobileCrmOpen] = useState(false);

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

  const confidenceScore = draft?.confidence_score || thread?.confidence_score || 0;

  const handleSend = async () => {
    setIsSending(true);
    try {
      await fetch("/api/integrations/send-message", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          threadId,
          finalText: draftText,
          originalAIVADraft: draft?.content || "",
          channel: thread?.provider || "GMAIL",
        }),
      });
      router.push("/app/inbox");
    } catch {
      setIsSending(false);
    }
  };

  const handleToneChange = async (tone: string) => {
    setActiveTone(tone);
    try {
      const res = await fetch("/api/ai/rewrite-draft", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ draft: draftText, tone }),
      });
      const data = await res.json();
      if (data.draft) setDraftText(data.draft);
    } catch { /* keep current draft */ }
  };

  const isLoading = threadLoading || messagesLoading;

  // Keyboard: Cmd+Enter to send
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "Enter" && draftText) {
        handleSend();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  });

  return (
    <div className="h-screen flex flex-col">
      {isLoading && <LoadingBar />}

      {/* Header */}
      <div className="h-14 border-b border-[var(--border-subtle)] px-4 flex items-center gap-3 shrink-0">
        <Link
          href="/app/inbox"
          className="lg:hidden h-8 w-8 rounded-lg flex items-center justify-center text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-hover)]"
        >
          <ArrowLeft size={16} />
        </Link>
        <div className="flex-1 min-w-0">
          <h1 className="text-sm font-medium text-[var(--text-primary)] truncate">
            {thread?.subject || "Loading..."}
          </h1>
          <div className="flex items-center gap-2">
            {thread?.priority && (
              <Badge variant={thread.priority === "URGENT" ? "urgent" : thread.priority === "HIGH" ? "high" : "default"} size="sm">
                {thread.priority}
              </Badge>
            )}
            <span className="text-xs text-[var(--text-tertiary)]">via {thread?.provider || "..."}</span>
          </div>
        </div>
        {confidenceScore > 0 && (
          <Badge variant="blue" size="md" className="font-mono hidden sm:inline-flex">
            Auto-Send Confidence: {Math.round(confidenceScore * 100)}%
          </Badge>
        )}
        <button
          onClick={() => setMobileCrmOpen(!mobileCrmOpen)}
          className="xl:hidden h-8 w-8 rounded-lg flex items-center justify-center text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-hover)]"
        >
          <User size={16} />
        </button>
      </div>

      {/* Split view: Thread + CRM panel */}
      <div className="flex-1 flex overflow-hidden">
        {/* Thread + Draft */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Messages */}
          <div className={`flex-1 overflow-y-auto p-6 space-y-4 transition-opacity ${isLoading ? "opacity-50" : ""}`}>
            {(messages || []).map((msg) => (
              <motion.div
                key={msg.id}
                variants={linearFadeIn}
                initial="hidden"
                animate="visible"
                className={`max-w-lg ${msg.direction === "OUTBOUND" ? "ml-auto" : ""}`}
              >
                <div className="flex items-center gap-2 mb-1.5">
                  <Avatar initials={msg.sender_name?.split(" ").map((n: string) => n[0]).join("").slice(0, 2) || "?"} size="sm" />
                  <span className="text-xs font-medium text-[var(--text-primary)]">{msg.sender_name}</span>
                  <span className="text-[10px] text-[var(--text-tertiary)]">
                    {msg.created_at ? new Date(msg.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : ""}
                  </span>
                </div>
                <div className="rounded-lg border border-[var(--border-subtle)] bg-[var(--background-elevated)] p-4">
                  <p className="text-sm text-[var(--text-secondary)] leading-relaxed whitespace-pre-wrap">
                    {msg.body_plain || ""}
                  </p>
                </div>
              </motion.div>
            ))}

            {/* Dynamic AI widget rendering */}
            {aiResponse && (
              <motion.div variants={linearFadeIn} initial="hidden" animate="visible" className="max-w-lg">
                <div className="flex items-center gap-2 mb-1.5">
                  <div className="h-6 w-6 rounded-full bg-[var(--aiva-blue-glow)] flex items-center justify-center">
                    <Sparkles size={10} className="text-[var(--aiva-blue)]" />
                  </div>
                  <span className="text-xs font-medium text-[var(--text-primary)]">AIVA</span>
                  <span className="text-[10px] text-[var(--text-tertiary)]">context resolved</span>
                </div>
                <AIResponseRenderer response={aiResponse} />
              </motion.div>
            )}
          </div>

          {/* AI Draft Box */}
          <div className="border-t border-[var(--border-subtle)] bg-[var(--background-elevated)]">
            {confidenceScore > 0 && (
              <div className="px-4 pt-3">
                <ProgressBar value={confidenceScore * 100} />
                <p className="text-[10px] text-[var(--text-tertiary)] mt-1">
                  Auto-Send Confidence: {Math.round(confidenceScore * 100)}%
                  {confidenceScore >= 0.85 ? " · Safe to auto-send" : " · Manual review required"}
                </p>
              </div>
            )}

            <div className="px-4 pt-3 flex gap-2">
              {["Friendly", "Professional", "Brief"].map((tone) => (
                <button
                  key={tone}
                  onClick={() => handleToneChange(tone)}
                  className={`text-[10px] font-medium px-2.5 py-1 rounded-md border transition-all duration-150 ${
                    activeTone === tone
                      ? "border-[var(--aiva-blue-border)] text-[var(--aiva-blue)] bg-[var(--aiva-blue-glow)]"
                      : "border-[var(--border-subtle)] text-[var(--text-tertiary)] hover:text-[var(--text-secondary)] hover:border-[var(--border-glow)]"
                  }`}
                >
                  {tone}
                </button>
              ))}
            </div>

            <div className="p-4">
              <textarea
                value={draftText}
                onChange={(e) => setDraftText(e.target.value)}
                className="w-full min-h-[80px] bg-transparent text-sm text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] focus:outline-none resize-none leading-relaxed"
                placeholder="Write your reply..."
              />
            </div>

            <div className="px-4 pb-4 flex items-center justify-between">
              <Button variant="ghost" size="sm" onClick={() => setDraftText("")}>
                <X size={14} /> Discard
              </Button>
              <div className="flex items-center gap-2">
                <button className="h-8 w-8 rounded-lg flex items-center justify-center text-[var(--text-tertiary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-hover)]">
                  <Lock size={14} />
                </button>
                <Button variant="blue" size="md" onClick={handleSend} disabled={isSending || !draftText}>
                  <Send size={14} />
                  {isSending ? "Sending..." : "Approve & Send"}
                  <kbd className="text-[9px] font-mono opacity-60 ml-1">⌘↵</kbd>
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* CRM Panel */}
        <div className={`${mobileCrmOpen ? "fixed inset-0 z-50 bg-[var(--background-elevated)]" : "hidden"} xl:relative xl:flex w-full xl:w-[300px] border-l border-[var(--border-subtle)] bg-[var(--background-elevated)] flex-col overflow-y-auto`}>
          {mobileCrmOpen && (
            <div className="xl:hidden flex items-center justify-between px-4 py-3 border-b border-[var(--border-subtle)]">
              <span className="text-sm font-medium text-[var(--text-primary)]">Customer Details</span>
              <button onClick={() => setMobileCrmOpen(false)} className="text-[var(--text-tertiary)] hover:text-[var(--text-primary)]">
                <X size={16} />
              </button>
            </div>
          )}
          <div className="p-4 border-b border-[var(--border-subtle)]">
            <div className="flex items-center gap-3 mb-3">
              <Avatar
                initials={messages?.[0]?.sender_name?.split(" ").map((n: string) => n[0]).join("").slice(0, 2) || "?"}
                size="lg"
              />
              <div>
                <p className="text-sm font-medium text-[var(--text-primary)]">
                  {messages?.[0]?.sender_name || "Unknown"}
                </p>
                <p className="text-xs text-[var(--text-tertiary)]">{senderEmail}</p>
              </div>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              {shopifyCustomer?.total_spent && (
                <Badge variant="outline" className="font-mono text-[var(--status-warning)]">
                  ${Number(shopifyCustomer.total_spent).toFixed(2)} LTV
                </Badge>
              )}
              {shopifyCustomer?.orders_count && (
                <Badge variant="outline">
                  {shopifyCustomer.orders_count > 5 ? "VIP" : shopifyCustomer.orders_count > 1 ? "Returning" : "New"} Customer
                </Badge>
              )}
            </div>
          </div>

          {shopifyOrders && shopifyOrders.length > 0 && (
            <div className="p-4">
              <h3 className="text-[10px] font-medium uppercase tracking-[0.06em] text-[var(--text-tertiary)] mb-3">
                Order History
              </h3>
              <div className="space-y-2">
                {shopifyOrders.map((order) => (
                  <div key={order.id} className="rounded-lg border border-[var(--border-subtle)] p-3">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-mono text-[var(--text-primary)]">
                        {order.order_name || `#${order.shopify_order_id}`}
                      </span>
                      <div className="flex items-center gap-1.5">
                        <div className={`w-1.5 h-1.5 rounded-full ${
                          order.fulfillment_status === "fulfilled" ? "bg-[var(--status-success)]" : "bg-[var(--status-warning)]"
                        }`} />
                        <span className="text-[10px] text-[var(--text-tertiary)]">
                          {order.fulfillment_status || "Unfulfilled"}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] text-[var(--text-tertiary)]">
                        {order.created_at ? new Date(order.created_at).toLocaleDateString() : ""}
                      </span>
                      <span className="text-xs font-mono text-[var(--text-secondary)]">
                        ${order.total_price || "0.00"}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="p-4 border-t border-[var(--border-subtle)] mt-auto">
            <Button variant="ghost" size="sm" className="w-full justify-start">
              <Copy size={14} /> Copy Tracking Link
            </Button>
            <Button variant="ghost" size="sm" className="w-full justify-start">
              <ExternalLink size={14} /> Open in Shopify
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
