"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Button, Input, Slider, ToggleSwitch, Badge, Avatar, ProgressBar } from "@/components/ui";
import { staggerContainer, staggerItem } from "@/lib/animations";
import { useAuth } from "@/hooks/use-auth";
import { useSupabaseQuery } from "@/hooks/use-supabase-query";
import {
  fetchVoicePreferences, updateVoicePreferences,
  fetchWorkspaceSettings, updateWorkspaceSettings,
  fetchChannelConnections, fetchUserProfile, updateUserProfile,
} from "@/lib/supabase/queries";
import {
  User, Link2, Sliders, Shield, CreditCard, Lock,
  Mail, Hash, Phone, ShoppingBag, RefreshCw,
  ShieldAlert, Clock, DollarSign, Zap, AlertTriangle, FileText,
  ChevronDown,
} from "lucide-react";

const settingsSections = [
  { id: "profile", icon: User, label: "Profile" },
  { id: "integrations", icon: Link2, label: "Integrations" },
  { id: "tone", icon: Sliders, label: "Tone Calibration" },
  { id: "vault", icon: Shield, label: "Safety Vault" },
  { id: "billing", icon: CreditCard, label: "Billing" },
  { id: "security", icon: Lock, label: "Security" },
];

const integrationIcons: Record<string, React.ElementType> = {
  gmail: Mail, slack: Hash, whatsapp: Phone, shopify: ShoppingBag,
};

