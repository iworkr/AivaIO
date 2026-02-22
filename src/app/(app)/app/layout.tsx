"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Sidebar } from "@/components/app/sidebar";
import { KeyboardShortcuts } from "@/components/app/keyboard-shortcuts";
import { LearningToast } from "@/components/app/learning-toast";
import { CommandPalette, CommandItem, CommandGroup } from "@/components/ui";
import { Home, Inbox, Star, FileText, Settings, Zap, Clock, Shield } from "lucide-react";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(true);
  const [cmdOpen, setCmdOpen] = useState(false);
  const router = useRouter();

  return (
    <div className="min-h-screen bg-[var(--background-main)]">
      <Sidebar
        collapsed={sidebarCollapsed}
        onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
      />

      {!sidebarCollapsed && (
        <div
          className="lg:hidden fixed inset-0 z-30 bg-black/50"
          onClick={() => setSidebarCollapsed(true)}
        />
      )}

      <main className="lg:pl-[240px] min-h-screen">
        {children}
      </main>

      <CommandPalette open={cmdOpen} onOpenChange={setCmdOpen}>
        <CommandGroup label="Navigation">
          <CommandItem icon={<Home size={14} />} shortcut="G H" onClick={() => { router.push("/app"); setCmdOpen(false); }}>
            Go to Home
          </CommandItem>
          <CommandItem icon={<Inbox size={14} />} shortcut="G I" onClick={() => { router.push("/app/inbox"); setCmdOpen(false); }}>
            Go to Inbox
          </CommandItem>
          <CommandItem icon={<Star size={14} />} shortcut="G V" onClick={() => { router.push("/app/inbox?filter=vip"); setCmdOpen(false); }}>
            VIP Messages
          </CommandItem>
          <CommandItem icon={<FileText size={14} />} shortcut="G D" onClick={() => { router.push("/app/inbox?filter=drafts"); setCmdOpen(false); }}>
            Drafts
          </CommandItem>
          <CommandItem icon={<Settings size={14} />} shortcut="G S" onClick={() => { router.push("/app/settings"); setCmdOpen(false); }}>
            Settings
          </CommandItem>
          <CommandItem icon={<Shield size={14} />} onClick={() => { router.push("/app/audit"); setCmdOpen(false); }}>
            Audit Log
          </CommandItem>
        </CommandGroup>
        <CommandGroup label="Actions">
          <CommandItem icon={<Zap size={14} />}>Recalibrate Tone Profile</CommandItem>
          <CommandItem icon={<Clock size={14} />}>View Sync Status</CommandItem>
        </CommandGroup>
      </CommandPalette>

      <KeyboardShortcuts />
      <LearningToast />
    </div>
  );
}
