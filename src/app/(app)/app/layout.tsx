"use client";

import { useState } from "react";
import { Sidebar } from "@/components/app/sidebar";
import { CommandPalette, CommandItem, CommandGroup } from "@/components/ui";
import { Inbox, Star, FileText, Settings, Zap, Clock } from "lucide-react";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(true);
  const [cmdOpen, setCmdOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[var(--background-main)]">
      <Sidebar
        collapsed={sidebarCollapsed}
        onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
      />

      {/* Mobile overlay */}
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
          <CommandItem icon={<Inbox size={14} />} shortcut="G I">Go to Inbox</CommandItem>
          <CommandItem icon={<Star size={14} />} shortcut="G V">VIP Messages</CommandItem>
          <CommandItem icon={<FileText size={14} />} shortcut="G D">Drafts</CommandItem>
          <CommandItem icon={<Settings size={14} />} shortcut="G S">Settings</CommandItem>
        </CommandGroup>
        <CommandGroup label="Actions">
          <CommandItem icon={<Zap size={14} />}>Recalibrate Tone Profile</CommandItem>
          <CommandItem icon={<Clock size={14} />}>View Audit Log</CommandItem>
        </CommandGroup>
      </CommandPalette>
    </div>
  );
}
