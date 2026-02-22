"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Button, Input, Slider, ToggleSwitch, Badge, Avatar, Card, CardContent, ProgressBar } from "@/components/ui";
import { staggerContainer, staggerItem, viewportOnce } from "@/lib/animations";
import {
  User, Link2, Sliders, Shield, CreditCard, Lock,
  Mail, Hash, Phone, ShoppingBag, RefreshCw,
  ShieldAlert, Clock, FileText, DollarSign, Zap, AlertTriangle,
} from "lucide-react";

const settingsSections = [
  { id: "profile", icon: User, label: "Profile" },
  { id: "integrations", icon: Link2, label: "Integrations" },
  { id: "tone", icon: Sliders, label: "Tone Calibration" },
  { id: "vault", icon: Shield, label: "Safety Vault" },
  { id: "billing", icon: CreditCard, label: "Billing" },
  { id: "security", icon: Lock, label: "Security" },
];

export default function SettingsPage() {
  const [activeSection, setActiveSection] = useState("profile");
  const [confidenceThreshold, setConfidenceThreshold] = useState([85]);
  const [autoSendEnabled, setAutoSendEnabled] = useState(true);
  const [vipApproval, setVipApproval] = useState(true);
  const [blockPricing, setBlockPricing] = useState(true);
  const [timeWindow, setTimeWindow] = useState(true);
  const [afterHours, setAfterHours] = useState(false);

  return (
    <div className="h-screen flex overflow-hidden">
      {/* Settings nav */}
      <div className="w-52 shrink-0 border-r border-[var(--border-subtle)] py-4 px-2 overflow-y-auto">
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
              <Icon size={14} />
              {section.label}
            </button>
          );
        })}
      </div>

      {/* Content pane */}
      <div className="flex-1 overflow-y-auto py-8">
        <div className="max-w-xl mx-auto px-6">
          {/* Profile */}
          {activeSection === "profile" && (
            <motion.div variants={staggerContainer} initial="hidden" animate="visible">
              <motion.h2 variants={staggerItem} className="text-xl font-semibold text-[var(--text-primary)] tracking-[-0.02em] mb-6">
                Profile
              </motion.h2>
              <motion.div variants={staggerItem} className="space-y-4">
                <div className="flex items-center gap-4 mb-6">
                  <Avatar initials="JD" size="lg" />
                  <Button variant="secondary" size="sm">Change avatar</Button>
                </div>
                <div>
                  <label className="text-xs text-[var(--text-secondary)] mb-1.5 block">Full Name</label>
                  <Input defaultValue="John Doe" />
                </div>
                <div>
                  <label className="text-xs text-[var(--text-secondary)] mb-1.5 block">Email</label>
                  <Input defaultValue="john@acme.com" disabled />
                </div>
                <Button variant="primary" size="md">Save Changes</Button>
              </motion.div>
            </motion.div>
          )}

          {/* Integrations */}
          {activeSection === "integrations" && (
            <motion.div variants={staggerContainer} initial="hidden" animate="visible">
              <motion.h2 variants={staggerItem} className="text-xl font-semibold text-[var(--text-primary)] tracking-[-0.02em] mb-6">
                Integrations
              </motion.h2>
              <motion.div variants={staggerItem} className="space-y-3">
                {[
                  { icon: Mail, name: "Gmail", status: "active", detail: "Connected. Last synced 2m ago." },
                  { icon: Hash, name: "Slack", status: "active", detail: "Connected. 12 channels monitored." },
                  { icon: Phone, name: "WhatsApp", status: "disconnected", detail: "Not connected." },
                  { icon: ShoppingBag, name: "Shopify", status: "active", detail: "Connected. 340 orders synced." },
                ].map(({ icon: Icon, name, status, detail }) => (
                  <div key={name} className="flex items-center gap-4 rounded-xl border border-[var(--border-subtle)] bg-[var(--background-elevated)] p-4">
                    <div className="h-10 w-10 rounded-lg bg-[var(--surface-hover)] flex items-center justify-center shrink-0">
                      <Icon size={18} className="text-[var(--text-secondary)]" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium text-[var(--text-primary)]">{name}</p>
                        <div className={`w-1.5 h-1.5 rounded-full ${
                          status === "active" ? "bg-[var(--status-success)]" :
                          status === "syncing" ? "bg-[var(--status-warning)]" :
                          "bg-[var(--text-tertiary)]"
                        }`} />
                      </div>
                      <p className="text-xs text-[var(--text-tertiary)]">{detail}</p>
                    </div>
                    <Button variant={status === "disconnected" ? "blue" : "ghost"} size="sm">
                      {status === "disconnected" ? "Connect" : "Configure"}
                    </Button>
                  </div>
                ))}
              </motion.div>
            </motion.div>
          )}

          {/* Tone Calibration */}
          {activeSection === "tone" && (
            <motion.div variants={staggerContainer} initial="hidden" animate="visible">
              <motion.h2 variants={staggerItem} className="text-xl font-semibold text-[var(--text-primary)] tracking-[-0.02em] mb-6">
                Tone Calibration
              </motion.h2>

              {/* Radar chart placeholder */}
              <motion.div variants={staggerItem} className="rounded-xl border border-[var(--border-subtle)] bg-[var(--background-elevated)] p-8 mb-8">
                <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-4">DNA Visualizer</h3>
                <div className="flex items-center justify-center">
                  <svg viewBox="0 0 200 200" className="w-48 h-48">
                    {/* Axis lines */}
                    {[0, 1, 2, 3].map((i) => {
                      const angle = (i * Math.PI * 2) / 4 - Math.PI / 2;
                      const x2 = 100 + Math.cos(angle) * 80;
                      const y2 = 100 + Math.sin(angle) * 80;
                      return <line key={i} x1="100" y1="100" x2={x2} y2={y2} stroke="var(--text-tertiary)" strokeWidth="0.5" opacity="0.3" />;
                    })}
                    {/* Grid rings */}
                    {[20, 40, 60, 80].map((r) => (
                      <circle key={r} cx="100" cy="100" r={r} fill="none" stroke="var(--text-tertiary)" strokeWidth="0.5" opacity="0.15" />
                    ))}
                    {/* Data polygon */}
                    <polygon
                      points={(() => {
                        const dims = [6.5, 3.0, 7.0, 8.5];
                        return dims.map((d, i) => {
                          const angle = (i * Math.PI * 2) / 4 - Math.PI / 2;
                          const r = (d / 10) * 80;
                          return `${100 + Math.cos(angle) * r},${100 + Math.sin(angle) * r}`;
                        }).join(" ");
                      })()}
                      fill="rgba(59, 130, 246, 0.1)"
                      stroke="var(--aiva-blue)"
                      strokeWidth="1.5"
                    />
                    {/* Labels */}
                    <text x="100" y="10" textAnchor="middle" fill="var(--text-secondary)" fontSize="9">Formality (6.5)</text>
                    <text x="190" y="105" textAnchor="start" fill="var(--text-secondary)" fontSize="9">Length (3.0)</text>
                    <text x="100" y="195" textAnchor="middle" fill="var(--text-secondary)" fontSize="9">Warmth (7.0)</text>
                    <text x="10" y="105" textAnchor="end" fill="var(--text-secondary)" fontSize="9">Certainty (8.5)</text>
                  </svg>
                </div>
              </motion.div>

              {/* Manual sliders */}
              <motion.div variants={staggerItem} className="space-y-6">
                {[
                  { label: "Formality", value: 65, desc: "Casual ↔ Formal" },
                  { label: "Length", value: 30, desc: "Concise ↔ Detailed" },
                  { label: "Warmth", value: 70, desc: "Reserved ↔ Friendly" },
                  { label: "Certainty", value: 85, desc: "Tentative ↔ Assertive" },
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
                <Button variant="secondary">
                  <RefreshCw size={14} />
                  Recalibrate from Sent Mail
                </Button>
              </motion.div>
            </motion.div>
          )}

          {/* Safety Vault */}
          {activeSection === "vault" && (
            <motion.div variants={staggerContainer} initial="hidden" animate="visible">
              <motion.h2 variants={staggerItem} className="text-xl font-semibold text-[var(--text-primary)] tracking-[-0.02em] mb-6">
                Safety Vault
              </motion.h2>

              {/* Kill switch */}
              <motion.div variants={staggerItem}>
                <Button variant="destructive" className="w-full mb-8">
                  <AlertTriangle size={14} />
                  Halt All Automation (Draft-Only Mode)
                </Button>
              </motion.div>

              {/* Confidence slider */}
              <motion.div variants={staggerItem} className="mb-8">
                <div className="flex justify-between mb-1">
                  <p className="text-sm font-medium text-[var(--text-primary)]">Auto-Send Confidence Threshold</p>
                  <span className="text-sm font-mono text-[var(--text-secondary)] border border-[var(--border-subtle)] rounded px-2 py-0.5">
                    {(confidenceThreshold[0] / 100).toFixed(2)}
                  </span>
                </div>
                <p className="text-xs text-[var(--text-tertiary)] mb-3">
                  AIVA will only dispatch messages that score above this threshold.
                </p>
                <Slider value={confidenceThreshold} onValueChange={setConfidenceThreshold} min={70} max={95} step={1} />
              </motion.div>

              {/* Rule toggles */}
              <motion.div variants={staggerItem} className="space-y-0">
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
            </motion.div>
          )}

          {/* Billing */}
          {activeSection === "billing" && (
            <motion.div variants={staggerContainer} initial="hidden" animate="visible">
              <motion.h2 variants={staggerItem} className="text-xl font-semibold text-[var(--text-primary)] tracking-[-0.02em] mb-6">
                Billing
              </motion.h2>
              <motion.div variants={staggerItem} className="rounded-xl border border-[var(--aiva-blue-border)] bg-[var(--background-elevated)] p-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <p className="text-lg font-semibold text-[var(--text-primary)]">Team Plan</p>
                    <p className="text-sm text-[var(--text-secondary)]">$79/month &middot; 5 seats</p>
                  </div>
                  <Badge variant="blue">Active</Badge>
                </div>
                <ProgressBar value={60} />
                <p className="text-xs text-[var(--text-tertiary)] mt-1">3,000 / 5,000 AI drafts used this month</p>
              </motion.div>
            </motion.div>
          )}

          {/* Security */}
          {activeSection === "security" && (
            <motion.div variants={staggerContainer} initial="hidden" animate="visible">
              <motion.h2 variants={staggerItem} className="text-xl font-semibold text-[var(--text-primary)] tracking-[-0.02em] mb-6">
                Security
              </motion.h2>
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
