"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Avatar } from "@/components/ui";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/use-auth";
import { useIntegrations } from "@/hooks/use-integrations";
import { GmailIcon, SlackIcon, ShopifyIcon } from "@/components/icons/brand-icons";
import { ConnectionModal } from "./connection-modal";
import {
  Command, Inbox, Star, PenLine, CheckSquare, Calendar,
  Settings, Search, ChevronsUpDown,
  Menu, X, Settings2,
} from "lucide-react";

interface SidebarProps {
  collapsed?: boolean;
  onToggle?: () => void;
}

const mainLinks = [
  { icon: Command, label: "Home", href: "/app" },
  { icon: Inbox, label: "Inbox", href: "/app/inbox", badgeKey: "inbox" },
  { icon: Star, label: "VIP / Urgent", href: "/app/inbox?filter=vip" },
  { icon: PenLine, label: "Drafts", href: "/app/inbox?filter=drafts" },
  { icon: CheckSquare, label: "Tasks", href: "/app/tasks" },
  { icon: Calendar, label: "Calendar", href: "/app/tasks" },
];

const INTEGRATION_META: Record<string, { icon: React.FC<{ size?: number; className?: string }>; label: string }> = {
  gmail: { icon: GmailIcon, label: "Gmail" },
  slack: { icon: SlackIcon, label: "Slack" },
  shopify: { icon: ShopifyIcon, label: "Shopify" },
};

