"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { LottieAnimation } from "@/components/ui";
import { GmailIcon, SlackIcon, ShopifyIcon } from "@/components/icons/brand-icons";
import { ConnectionModal } from "./connection-modal";
import { ShoppingBag } from "lucide-react";

interface EmptyStateHookProps {
  type: "INBOX" | "CHAT" | "CRM";
  contactName?: string;
}

const INTEGRATIONS = [
  { id: "gmail", name: "Gmail", description: "Sync emails & calendar", icon: GmailIcon },
  { id: "slack", name: "Slack", description: "Sync messages & channels", icon: SlackIcon },
  { id: "shopify", name: "Shopify", description: "Sync orders & customers", icon: ShopifyIcon },
];

export function EmptyStateHook({ type, contactName }: EmptyStateHookProps) {
  const [connecting, setConnecting] = useState<string | null>(null);

  if (type === "INBOX") {
    return (
      <>
        <div className="flex-1 flex flex-col items-center justify-center px-8">
          <div className="max-w-2xl w-full text-center">
            <div className="mb-6">
              <LottieAnimation
                src="/lottie/scanner.json"
                loop
                autoplay
                style={{ width: 120, height: 120, margin: "0 auto" }}
              />
            </div>

            <h2 className="text-2xl font-semibold text-[var(--text-primary)] mb-2">
              AIVA needs data to work.
            </h2>
            <p className="text-[var(--text-secondary)] text-sm max-w-md mx-auto mb-10">
              Connect your communication channels. AIVA will securely sync your history,
              calibrate your tone, and begin organizing your incoming messages.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-lg mx-auto">
              {INTEGRATIONS.map((int) => {
                const Icon = int.icon;
                return (
                  <motion.button
                    key={int.id}
                    whileHover={{ y: -2, borderColor: "rgba(255,255,255,0.2)" }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setConnecting(int.id)}
                    className="bg-[#0A0A0A] border border-[rgba(255,255,255,0.08)] rounded-xl p-5 flex flex-col items-center gap-3 hover:bg-[rgba(255,255,255,0.02)] cursor-pointer transition-all"
                  >
                    <Icon size={28} />
                    <span className="text-sm font-medium text-[var(--text-primary)]">
                      Connect {int.name}
                    </span>
                    <span className="text-[11px] text-[var(--text-tertiary)]">
                      {int.description}
                    </span>
                  </motion.button>
                );
              })}
            </div>
          </div>
        </div>
        <ConnectionModal provider={connecting} onClose={() => setConnecting(null)} />
      </>
    );
  }

  if (type === "CHAT") {
    return (
      <>
        <div className="w-full bg-[#0A0A0A] border border-[rgba(255,255,255,0.08)] rounded-xl p-5">
          <p className="text-sm text-[var(--text-secondary)] mb-4">
            I don&apos;t have access to your messages yet. Connect a channel below so I can start working for you.
          </p>
          <div className="flex items-center gap-3">
            {INTEGRATIONS.map((int) => {
              const Icon = int.icon;
              return (
                <button
                  key={int.id}
                  onClick={() => setConnecting(int.id)}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg border border-[rgba(255,255,255,0.1)] text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:border-[rgba(255,255,255,0.2)] hover:bg-[rgba(255,255,255,0.03)] transition-all"
                >
                  <Icon size={16} />
                  <span>{int.name}</span>
                </button>
              );
            })}
          </div>
        </div>
        <ConnectionModal provider={connecting} onClose={() => setConnecting(null)} />
      </>
    );
  }

  if (type === "CRM") {
    return (
      <>
        <div className="p-4 border border-[rgba(255,255,255,0.08)] rounded-xl bg-[#0A0A0A]">
          <div className="flex items-center gap-3 mb-3">
            <div className="size-8 rounded-lg bg-[rgba(255,255,255,0.04)] flex items-center justify-center">
              <ShopifyIcon size={16} className="grayscale opacity-60" />
            </div>
            <span className="text-xs font-medium text-[var(--text-tertiary)] uppercase tracking-wider">
              E-Commerce
            </span>
          </div>
          <p className="text-sm text-[var(--text-secondary)] mb-3 leading-relaxed">
            {contactName
              ? `Is ${contactName} an e-commerce customer? Connect Shopify to see their LTV, orders, and tracking data.`
              : "Connect Shopify to instantly see customer LTV, past orders, and live tracking data."}
          </p>
          <button
            onClick={() => setConnecting("shopify")}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-[rgba(255,255,255,0.06)] border border-[rgba(255,255,255,0.1)] text-sm font-medium text-[var(--text-primary)] hover:bg-[rgba(255,255,255,0.1)] hover:border-[rgba(255,255,255,0.2)] transition-all"
          >
            <ShoppingBag size={14} />
            Connect Shopify
          </button>
        </div>
        <ConnectionModal provider={connecting} onClose={() => setConnecting(null)} />
      </>
    );
  }

  return null;
}

export function InlineIntegrationCard({ onConnect }: { onConnect: (provider: string) => void }) {
  return (
    <div className="w-full bg-[#0A0A0A] border border-[rgba(255,255,255,0.08)] rounded-xl p-4 flex flex-col gap-3">
      <p className="text-sm text-[var(--text-secondary)]">
        Connect a channel so I can search your data.
      </p>
      <div className="flex items-center gap-2 flex-wrap">
        {INTEGRATIONS.map((int) => {
          const Icon = int.icon;
          return (
            <button
              key={int.id}
              onClick={() => onConnect(int.id)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-md border border-[rgba(255,255,255,0.08)] text-xs font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:border-[rgba(255,255,255,0.15)] hover:bg-[rgba(255,255,255,0.03)] transition-all"
            >
              <Icon size={14} />
              {int.name}
            </button>
          );
        })}
      </div>
    </div>
  );
}
