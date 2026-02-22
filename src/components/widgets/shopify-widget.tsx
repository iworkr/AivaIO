"use client";

import { Package } from "lucide-react";
import { LottieAnimation } from "@/components/ui";
import type { ShopifyWidgetData } from "@/types";

export function ShopifyWidget({ data }: { data: ShopifyWidgetData["data"] }) {
  const isFulfilled = data.fulfillmentStatus === "fulfilled";

  return (
    <div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--background-elevated)] p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Package size={14} className="text-[var(--text-tertiary)]" />
          <span className="text-xs font-mono text-[var(--text-primary)]">
            {data.orderName}
          </span>
        </div>
        <span className={`text-[9px] px-1.5 py-0.5 rounded-full flex items-center gap-1 ${
          isFulfilled
            ? "bg-[var(--status-success-bg)] text-[var(--status-success)]"
            : "bg-[var(--status-warning-bg)] text-[var(--status-warning)]"
        }`}>
          {isFulfilled && (
            <LottieAnimation
              src="/lottie/fulfilled-badge.json"
              autoplay
              style={{ width: 14, height: 14 }}
            />
          )}
          {data.fulfillmentStatus.toUpperCase()}
        </span>
      </div>

      <div className="space-y-1.5 mb-3">
        {data.lineItems.map((item, i) => (
          <div key={i} className="flex justify-between text-xs">
            <span className="text-[var(--text-secondary)]">{item.title} x{item.quantity}</span>
            <span className="font-mono text-[var(--text-primary)]">{data.currency}{item.price}</span>
          </div>
        ))}
      </div>

      <div className="flex items-center justify-between pt-3 border-t border-[var(--border-subtle)]">
        <div>
          <p className="text-xs font-mono text-[var(--text-primary)]">
            {data.currency}{data.totalPrice} total
          </p>
          <p className="text-[10px] text-[var(--text-tertiary)]">
            {data.lineItems.length} items
            {data.customerName && ` · ${data.customerName}`}
          </p>
        </div>
        {data.trackingInfo && (
          <a
            href={data.trackingInfo.url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[10px] font-medium text-[var(--aiva-blue)] hover:underline"
          >
            Track ({data.trackingInfo.carrier})
          </a>
        )}
      </div>
    </div>
  );
}
