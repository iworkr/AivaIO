"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Sidebar } from "@/components/app/sidebar";
import { KeyboardShortcuts } from "@/components/app/keyboard-shortcuts";
import { LearningToast } from "@/components/app/learning-toast";
import { Toast, CommandPalette, CommandItem, CommandGroup } from "@/components/ui";
import { Home, Inbox, Star, FileText, Settings, Zap, Clock, Shield, CheckCircle, CheckSquare } from "lucide-react";

function IntegrationSuccessDetector({ onSuccess }: { onSuccess: (msg: string) => void }) {
  const searchParams = useSearchParams();

  useEffect(() => {
    const success = searchParams.get("success");
    const integration = searchParams.get("integration");
    if (success === "true" && integration) {
      onSuccess(`${integration.charAt(0).toUpperCase() + integration.slice(1)} connected successfully. Fetching historical data…`);
      const url = new URL(window.location.href);
      url.searchParams.delete("success");
      url.searchParams.delete("integration");
      window.history.replaceState({}, "", url.pathname + url.search);
    }
  }, [searchParams, onSuccess]);

  return null;
}

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(true);
  const [cmdOpen, setCmdOpen] = useState(false);
  const [successToast, setSuccessToast] = useState<string | null>(null);
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
          <CommandItem icon={<CheckSquare size={14} />} shortcut="G T" onClick={() => { router.push("/app/tasks"); setCmdOpen(false); }}>
            Tasks & Calendar
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

      <Suspense fallback={null}>
        <IntegrationSuccessDetector onSuccess={setSuccessToast} />
      </Suspense>

      <KeyboardShortcuts />
      <LearningToast />

      <Toast
        visible={!!successToast}
        message={successToast || ""}
        icon={<CheckCircle size={16} className="text-green-400" />}
        duration={5000}
        onClose={() => setSuccessToast(null)}
      />
    </div>
  );
}
