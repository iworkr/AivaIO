"use client";

import { Avatar, Badge, Button } from "@/components/ui";
import { useSupabaseQuery } from "@/hooks/use-supabase-query";
import { fetchShopifyCustomer, fetchShopifyOrders } from "@/lib/supabase/queries";
import { Copy, ExternalLink, ChevronDown, ChevronRight } from "lucide-react";
import { useState } from "react";

interface CRMPanelProps {
  senderEmail: string;
  senderName: string;
}

export function CRMPanel({ senderEmail, senderName }: CRMPanelProps) {
  const { data: customer } = useSupabaseQuery(
    () => senderEmail ? fetchShopifyCustomer(senderEmail) : Promise.resolve(null),
    [senderEmail]
  );
  const { data: orders } = useSupabaseQuery(
    () => senderEmail ? fetchShopifyOrders(senderEmail) : Promise.resolve([]),
    [senderEmail]
  );
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null);

  const initials = senderName?.split(" ").map((n) => n[0]).join("").slice(0, 2) || "?";
  const ltv = customer?.total_spent ? Number(customer.total_spent) : 0;
  const ordersCount = customer?.orders_count || 0;
  const precedence = ltv > 500 || (customer?.tags as string[])?.includes("VIP")
    ? "VIP" : ordersCount > 1 ? "Returning" : "New";

  return (
    <div className="w-[300px] border-l border-[var(--border-subtle)] bg-[var(--background-elevated)] flex flex-col overflow-y-auto">
      {/* Identity Card */}
      <div className="p-4 border-b border-[var(--border-subtle)]">
        <div className="flex items-center gap-3 mb-3">
          <Avatar initials={initials} size="lg" />
          <div className="min-w-0">
            <p className="text-sm font-medium text-[var(--text-primary)] truncate">{senderName}</p>
            <p className="text-xs text-[var(--text-tertiary)] truncate">{senderEmail}</p>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {ltv > 0 && (
            <Badge variant="outline" className={`font-mono ${precedence === "VIP" ? "text-[#FBBF24]" : ""}`}>
              ${ltv.toFixed(2)} LTV
            </Badge>
          )}
          <Badge variant="outline">{precedence} Customer</Badge>
        </div>
      </div>

      {/* Order History */}
      {orders && orders.length > 0 && (
        <div className="p-4">
          <h3 className="text-[10px] font-medium uppercase tracking-[0.06em] text-[var(--text-tertiary)] mb-3">
            Order History
          </h3>
          <div className="space-y-2">
            {orders.map((order) => {
              const isExpanded = expandedOrder === order.id;
              return (
                <div key={order.id} className="rounded-lg border border-[var(--border-subtle)]">
                  <button
                    onClick={() => setExpandedOrder(isExpanded ? null : order.id)}
                    className="flex items-center justify-between w-full p-3 text-left"
                  >
                    <div>
                      <span className="text-xs font-mono text-[var(--text-primary)]">
                        {order.order_name || `#${order.shopify_order_id}`}
                      </span>
                      <span className="text-[10px] text-[var(--text-tertiary)] ml-2">
                        {order.created_at ? new Date(order.created_at).toLocaleDateString([], { month: "short", day: "numeric" }) : ""}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <div className={`w-1.5 h-1.5 rounded-full ${
                        order.fulfillment_status === "fulfilled" ? "bg-[var(--status-success)]" : "bg-[var(--status-warning)]"
                      }`} />
                      {isExpanded ? <ChevronDown size={12} className="text-[var(--text-tertiary)]" /> : <ChevronRight size={12} className="text-[var(--text-tertiary)]" />}
                    </div>
                  </button>
                  {isExpanded && (
                    <div className="px-3 pb-3 border-t border-[var(--border-subtle)]">
                      {order.line_items_summary && (
                        <div className="pt-2 space-y-1">
                          {(order.line_items_summary as Array<{ title: string; qty: number }>).map((item, i) => (
                            <p key={i} className="text-[10px] font-mono text-[var(--text-secondary)]">
                              {item.qty}x {item.title}
                            </p>
                          ))}
                        </div>
                      )}
                      <div className="flex justify-between items-center mt-2 pt-2 border-t border-[var(--border-subtle)]">
                        <span className="text-xs font-mono text-[var(--text-primary)]">${order.total_price}</span>
                        {order.tracking_info && (
                          <button className="text-[10px] text-[var(--aiva-blue)] hover:underline">
                            Copy Tracking
                          </button>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <div className="p-4 border-t border-[var(--border-subtle)] mt-auto">
        <Button variant="ghost" size="sm" className="w-full justify-start">
          <Copy size={14} /> Copy Tracking Link
        </Button>
        <Button variant="ghost" size="sm" className="w-full justify-start">
          <ExternalLink size={14} /> Open in Shopify
        </Button>
      </div>
    </div>
  );
}
