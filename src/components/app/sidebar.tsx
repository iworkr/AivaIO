"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Avatar, Badge } from "@/components/ui";
import { cn } from "@/lib/utils";
import Image from "next/image";
import {
  Inbox, Star, FileText, CheckSquare,
  Settings, Sun, Moon, ChevronDown, LogOut,
  Menu, X,
} from "lucide-react";

interface SidebarProps {
  collapsed?: boolean;
  onToggle?: () => void;
}

const mainLinks = [
  { icon: Inbox, label: "Inbox", href: "/app/inbox", badge: "12" },
  { icon: Star, label: "VIP / Urgent", href: "/app/inbox?filter=vip" },
  { icon: FileText, label: "Drafts", href: "/app/inbox?filter=drafts" },
  { icon: CheckSquare, label: "Tasks", href: "/app/inbox?filter=tasks" },
];

const integrations = [
  { svg: "/icons/gmail.svg", label: "Gmail", status: "active" as const },
  { svg: "/icons/slack.svg", label: "Slack", status: "active" as const },
  { svg: "/icons/whatsapp.svg", label: "WhatsApp", status: "disconnected" as const },
  { svg: "/icons/shopify.svg", label: "Shopify", status: "active" as const },
];

const statusColors = {
  active: "bg-[var(--status-success)]",
  syncing: "bg-[var(--status-warning)]",
  connecting: "bg-[var(--status-warning)]",
  disconnected: "bg-[var(--text-tertiary)]",
};

export function Sidebar({ collapsed, onToggle }: SidebarProps) {
  const pathname = usePathname();
  const [isDark, setIsDark] = useState(true);
  const [wsDropdown, setWsDropdown] = useState(false);

  const toggleTheme = () => {
    setIsDark(!isDark);
    document.documentElement.classList.toggle("light");
    document.documentElement.classList.toggle("dark");
  };

  return (
    <>
      {/* Mobile toggle */}
      <button
        onClick={onToggle}
        className="lg:hidden fixed top-4 left-4 z-50 h-9 w-9 rounded-lg border border-[var(--border-subtle)] bg-[var(--background-sidebar)] flex items-center justify-center text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
      >
        {collapsed ? <Menu size={16} /> : <X size={16} />}
      </button>

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed top-0 left-0 bottom-0 z-40 w-[240px] bg-[var(--background-sidebar)] border-r border-[var(--border-subtle)]",
          "flex flex-col transition-transform duration-200",
          "lg:translate-x-0",
          collapsed ? "-translate-x-full" : "translate-x-0"
        )}
      >
        {/* Workspace header */}
        <div className="p-4 border-b border-[var(--border-subtle)]">
          <button
            onClick={() => setWsDropdown(!wsDropdown)}
            className="flex items-center gap-2 w-full hover:bg-[var(--surface-hover)] rounded-lg p-1.5 -m-1.5 transition-colors"
          >
            <img src="/aiva-mark.svg" alt="AIVA" className="h-6 w-6" />
            <span className="text-sm font-medium text-[var(--text-primary)] flex-1 text-left truncate">
              AIVA Workspace
            </span>
            <ChevronDown size={14} className="text-[var(--text-tertiary)]" />
          </button>
        </div>

        {/* Main navigation */}
        <nav className="flex-1 overflow-y-auto py-3 px-2">
          <div className="space-y-0.5">
            {mainLinks.map((link) => {
              const Icon = link.icon;
              const isActive = pathname === link.href || (link.href === "/app/inbox" && pathname?.startsWith("/app/inbox"));
              return (
                <Link
                  key={link.label}
                  href={link.href}
                  className={cn(
                    "flex items-center gap-3 h-8 px-2.5 rounded-md text-sm transition-colors duration-100",
                    isActive
                      ? "bg-[var(--surface-hover)] text-[var(--text-primary)]"
                      : "text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-hover)]"
                  )}
                >
                  <Icon size={16} className="shrink-0" />
                  <span className="flex-1 truncate">{link.label}</span>
                  {link.badge && (
                    <Badge variant="blue" size="sm" className="px-1.5 py-0 h-[18px] text-[10px]">
                      {link.badge}
                    </Badge>
                  )}
                </Link>
              );
            })}
          </div>

          {/* Integrations */}
          <div className="mt-6 pt-4 border-t border-[var(--border-subtle)]">
            <p className="text-[10px] font-medium uppercase tracking-[0.06em] text-[var(--text-tertiary)] px-2.5 mb-2">
              Integrations
            </p>
            <div className="space-y-0.5">
              {integrations.map((int) => (
                <div
                  key={int.label}
                  className="flex items-center gap-3 h-7 px-2.5 text-sm text-[var(--text-secondary)]"
                >
                  <Image
                    src={int.svg}
                    alt={int.label}
                    width={14}
                    height={14}
                    className="shrink-0 opacity-60"
                  />
                  <span className="flex-1 truncate text-xs">{int.label}</span>
                  <div className={cn("w-1.5 h-1.5 rounded-full", statusColors[int.status])} />
                </div>
              ))}
            </div>
          </div>
        </nav>

        {/* Bottom section */}
        <div className="p-3 border-t border-[var(--border-subtle)] space-y-1">
          <Link
            href="/app/settings"
            className="flex items-center gap-3 h-8 px-2.5 rounded-md text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-hover)] transition-colors"
          >
            <Settings size={16} />
            <span className="flex-1">Settings</span>
          </Link>
          <button
            onClick={toggleTheme}
            className="flex items-center gap-3 h-8 px-2.5 rounded-md text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-hover)] transition-colors w-full"
          >
            {isDark ? <Sun size={16} /> : <Moon size={16} />}
            <span className="flex-1 text-left">{isDark ? "Light Mode" : "Dark Mode"}</span>
            <kbd className="text-[9px] font-mono text-[var(--text-tertiary)]">⌘⇧L</kbd>
          </button>
          <div className="flex items-center gap-3 h-8 px-2.5">
            <Avatar initials="JD" size="sm" />
            <span className="text-xs text-[var(--text-secondary)] flex-1 truncate">john@acme.com</span>
          </div>
        </div>
      </aside>
    </>
  );
}
