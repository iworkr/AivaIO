"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Avatar, Badge } from "@/components/ui";
import { cn } from "@/lib/utils";
import Image from "next/image";
import {
  Home, Inbox, Star, FileText, CheckSquare,
  Settings, Sun, Moon, ChevronDown,
  Menu, X,
} from "lucide-react";

interface SidebarProps {
  collapsed?: boolean;
  onToggle?: () => void;
}

const mainLinks = [
  { icon: Home, label: "Home", href: "/app" },
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

      <aside
        className={cn(
          "fixed top-0 left-0 bottom-0 z-40 w-[240px] bg-[var(--background-sidebar)] border-r border-[var(--border-subtle)]",
          "flex flex-col transition-transform duration-200",
          "lg:translate-x-0",
          collapsed ? "-translate-x-full" : "translate-x-0"
        )}
      >
        {/* Workspace header — 56px strict */}
        <div
          onClick={() => setWsDropdown(!wsDropdown)}
          className="h-14 flex items-center px-4 border-b border-[var(--border-subtle)] cursor-pointer hover:bg-[var(--surface-hover)] transition-colors"
        >
          <img src="/aiva-mark.svg" alt="AIVA" className="h-6 w-6 shrink-0" />
          <span className="ml-2.5 text-sm font-medium text-[var(--text-primary)] tracking-tight flex-1 truncate">
            AIVA Workspace
          </span>
          <ChevronDown size={14} className="text-[var(--text-tertiary)] shrink-0" />
        </div>

        {/* Main navigation */}
        <nav className="flex-1 overflow-y-auto pt-4 px-2">
          <div className="space-y-0.5">
            {mainLinks.map((link) => {
              const Icon = link.icon;
              const isActive = pathname === link.href ||
                (link.href === "/app/inbox" && pathname?.startsWith("/app/inbox")) ||
                (link.href === "/app" && pathname === "/app");
              return (
                <Link
                  key={link.label}
                  href={link.href}
                  className={cn(
                    "flex items-center gap-3 h-8 px-3 mx-0 rounded-md text-sm transition-colors duration-100",
                    isActive
                      ? "bg-[var(--surface-active)] text-[var(--text-primary)] font-medium"
                      : "text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-hover)]"
                  )}
                >
                  <Icon size={16} className="shrink-0" />
                  <span className="flex-1 truncate">{link.label}</span>
                  {link.badge && (
                    <span className="bg-blue-500/10 text-blue-400 text-[11px] font-mono px-1.5 py-0.5 rounded leading-none">
                      {link.badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </div>

          {/* Integrations */}
          <div className="mt-6">
            <p className="text-[11px] font-semibold tracking-wider uppercase text-[var(--text-tertiary)] px-3 mb-2">
              Integrations
            </p>
            <div className="space-y-0.5">
              {integrations.map((int) => (
                <div
                  key={int.label}
                  className="flex items-center gap-3 h-7 px-3 text-sm text-[var(--text-secondary)]"
                >
                  <Image
                    src={int.svg}
                    alt={int.label}
                    width={14}
                    height={14}
                    className="shrink-0 opacity-60"
                  />
                  <span className="flex-1 truncate text-xs">{int.label}</span>
                  <div
                    className={cn(
                      "w-2 h-2 rounded-full",
                      int.status === "active"
                        ? "bg-[var(--status-success)] shadow-[0_0_8px_var(--status-success-glow)]"
                        : "bg-zinc-700"
                    )}
                  />
                </div>
              ))}
            </div>
          </div>
        </nav>

        {/* Bottom section — pinned */}
        <div className="mt-auto p-3 border-t border-[var(--border-subtle)] space-y-0.5">
          <Link
            href="/app/settings"
            className={cn(
              "flex items-center gap-3 h-8 px-3 rounded-md text-sm transition-colors duration-100",
              pathname === "/app/settings"
                ? "bg-[var(--surface-active)] text-[var(--text-primary)] font-medium"
                : "text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-hover)]"
            )}
          >
            <Settings size={16} />
            <span className="flex-1">Settings</span>
          </Link>
          <button
            onClick={toggleTheme}
            className="flex items-center gap-3 h-8 px-3 rounded-md text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-hover)] transition-colors duration-100 w-full"
          >
            {isDark ? <Sun size={16} /> : <Moon size={16} />}
            <span className="flex-1 text-left">{isDark ? "Light Mode" : "Dark Mode"}</span>
            <kbd className="text-[9px] font-mono text-[var(--text-tertiary)]">⌘⇧L</kbd>
          </button>
          <div className="flex items-center gap-3 h-8 px-3">
            <Avatar initials="JD" size="sm" />
            <span className="text-xs text-[var(--text-secondary)] flex-1 truncate">john@acme.com</span>
          </div>
        </div>
      </aside>
    </>
  );
}