export function Sidebar({ collapsed, onToggle }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { user } = useAuth();
  const { integrations } = useIntegrations();
  const [hoveredIntegration, setHoveredIntegration] = useState<string | null>(null);
  const [connecting, setConnecting] = useState<string | null>(null);

  const userName = (user?.user_metadata?.full_name as string) || user?.email?.split("@")[0] || "User";
  const userEmail = user?.email || "";
  const userInitial = userName[0]?.toUpperCase() || "?";

  return (
    <>
      {/* Mobile toggle */}
      <button
        onClick={onToggle}
        className="lg:hidden fixed top-4 left-4 z-50 h-9 w-9 rounded-lg border border-[var(--border-subtle)] bg-[#050505] flex items-center justify-center text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
      >
        {collapsed ? <Menu size={16} /> : <X size={16} />}
      </button>

      <aside
        className={cn(
          "fixed top-0 left-0 bottom-0 z-40 w-[240px] bg-[#050505] border-r border-[rgba(255,255,255,0.06)]",
          "flex flex-col transition-transform duration-200",
          "lg:translate-x-0",
          collapsed ? "-translate-x-full" : "translate-x-0"
        )}
      >
        {/* ═══ Top: AIVA Brand & Workspace ═══ */}
        <div className="h-[56px] px-4 flex items-center justify-between border-b border-[rgba(255,255,255,0.06)] hover:bg-[rgba(255,255,255,0.03)] cursor-pointer transition-colors">
          <div className="flex items-center min-w-0">
            <img src="/aiva-mark.svg" alt="AIVA" className="h-6 w-6 shrink-0" />
            <span className="ml-2 text-sm font-medium text-[var(--text-primary)] tracking-tight truncate">
              AIVA Workspace
            </span>
          </div>
          <ChevronsUpDown size={14} className="text-[var(--text-tertiary)] shrink-0" />
        </div>

        {/* ═══ Core Navigation ═══ */}
        <nav className="flex-1 overflow-y-auto">
          <div className="mt-4 px-2 flex flex-col gap-0.5">
            {mainLinks.map((link) => {
              const Icon = link.icon;
              const isActive = pathname === link.href ||
                (link.href === "/app/inbox" && pathname?.startsWith("/app/inbox")) ||
                (link.href === "/app/tasks" && pathname?.startsWith("/app/tasks")) ||
                (link.href === "/app" && pathname === "/app");
              return (
                <Link
                  key={link.label}
                  href={link.href}
                  className={cn(
                    "h-[32px] rounded-md flex items-center px-2 group transition-colors duration-150",
                    isActive
                      ? "bg-[rgba(255,255,255,0.08)] text-[var(--text-primary)] font-medium"
                      : "text-[var(--text-secondary)] font-normal hover:bg-[rgba(255,255,255,0.04)] hover:text-[var(--text-primary)]"
                  )}
                >
                  <Icon
                    size={16}
                    className={cn(
                      "shrink-0 mr-3",
                      isActive ? "text-[var(--text-primary)]" : "text-[var(--text-tertiary)] group-hover:text-[var(--text-secondary)]"
                    )}
                  />
                  <span className="flex-1 text-sm truncate">{link.label}</span>
                  {link.badgeKey === "inbox" && (
                    <span className="bg-blue-500/10 text-blue-400 text-[10px] font-mono px-1.5 rounded leading-none py-0.5">
                      12
                    </span>
                  )}
                </Link>
              );
            })}
          </div>

          {/* ═══ Connected Tools ═══ */}
          <div className="mt-6">
            <p className="text-[11px] font-semibold tracking-wider uppercase text-[var(--text-tertiary)] px-4 mb-2">
              Connected Tools
            </p>
            <div className="px-2 flex flex-col gap-0.5">
              {integrations.length > 0 ? (
                integrations.map((int) => {
                  const meta = INTEGRATION_META[int.provider];
                  if (!meta) return null;
                  const BrandIcon = meta.icon;
                  const isHovered = hoveredIntegration === int.id;
                  const needsReauth = int.status === "needs_reauth";

                  return (
                    <div
                      key={int.id}
                      onMouseEnter={() => setHoveredIntegration(int.id)}
                      onMouseLeave={() => setHoveredIntegration(null)}
                      className="h-[32px] rounded-md flex items-center px-2 group hover:bg-[rgba(255,255,255,0.04)] transition-colors cursor-default"
                    >
                      <BrandIcon
                        size={16}
                        className={cn(
                          "shrink-0 mr-3 transition-all duration-200",
                          isHovered ? "grayscale-0 opacity-100" : "grayscale opacity-60"
                        )}
                      />
                      <span className="flex-1 text-sm text-[var(--text-secondary)] truncate">
                        {meta.label}
                      </span>

                      {isHovered ? (
                        <button
                          onClick={() => router.push("/app/settings")}
                          className="size-5 rounded flex items-center justify-center text-[var(--text-tertiary)] hover:text-[var(--text-primary)] transition-colors"
                        >
                          <Settings2 size={12} />
                        </button>
                      ) : (
                        <div
                          className={cn(
                            "size-2 rounded-full",
                            needsReauth
                              ? "bg-yellow-500 shadow-[0_0_8px_rgba(234,179,8,0.4)]"
                              : "bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.4)]"
                          )}
                        />
                      )}
                    </div>
                  );
                })
              ) : (
                <button
                  onClick={() => setConnecting("gmail")}
                  className="h-[32px] rounded-md flex items-center px-2 text-sm text-[var(--text-tertiary)] hover:text-[var(--text-secondary)] hover:bg-[rgba(255,255,255,0.04)] transition-colors w-full"
                >
                  <span className="text-[var(--text-tertiary)] mr-3">+</span>
                  Connect an integration
                </button>
              )}
            </div>
          </div>
        </nav>

        {/* ═══ Bottom: User & System ═══ */}
        <div className="mt-auto pb-4 px-2 border-t border-[rgba(255,255,255,0.06)] pt-2 space-y-0.5">
          <Link
            href="/app/settings"
            className={cn(
              "h-[32px] rounded-md flex items-center px-2 text-sm transition-colors duration-150",
              pathname === "/app/settings"
                ? "bg-[rgba(255,255,255,0.08)] text-[var(--text-primary)] font-medium"
                : "text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[rgba(255,255,255,0.04)]"
            )}
          >
            <Settings size={16} className="shrink-0 mr-3 text-[var(--text-tertiary)]" />
            <span className="flex-1">Settings</span>
          </Link>
          <button
            className="h-[32px] rounded-md flex items-center px-2 text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[rgba(255,255,255,0.04)] transition-colors duration-150 w-full"
          >
            <Search size={16} className="shrink-0 mr-3 text-[var(--text-tertiary)]" />
            <span className="flex-1 text-left">Search</span>
            <kbd className="text-[9px] font-mono text-[var(--text-tertiary)] bg-[rgba(255,255,255,0.04)] px-1.5 py-0.5 rounded">
              ⌘K
            </kbd>
          </button>
          <div className="h-[36px] flex items-center px-2 gap-3">
            <Avatar initials={userInitial} size="sm" />
            <span className="text-xs text-[var(--text-secondary)] flex-1 truncate">{userEmail}</span>
          </div>
        </div>
      </aside>

      <ConnectionModal provider={connecting} onClose={() => setConnecting(null)} />
    </>
  );
}