export default function SettingsPage() {
  const [activeSection, setActiveSection] = useState("profile");
  const [settingsNavOpen, setSettingsNavOpen] = useState(false);
  const { user } = useAuth();
  const userId = user?.id || "";
  const workspaceId = (user?.user_metadata as Record<string, string>)?.workspace_id || "";

  const { data: profile, refetch: refetchProfile } = useSupabaseQuery(
    () => userId ? fetchUserProfile(userId) : Promise.resolve(null), [userId]
  );
  const { data: voicePrefs, refetch: refetchVoice } = useSupabaseQuery(
    () => userId ? fetchVoicePreferences(userId) : Promise.resolve(null), [userId]
  );
  const { data: wsSettings, refetch: refetchWs } = useSupabaseQuery(
    () => workspaceId ? fetchWorkspaceSettings(workspaceId) : Promise.resolve(null), [workspaceId]
  );
  const { data: connections } = useSupabaseQuery(
    () => userId ? fetchChannelConnections(userId) : Promise.resolve([]), [userId]
  );

  const [name, setName] = useState("");
  const [confidenceThreshold, setConfidenceThreshold] = useState([85]);
  const [autoSendEnabled, setAutoSendEnabled] = useState(true);
  const [vipApproval, setVipApproval] = useState(true);
  const [blockPricing, setBlockPricing] = useState(true);
  const [timeWindow, setTimeWindow] = useState(true);
  const [afterHours, setAfterHours] = useState(false);
  const [isRecalibrating, setIsRecalibrating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (profile?.display_name) setName(profile.display_name);
    else if (user?.user_metadata?.full_name) setName(user.user_metadata.full_name as string);
  }, [profile, user]);

  useEffect(() => {
    if (wsSettings) {
      if (wsSettings.confidence_threshold) setConfidenceThreshold([wsSettings.confidence_threshold * 100]);
      if (wsSettings.auto_send_enabled !== undefined) setAutoSendEnabled(wsSettings.auto_send_enabled);
      if (wsSettings.vip_approval !== undefined) setVipApproval(wsSettings.vip_approval);
      if (wsSettings.block_pricing !== undefined) setBlockPricing(wsSettings.block_pricing);
      if (wsSettings.time_window !== undefined) setTimeWindow(wsSettings.time_window);
      if (wsSettings.after_hours !== undefined) setAfterHours(wsSettings.after_hours);
    }
  }, [wsSettings]);

  const toneDimensions = voicePrefs?.tone_profile?.dimensions || {
    formality: 6.5, length: 3.0, warmth: 7.0, certainty: 8.5,
  };

  const handleSaveProfile = async () => {
    if (!userId) return;
    setIsSaving(true);
    await updateUserProfile(userId, { display_name: name });
    setIsSaving(false);
    refetchProfile();
  };

  const handleSaveVault = async () => {
    if (!workspaceId) return;
    setIsSaving(true);
    await updateWorkspaceSettings(workspaceId, {
      confidence_threshold: confidenceThreshold[0] / 100,
      auto_send_enabled: autoSendEnabled,
      vip_approval: vipApproval,
      block_pricing: blockPricing,
      time_window: timeWindow,
      after_hours: afterHours,
    });
    setIsSaving(false);
    refetchWs();
  };

  const handleRecalibrate = async () => {
    setIsRecalibrating(true);
    try {
      await fetch("/api/ai/draft-reply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ threadId: "recalibrate", messageContext: "recalibrate", channel: "EMAIL" }),
      });
    } catch { /* best effort */ }
    setTimeout(() => {
      setIsRecalibrating(false);
      refetchVoice();
    }, 3000);
  };

  const [connectingProvider, setConnectingProvider] = useState<string | null>(null);

  const handleConnect = async (provider: string) => {
    setConnectingProvider(provider);
    try {
      const res = await fetch("/api/integrations/connect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ provider }),
      });
      const data = await res.json();
      if (data.authUrl) {
        window.location.href = data.authUrl;
      }
    } catch {
      setConnectingProvider(null);
    }
  };

  const connectionList = [
    { provider: "gmail", name: "Gmail", desc: "Email inbox & sent history" },
    { provider: "slack", name: "Slack", desc: "Channels & direct messages" },
    { provider: "shopify", name: "Shopify", desc: "Orders, customers & support" },
  ].map((item) => {
    const conn = (connections || []).find((c: Record<string, unknown>) => (c.provider as string)?.toLowerCase() === item.provider);
    return {
      ...item,
      status: (conn?.status as string) || "disconnected",
      detail: conn?.status === "active"
        ? `Connected${conn?.last_sync_at ? `. Last synced ${new Date(conn.last_sync_at as string).toLocaleString()}` : ""}.`
        : "Not connected.",
    };
  });

  return (
    <div className="h-screen flex flex-col md:flex-row overflow-hidden">
      {/* Mobile settings nav toggle */}
      <div className="md:hidden border-b border-[var(--border-subtle)] px-4 py-2 flex items-center gap-2 shrink-0">
        <button
          onClick={() => setSettingsNavOpen(!settingsNavOpen)}
          className="flex items-center gap-2 text-sm text-[var(--text-primary)] font-medium"
        >
          {settingsSections.find((s) => s.id === activeSection)?.label || "Settings"}
          <ChevronDown size={14} className={`text-[var(--text-tertiary)] transition-transform ${settingsNavOpen ? "rotate-180" : ""}`} />
        </button>
      </div>
      {settingsNavOpen && (
        <div className="md:hidden border-b border-[var(--border-subtle)] px-2 pb-2 grid grid-cols-2 gap-1">
          {settingsSections.map((section) => {
            const Icon = section.icon;
            return (
              <button
                key={section.id}
                onClick={() => { setActiveSection(section.id); setSettingsNavOpen(false); }}
                className={`flex items-center gap-2 h-8 px-3 rounded-md text-sm transition-colors ${
                  activeSection === section.id
                    ? "bg-[var(--surface-hover)] text-[var(--text-primary)]"
                    : "text-[var(--text-secondary)]"
                }`}
              >
                <Icon size={14} /> {section.label}
              </button>
            );
          })}
        </div>
      )}

      {/* Desktop sidebar */}
      <div className="hidden md:block w-52 shrink-0 border-r border-[var(--border-subtle)] py-4 px-2 overflow-y-auto">
        <p className="text-[10px] font-medium uppercase tracking-[0.06em] text-[var(--text-tertiary)] px-3 mb-2">
          Settings
        </p>
        {settingsSections.map((section) => {
          const Icon = section.icon;
          return (
            <button
              key={section.id}
              onClick={() => setActiveSection(section.id)}
              className={`flex items-center gap-3 w-full h-8 px-3 rounded-md text-sm transition-colors duration-100 ${
                activeSection === section.id
                  ? "bg-[var(--surface-hover)] text-[var(--text-primary)]"
                  : "text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-hover)]"
              }`}
            >
              <Icon size={14} /> {section.label}
            </button>
          );
        })}
      </div>

      <div className="flex-1 overflow-y-auto py-6 md:py-8">
        <div className="max-w-xl mx-auto px-4 sm:px-6">
          {activeSection === "profile" && (
            <motion.div variants={staggerContainer} initial="hidden" animate="visible">
              <motion.h2 variants={staggerItem} className="text-xl font-semibold text-[var(--text-primary)] tracking-[-0.02em] mb-6">Profile</motion.h2>
              <motion.div variants={staggerItem} className="space-y-4">
                <div className="flex items-center gap-4 mb-6">
                  <Avatar initials={name?.split(" ").map((n) => n[0]).join("").slice(0, 2) || "?"} size="lg" />
                  <Button variant="secondary" size="sm">Change avatar</Button>
                </div>
                <div>
                  <label className="text-xs text-[var(--text-secondary)] mb-1.5 block">Full Name</label>
                  <Input value={name} onChange={(e) => setName(e.target.value)} />
                </div>
                <div>
                  <label className="text-xs text-[var(--text-secondary)] mb-1.5 block">Email</label>
                  <Input value={user?.email || ""} disabled />
                </div>
                <Button variant="primary" size="md" onClick={handleSaveProfile} disabled={isSaving}>
                  {isSaving ? "Saving..." : "Save Changes"}
                </Button>
              </motion.div>
            </motion.div>
          )}

          {activeSection === "integrations" && (
            <motion.div variants={staggerContainer} initial="hidden" animate="visible">
              <motion.h2 variants={staggerItem} className="text-xl font-semibold text-[var(--text-primary)] tracking-[-0.02em] mb-6">Integrations</motion.h2>
              <motion.div variants={staggerItem} className="space-y-3">
                {connectionList.map(({ provider, name: provName, desc, status, detail }) => {
                  const Icon = integrationIcons[provider] || Mail;
                  return (
                    <div key={provider} className="flex items-center gap-4 rounded-xl border border-[var(--border-subtle)] bg-[var(--background-elevated)] p-4">
                      <div className="h-10 w-10 rounded-lg bg-[var(--surface-hover)] flex items-center justify-center shrink-0">
                        <Icon size={18} className="text-[var(--text-secondary)]" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-medium text-[var(--text-primary)]">{provName}</p>
                          <div className={`w-1.5 h-1.5 rounded-full ${
                            status === "active" ? "bg-[var(--status-success)]" :
                            status === "syncing" ? "bg-[var(--status-warning)]" :
                            "bg-[var(--text-tertiary)]"
                          }`} />
                        </div>
                        <p className="text-xs text-[var(--text-tertiary)]">{detail}</p>
                      </div>
                      <Button
                        variant={status === "disconnected" ? "blue" : "ghost"}
                        size="sm"
                        onClick={() => status === "disconnected" && handleConnect(provider)}
                        disabled={connectingProvider === provider}
                      >
                        {connectingProvider === provider ? "Connecting..." : status === "disconnected" ? "Connect" : "Configure"}
                      </Button>
                    </div>
                  );
                })}
              </motion.div>
            </motion.div>
          )}

          {activeSection === "tone" && (
            <motion.div variants={staggerContainer} initial="hidden" animate="visible">
              <motion.h2 variants={staggerItem} className="text-xl font-semibold text-[var(--text-primary)] tracking-[-0.02em] mb-6">Tone Calibration</motion.h2>
              <motion.div variants={staggerItem} className="rounded-xl border border-[var(--border-subtle)] bg-[var(--background-elevated)] p-8 mb-8">
                <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-4">DNA Visualizer</h3>
                <div className="flex items-center justify-center">
                  <svg viewBox="0 0 200 200" className="w-48 h-48">
                    {[0, 1, 2, 3].map((i) => {
                      const angle = (i * Math.PI * 2) / 4 - Math.PI / 2;
                      return <line key={i} x1="100" y1="100" x2={100 + Math.cos(angle) * 80} y2={100 + Math.sin(angle) * 80} stroke="var(--text-tertiary)" strokeWidth="0.5" opacity="0.3" />;
                    })}
                    {[20, 40, 60, 80].map((r) => (
                      <circle key={r} cx="100" cy="100" r={r} fill="none" stroke="var(--text-tertiary)" strokeWidth="0.5" opacity="0.15" />
                    ))}
                    <polygon
                      points={[toneDimensions.formality, toneDimensions.length, toneDimensions.warmth, toneDimensions.certainty]
                        .map((d, i) => {
                          const angle = (i * Math.PI * 2) / 4 - Math.PI / 2;
                          const r = (d / 10) * 80;
                          return `${100 + Math.cos(angle) * r},${100 + Math.sin(angle) * r}`;
                        }).join(" ")}
                      fill="rgba(59, 130, 246, 0.1)" stroke="var(--aiva-blue)" strokeWidth="1.5"
                    />
                    <text x="100" y="10" textAnchor="middle" fill="var(--text-secondary)" fontSize="9">Formality ({toneDimensions.formality})</text>
                    <text x="190" y="105" textAnchor="start" fill="var(--text-secondary)" fontSize="9">Length ({toneDimensions.length})</text>
                    <text x="100" y="195" textAnchor="middle" fill="var(--text-secondary)" fontSize="9">Warmth ({toneDimensions.warmth})</text>
                    <text x="10" y="105" textAnchor="end" fill="var(--text-secondary)" fontSize="9">Certainty ({toneDimensions.certainty})</text>
                  </svg>
                </div>
              </motion.div>

              <motion.div variants={staggerItem} className="space-y-6">
                {[
                  { label: "Formality", value: toneDimensions.formality * 10, desc: "Casual <-> Formal" },
                  { label: "Length", value: toneDimensions.length * 10, desc: "Concise <-> Detailed" },
                  { label: "Warmth", value: toneDimensions.warmth * 10, desc: "Reserved <-> Friendly" },
                  { label: "Certainty", value: toneDimensions.certainty * 10, desc: "Tentative <-> Assertive" },
                ].map((dim) => (
                  <div key={dim.label}>
                    <div className="flex justify-between mb-2">
                      <div>
                        <p className="text-sm font-medium text-[var(--text-primary)]">{dim.label}</p>
                        <p className="text-[10px] text-[var(--text-tertiary)]">{dim.desc}</p>
                      </div>
                      <span className="text-sm font-mono text-[var(--text-secondary)]">{(dim.value / 10).toFixed(1)}</span>
                    </div>
                    <Slider defaultValue={[dim.value]} min={10} max={100} step={5} />
                  </div>
                ))}
                <Button variant="secondary" onClick={handleRecalibrate} disabled={isRecalibrating}>
                  <RefreshCw size={14} className={isRecalibrating ? "animate-spin" : ""} />
                  {isRecalibrating ? "Recalibrating..." : "Recalibrate from Sent Mail"}
                </Button>
                {isRecalibrating && <ProgressBar value={65} />}
              </motion.div>
            </motion.div>
          )}

          {activeSection === "vault" && (
            <motion.div variants={staggerContainer} initial="hidden" animate="visible">
              <motion.h2 variants={staggerItem} className="text-xl font-semibold text-[var(--text-primary)] tracking-[-0.02em] mb-6">Safety Vault</motion.h2>
              <motion.div variants={staggerItem}>
                <Button variant="destructive" className="w-full mb-8">
                  <AlertTriangle size={14} /> Halt All Automation (Draft-Only Mode)
                </Button>
              </motion.div>

              <motion.div variants={staggerItem} className="mb-8">
                <div className="flex justify-between mb-1">
                  <p className="text-sm font-medium text-[var(--text-primary)]">Auto-Send Confidence Threshold</p>
                  <span className="text-sm font-mono text-[var(--text-secondary)] border border-[var(--border-subtle)] rounded px-2 py-0.5">
                    {(confidenceThreshold[0] / 100).toFixed(2)}
                  </span>
                </div>
                <p className="text-xs text-[var(--text-tertiary)] mb-3">AIVA will only dispatch messages that score above this threshold.</p>
                <Slider value={confidenceThreshold} onValueChange={setConfidenceThreshold} min={70} max={95} step={1} />
              </motion.div>

              <motion.div variants={staggerItem} className="space-y-0 mb-6">
                {[
                  { icon: Zap, label: "Auto-Send Enabled", desc: "Allow AIVA to dispatch approved drafts", state: autoSendEnabled, set: setAutoSendEnabled },
                  { icon: ShieldAlert, label: "Require VIP Approval", desc: "Never auto-send to VIP contacts", state: vipApproval, set: setVipApproval },
                  { icon: DollarSign, label: "Block Pricing & Legal Topics", desc: "Halt on invoices, contracts, refunds", state: blockPricing, set: setBlockPricing },
                  { icon: Clock, label: "Working Hours Only", desc: "Only auto-send during business hours", state: timeWindow, set: setTimeWindow },
                  { icon: Clock, label: "Allow After-Hours", desc: "Override working hours restriction", state: afterHours, set: setAfterHours },
                ].map(({ icon: Icon, label, desc, state, set }) => (
                  <div key={label} className="flex items-center gap-3 h-14 border-b border-[var(--border-subtle)] last:border-b-0">
                    <Icon size={16} className="text-[var(--text-secondary)] shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-[var(--text-primary)]">{label}</p>
                      <p className="text-[10px] text-[var(--text-tertiary)]">{desc}</p>
                    </div>
                    <ToggleSwitch checked={state} onCheckedChange={set} />
                  </div>
                ))}
              </motion.div>
              <Button variant="primary" onClick={handleSaveVault} disabled={isSaving}>
                {isSaving ? "Saving..." : "Save Automation Rules"}
              </Button>
            </motion.div>
          )}

          {activeSection === "billing" && (
            <motion.div variants={staggerContainer} initial="hidden" animate="visible">
              <motion.h2 variants={staggerItem} className="text-xl font-semibold text-[var(--text-primary)] tracking-[-0.02em] mb-6">Billing</motion.h2>
              <motion.div variants={staggerItem} className="rounded-xl border border-[var(--aiva-blue-border)] bg-[var(--background-elevated)] p-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <p className="text-lg font-semibold text-[var(--text-primary)]">Free Plan</p>
                    <p className="text-sm text-[var(--text-secondary)]">$0/month</p>
                  </div>
                  <Badge variant="blue">Active</Badge>
                </div>
                <ProgressBar value={0} />
                <p className="text-xs text-[var(--text-tertiary)] mt-1">0 / 100 AI drafts used this month</p>
                <p className="text-xs text-[var(--text-tertiary)] mt-3">Upgrade to unlock unlimited AI drafts, priority support, and advanced integrations.</p>
              </motion.div>
            </motion.div>
          )}

          {activeSection === "security" && (
            <motion.div variants={staggerContainer} initial="hidden" animate="visible">
              <motion.h2 variants={staggerItem} className="text-xl font-semibold text-[var(--text-primary)] tracking-[-0.02em] mb-6">Security</motion.h2>
              <motion.div variants={staggerItem} className="space-y-4">
                <div className="flex items-center gap-3 h-14 border-b border-[var(--border-subtle)]">
                  <Lock size={16} className="text-[var(--text-secondary)]" />
                  <div className="flex-1">
                    <p className="text-sm text-[var(--text-primary)]">Continuous Learning (Delta Feedback)</p>
                    <p className="text-[10px] text-[var(--text-tertiary)]">AIVA learns from your edits to drafts</p>
                  </div>
                  <ToggleSwitch defaultChecked />
                </div>
                <div className="flex items-center gap-3 h-14 border-b border-[var(--border-subtle)]">
                  <FileText size={16} className="text-[var(--text-secondary)]" />
                  <div className="flex-1">
                    <p className="text-sm text-[var(--text-primary)]">Export Data</p>
                    <p className="text-[10px] text-[var(--text-tertiary)]">Download all your AIVA data</p>
                  </div>
                  <Button variant="ghost" size="sm">Export</Button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
}
