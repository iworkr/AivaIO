"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
  Button, Input, Textarea, Badge, Card, CardHeader, CardTitle, CardDescription, CardContent,
  ToggleSwitch, Slider, Avatar, Toast, LoadingBar, ProgressBar, EmptyState,
  CommandPalette, CommandItem, CommandGroup, DataRow, BentoCard,
} from "@/components/ui";
import { linearFadeIn, staggerContainer, staggerItem, viewportOnce } from "@/lib/animations";
import {
  Inbox, Star, FileText, CheckCircle, Settings, Moon, Sun, Search, Mail,
  MessageSquare, ShoppingBag, Zap, ArrowRight, Shield, Clock, Sparkles,
} from "lucide-react";

const colors = [
  { name: "Background Main", var: "--background-main", value: "#000000" },
  { name: "Background Elevated", var: "--background-elevated", value: "#0A0A0A" },
  { name: "Background Sidebar", var: "--background-sidebar", value: "#050505" },
  { name: "Text Primary", var: "--text-primary", value: "#F4F4F5" },
  { name: "Text Secondary", var: "--text-secondary", value: "#A1A1AA" },
  { name: "Text Tertiary", var: "--text-tertiary", value: "#52525B" },
  { name: "AIVA Blue", var: "--aiva-blue", value: "#3B82F6" },
  { name: "Blue Glow", var: "--aiva-blue-glow", value: "rgba(59,130,246,0.15)" },
  { name: "Border Subtle", var: "--border-subtle", value: "rgba(255,255,255,0.08)" },
  { name: "Border Glow", var: "--border-glow", value: "rgba(255,255,255,0.15)" },
  { name: "Success", var: "--status-success", value: "#4ADE80" },
  { name: "Warning", var: "--status-warning", value: "#FBBF24" },
  { name: "Error", var: "--status-error", value: "#F87171" },
];

export default function DesignSystemPage() {
  const [switchOn, setSwitchOn] = useState(true);
  const [sliderVal, setSliderVal] = useState([85]);
  const [cmdOpen, setCmdOpen] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [isDark, setIsDark] = useState(true);

  const toggleTheme = () => {
    setIsDark(!isDark);
    document.documentElement.classList.toggle("light");
    document.documentElement.classList.toggle("dark");
  };

  return (
    <div className="min-h-screen bg-[var(--background-main)]">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-[var(--border-subtle)] bg-[var(--background-main)]/80 backdrop-blur-xl">
        <div className="max-w-6xl mx-auto px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src="/aiva-mark.svg" alt="AIVA" className="h-7 w-7" />
            <span className="text-lg font-semibold text-[var(--text-primary)] tracking-[-0.02em]">
              Design System
            </span>
            <Badge variant="blue" size="sm">v2.0</Badge>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={toggleTheme}>
              {isDark ? <Sun size={16} /> : <Moon size={16} />}
            </Button>
            <Button variant="secondary" size="sm" onClick={() => setCmdOpen(true)}>
              <Search size={14} />
              <span className="hidden sm:inline">Cmd+K</span>
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-8 py-16 space-y-32">
        {/* Hero */}
        <motion.section variants={linearFadeIn} initial="hidden" animate="visible">
          <p className="text-sm font-medium text-[var(--aiva-blue)] mb-3 tracking-[0.06em] uppercase">
            Brand & Design Map
          </p>
          <h1 className="text-5xl font-bold text-[var(--text-primary)] tracking-[-0.04em] mb-4">
            AIVA Design System
          </h1>
          <p className="text-lg text-[var(--text-secondary)] max-w-2xl leading-relaxed">
            The mathematical system of spacing, typography, color, and motion that defines
            every pixel of the AIVA experience. Linear aesthetic, pure black default.
          </p>
        </motion.section>

        {/* Color Palette */}
        <motion.section variants={staggerContainer} initial="hidden" whileInView="visible" viewport={viewportOnce}>
          <motion.h2 variants={staggerItem} className="text-2xl font-semibold text-[var(--text-primary)] tracking-[-0.02em] mb-2">
            Color Palette
          </motion.h2>
          <motion.p variants={staggerItem} className="text-sm text-[var(--text-secondary)] mb-8">
            Natively dark. Ultra-low contrast borders. Intentional blue accents.
          </motion.p>
          <motion.div variants={staggerItem} className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {colors.map((c) => (
              <div key={c.var} className="group">
                <div
                  className="h-20 rounded-lg border border-[var(--border-subtle)] mb-2 transition-transform duration-150 group-hover:scale-105"
                  style={{ background: `var(${c.var})` }}
                />
                <p className="text-xs font-medium text-[var(--text-primary)]">{c.name}</p>
                <p className="text-[10px] font-mono text-[var(--text-tertiary)]">{c.value}</p>
              </div>
            ))}
          </motion.div>
        </motion.section>

        {/* Typography */}
        <motion.section variants={staggerContainer} initial="hidden" whileInView="visible" viewport={viewportOnce}>
          <motion.h2 variants={staggerItem} className="text-2xl font-semibold text-[var(--text-primary)] tracking-[-0.02em] mb-2">
            Typography
          </motion.h2>
          <motion.p variants={staggerItem} className="text-sm text-[var(--text-secondary)] mb-8">
            Inter for UI. JetBrains Mono for data. Tight tracking on headers.
          </motion.p>
          <motion.div variants={staggerItem} className="space-y-6">
            <div className="border-b border-[var(--border-subtle)] pb-4">
              <p className="text-[10px] font-mono text-[var(--text-tertiary)] mb-1 uppercase tracking-[0.06em]">H1 / Inter Bold / -0.04em</p>
              <h1 className="text-5xl font-bold text-[var(--text-primary)] tracking-[-0.04em]">The AI executive assistant</h1>
            </div>
            <div className="border-b border-[var(--border-subtle)] pb-4">
              <p className="text-[10px] font-mono text-[var(--text-tertiary)] mb-1 uppercase tracking-[0.06em]">H2 / Inter Semibold / -0.02em</p>
              <h2 className="text-3xl font-semibold text-[var(--text-primary)] tracking-[-0.02em]">Unified Inbox</h2>
            </div>
            <div className="border-b border-[var(--border-subtle)] pb-4">
              <p className="text-[10px] font-mono text-[var(--text-tertiary)] mb-1 uppercase tracking-[0.06em]">H3 / Inter Semibold / -0.02em</p>
              <h3 className="text-xl font-semibold text-[var(--text-primary)] tracking-[-0.02em]">AI Priority Engine</h3>
            </div>
            <div className="border-b border-[var(--border-subtle)] pb-4">
              <p className="text-[10px] font-mono text-[var(--text-tertiary)] mb-1 uppercase tracking-[0.06em]">Body / Inter Regular</p>
              <p className="text-sm text-[var(--text-secondary)] leading-relaxed">Connect Gmail, Slack, and Shopify. AIVA prioritizes what matters, drafts replies in your tone, and auto-sends the routine.</p>
            </div>
            <div className="border-b border-[var(--border-subtle)] pb-4">
              <p className="text-[10px] font-mono text-[var(--text-tertiary)] mb-1 uppercase tracking-[0.06em]">Mono / JetBrains Mono</p>
              <p className="text-sm font-mono text-[var(--text-secondary)]">confidence: 0.92 | gate_6: PASS | auto_send: true</p>
            </div>
            <div>
              <p className="text-[10px] font-mono text-[var(--text-tertiary)] mb-1 uppercase tracking-[0.06em]">Micro / Uppercase / 0.06em</p>
              <p className="text-[10px] font-medium text-[var(--text-tertiary)] uppercase tracking-[0.06em]">VIP &middot; URGENT &middot; NEW &middot; FYI</p>
            </div>
          </motion.div>
        </motion.section>

        {/* Spacing */}
        <motion.section variants={staggerContainer} initial="hidden" whileInView="visible" viewport={viewportOnce}>
          <motion.h2 variants={staggerItem} className="text-2xl font-semibold text-[var(--text-primary)] tracking-[-0.02em] mb-2">
            Spacing Grid (8pt)
          </motion.h2>
          <motion.p variants={staggerItem} className="text-sm text-[var(--text-secondary)] mb-8">
            Every margin, padding, and height is a multiple of 8.
          </motion.p>
          <motion.div variants={staggerItem} className="flex items-end gap-3 flex-wrap">
            {[8, 16, 24, 32, 48, 64, 96, 128].map((px) => (
              <div key={px} className="flex flex-col items-center gap-2">
                <div
                  className="bg-[var(--aiva-blue-glow)] border border-[var(--aiva-blue)] rounded"
                  style={{ width: px, height: px, maxWidth: 128, maxHeight: 128 }}
                />
                <span className="text-[10px] font-mono text-[var(--text-tertiary)]">{px}px</span>
              </div>
            ))}
          </motion.div>
        </motion.section>

        {/* Buttons */}
        <motion.section variants={staggerContainer} initial="hidden" whileInView="visible" viewport={viewportOnce}>
          <motion.h2 variants={staggerItem} className="text-2xl font-semibold text-[var(--text-primary)] tracking-[-0.02em] mb-2">
            Buttons
          </motion.h2>
          <motion.p variants={staggerItem} className="text-sm text-[var(--text-secondary)] mb-8">
            Restrained palette. Primary inverts on dark. Blue for critical CTAs only.
          </motion.p>
          <motion.div variants={staggerItem} className="flex flex-wrap gap-3 mb-6">
            <Button variant="primary">Primary</Button>
            <Button variant="secondary">Secondary</Button>
            <Button variant="ghost">Ghost</Button>
            <Button variant="blue">AIVA Blue</Button>
            <Button variant="destructive">Destructive</Button>
            <Button variant="link">Link</Button>
          </motion.div>
          <motion.div variants={staggerItem} className="flex flex-wrap gap-3 mb-6">
            <Button size="sm">Small</Button>
            <Button size="md">Medium</Button>
            <Button size="lg">Large</Button>
            <Button size="xl">Extra Large</Button>
            <Button size="icon"><Sparkles size={16} /></Button>
          </motion.div>
          <motion.div variants={staggerItem} className="flex flex-wrap gap-3">
            <Button disabled>Disabled</Button>
            <Button variant="primary"><Mail size={14} /> With Icon</Button>
            <Button variant="secondary">Action <ArrowRight size={14} /></Button>
          </motion.div>
        </motion.section>

        {/* Inputs */}
        <motion.section variants={staggerContainer} initial="hidden" whileInView="visible" viewport={viewportOnce}>
          <motion.h2 variants={staggerItem} className="text-2xl font-semibold text-[var(--text-primary)] tracking-[-0.02em] mb-2">
            Inputs
          </motion.h2>
          <motion.div variants={staggerItem} className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-2xl">
            <div>
              <label className="text-xs text-[var(--text-secondary)] mb-1.5 block">Email</label>
              <Input placeholder="you@company.com" />
            </div>
            <div>
              <label className="text-xs text-[var(--text-secondary)] mb-1.5 block">API Key</label>
              <Input placeholder="sk-..." className="font-mono" />
            </div>
            <div className="md:col-span-2">
              <label className="text-xs text-[var(--text-secondary)] mb-1.5 block">Message</label>
              <Textarea placeholder="Draft your reply..." />
            </div>
          </motion.div>
        </motion.section>

        {/* Badges */}
        <motion.section variants={staggerContainer} initial="hidden" whileInView="visible" viewport={viewportOnce}>
          <motion.h2 variants={staggerItem} className="text-2xl font-semibold text-[var(--text-primary)] tracking-[-0.02em] mb-2">
            Badges & Pills
          </motion.h2>
          <motion.div variants={staggerItem} className="flex flex-wrap gap-3">
            <Badge variant="urgent" size="sm">URGENT</Badge>
            <Badge variant="high" size="sm">HIGH</Badge>
            <Badge variant="success" size="sm">SENT</Badge>
            <Badge variant="blue" size="sm">NEW</Badge>
            <Badge variant="fyi" size="sm">FYI</Badge>
            <Badge variant="outline">Draft Ready</Badge>
            <Badge variant="default">12 unread</Badge>
          </motion.div>
        </motion.section>

        {/* Cards */}
        <motion.section variants={staggerContainer} initial="hidden" whileInView="visible" viewport={viewportOnce}>
          <motion.h2 variants={staggerItem} className="text-2xl font-semibold text-[var(--text-primary)] tracking-[-0.02em] mb-2">
            Cards
          </motion.h2>
          <motion.div variants={staggerItem} className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Standard Card</CardTitle>
                <CardDescription>Elevated background with subtle border</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-[var(--text-secondary)]">Card body content goes here.</p>
              </CardContent>
            </Card>
            <BentoCard>
              <h3 className="text-base font-semibold text-[var(--text-primary)] tracking-[-0.02em] mb-2">Bento Card</h3>
              <p className="text-sm text-[var(--text-secondary)]">For feature showcase grids. Hover to brighten.</p>
            </BentoCard>
            <Card className="border-[var(--aiva-blue-border)]">
              <CardHeader>
                <CardTitle>Highlighted</CardTitle>
                <CardDescription>Blue glow border for featured items</CardDescription>
              </CardHeader>
            </Card>
          </motion.div>
        </motion.section>

        {/* Controls */}
        <motion.section variants={staggerContainer} initial="hidden" whileInView="visible" viewport={viewportOnce}>
          <motion.h2 variants={staggerItem} className="text-2xl font-semibold text-[var(--text-primary)] tracking-[-0.02em] mb-2">
            Controls
          </motion.h2>
          <motion.div variants={staggerItem} className="space-y-8 max-w-md">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-[var(--text-primary)]">Auto-Send Enabled</p>
                <p className="text-xs text-[var(--text-tertiary)]">Allow AI to dispatch approved drafts</p>
              </div>
              <ToggleSwitch checked={switchOn} onCheckedChange={setSwitchOn} />
            </div>
            <div>
              <div className="flex justify-between mb-3">
                <p className="text-sm font-medium text-[var(--text-primary)]">Confidence Threshold</p>
                <span className="text-sm font-mono text-[var(--text-secondary)] border border-[var(--border-subtle)] rounded px-2 py-0.5">
                  {(sliderVal[0] / 100).toFixed(2)}
                </span>
              </div>
              <Slider
                value={sliderVal}
                onValueChange={setSliderVal}
                min={70}
                max={95}
                step={1}
              />
            </div>
          </motion.div>
        </motion.section>

        {/* Data Row */}
        <motion.section variants={staggerContainer} initial="hidden" whileInView="visible" viewport={viewportOnce}>
          <motion.h2 variants={staggerItem} className="text-2xl font-semibold text-[var(--text-primary)] tracking-[-0.02em] mb-2">
            Data Rows (48px)
          </motion.h2>
          <motion.p variants={staggerItem} className="text-sm text-[var(--text-secondary)] mb-4">
            High-density inbox list items. Hover to reveal actions.
          </motion.p>
          <motion.div variants={staggerItem} className="border border-[var(--border-subtle)] rounded-xl overflow-hidden">
            <DataRow>
              <Mail size={16} className="text-[var(--text-tertiary)] shrink-0" />
              <Badge variant="urgent" size="sm">URGENT</Badge>
              <span className="text-sm font-medium text-[var(--text-primary)] truncate w-24">Sarah Chen</span>
              <span className="text-sm text-[var(--text-secondary)] truncate flex-1">Re: Q4 Revenue Report — need your sign-off by EOD</span>
              <Sparkles size={14} className="text-[var(--aiva-blue)] shrink-0" />
              <span className="text-xs font-mono text-[var(--text-tertiary)] shrink-0">2m ago</span>
            </DataRow>
            <DataRow>
              <MessageSquare size={16} className="text-[var(--text-tertiary)] shrink-0" />
              <Badge variant="fyi" size="sm">FYI</Badge>
              <span className="text-sm font-medium text-[var(--text-primary)] truncate w-24">James Wright</span>
              <span className="text-sm text-[var(--text-secondary)] truncate flex-1">Slack: Updated the deployment docs, FYI</span>
              <span className="text-xs font-mono text-[var(--text-tertiary)] shrink-0">1h ago</span>
            </DataRow>
            <DataRow>
              <ShoppingBag size={16} className="text-[var(--text-tertiary)] shrink-0" />
              <Badge variant="high" size="sm">HIGH</Badge>
              <span className="text-sm font-medium text-[var(--text-primary)] truncate w-24">Emily Torres</span>
              <span className="text-sm text-[var(--text-secondary)] truncate flex-1">Where is my order? Order #1042 — Blue Widgets x2</span>
              <Sparkles size={14} className="text-[var(--aiva-blue)] shrink-0" />
              <span className="text-xs font-mono text-[var(--text-tertiary)] shrink-0">3h ago</span>
            </DataRow>
          </motion.div>
        </motion.section>

        {/* Avatars & Status */}
        <motion.section variants={staggerContainer} initial="hidden" whileInView="visible" viewport={viewportOnce}>
          <motion.h2 variants={staggerItem} className="text-2xl font-semibold text-[var(--text-primary)] tracking-[-0.02em] mb-2">
            Avatars & Status Indicators
          </motion.h2>
          <motion.div variants={staggerItem} className="flex items-center gap-4 mb-6">
            <Avatar initials="SC" size="sm" />
            <Avatar initials="JW" size="md" />
            <Avatar initials="ET" size="lg" />
          </motion.div>
          <motion.div variants={staggerItem} className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-[var(--status-success)]" />
              <span className="text-xs text-[var(--text-secondary)]">Active</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-[var(--status-warning)]" />
              <span className="text-xs text-[var(--text-secondary)]">Syncing</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-[var(--status-error)]" />
              <span className="text-xs text-[var(--text-secondary)]">Disconnected</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-[var(--text-tertiary)]" />
              <span className="text-xs text-[var(--text-secondary)]">Inactive</span>
            </div>
          </motion.div>
        </motion.section>

        {/* Loading & Progress */}
        <motion.section variants={staggerContainer} initial="hidden" whileInView="visible" viewport={viewportOnce}>
          <motion.h2 variants={staggerItem} className="text-2xl font-semibold text-[var(--text-primary)] tracking-[-0.02em] mb-2">
            Loading & Progress
          </motion.h2>
          <motion.div variants={staggerItem} className="space-y-6 max-w-md">
            <div>
              <p className="text-xs text-[var(--text-tertiary)] mb-2">Top-edge loading bar (fixed position)</p>
              <LoadingBar />
            </div>
            <div>
              <p className="text-xs text-[var(--text-tertiary)] mb-2">Progress bar (92%)</p>
              <ProgressBar value={92} />
            </div>
            <div>
              <p className="text-xs text-[var(--text-tertiary)] mb-2">Progress bar (45%)</p>
              <ProgressBar value={45} />
            </div>
          </motion.div>
        </motion.section>

        {/* Empty State */}
        <motion.section variants={staggerContainer} initial="hidden" whileInView="visible" viewport={viewportOnce}>
          <motion.h2 variants={staggerItem} className="text-2xl font-semibold text-[var(--text-primary)] tracking-[-0.02em] mb-2">
            Empty States
          </motion.h2>
          <motion.div variants={staggerItem} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <EmptyState
                icon={<CheckCircle size={32} />}
                title="Inbox Zero. All channels clear."
              />
            </Card>
            <Card>
              <EmptyState
                icon={<Shield size={32} />}
                title="Connection lost."
                description="Re-authenticate Shopify to restore order context."
                action={<Button variant="secondary" size="sm">Reconnect</Button>}
              />
            </Card>
          </motion.div>
        </motion.section>

        {/* Animations */}
        <motion.section variants={staggerContainer} initial="hidden" whileInView="visible" viewport={viewportOnce}>
          <motion.h2 variants={staggerItem} className="text-2xl font-semibold text-[var(--text-primary)] tracking-[-0.02em] mb-2">
            Animation Principles
          </motion.h2>
          <motion.p variants={staggerItem} className="text-sm text-[var(--text-secondary)] mb-8">
            Instantaneous. Deliberate. Mechanical. No bouncy springs.
          </motion.p>
          <motion.div variants={staggerItem} className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardContent className="pt-4">
                <p className="text-xs font-mono text-[var(--text-tertiary)] mb-2">Hover Brighten (150ms)</p>
                <p className="text-sm text-[var(--text-secondary)] transition-colors duration-150 hover:text-[var(--text-primary)] cursor-default">
                  Hover over this text to brighten
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4">
                <p className="text-xs font-mono text-[var(--text-tertiary)] mb-2">ease: cubic-bezier(0.16, 1, 0.3, 1)</p>
                <p className="text-xs text-[var(--text-secondary)]">600ms fade-in with 12px upward slide. Used on every scroll-reveal section.</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4">
                <p className="text-xs font-mono text-[var(--text-tertiary)] mb-2">Theme Transition (300ms)</p>
                <p className="text-xs text-[var(--text-secondary)]">Global cross-fade on all CSS variables.</p>
              </CardContent>
            </Card>
          </motion.div>
        </motion.section>

        {/* Logo Placement */}
        <motion.section variants={staggerContainer} initial="hidden" whileInView="visible" viewport={viewportOnce}>
          <motion.h2 variants={staggerItem} className="text-2xl font-semibold text-[var(--text-primary)] tracking-[-0.02em] mb-2">
            Logo & Brand Mark
          </motion.h2>
          <motion.div variants={staggerItem} className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-[var(--background-main)] border border-[var(--border-subtle)] rounded-xl p-8 flex items-center justify-center">
              <img src="/aiva-logo-dark.svg" alt="AIVA Logo Dark" className="h-8" />
            </div>
            <div className="bg-white border border-[var(--border-subtle)] rounded-xl p-8 flex items-center justify-center">
              <img src="/aiva-logo-light.svg" alt="AIVA Logo Light" className="h-8" />
            </div>
            <div className="bg-[var(--background-elevated)] border border-[var(--border-subtle)] rounded-xl p-8 flex items-center justify-center gap-4">
              <img src="/aiva-mark.svg" alt="AIVA Mark" className="h-10 w-10" />
              <img src="/aiva-mark-light.svg" alt="AIVA Mark Light" className="h-10 w-10" />
            </div>
          </motion.div>
        </motion.section>

        {/* Interactive Demo */}
        <motion.section variants={staggerContainer} initial="hidden" whileInView="visible" viewport={viewportOnce}>
          <motion.h2 variants={staggerItem} className="text-2xl font-semibold text-[var(--text-primary)] tracking-[-0.02em] mb-2">
            Interactive Demo
          </motion.h2>
          <motion.div variants={staggerItem} className="flex flex-wrap gap-3">
            <Button variant="secondary" onClick={() => setCmdOpen(true)}>
              <Search size={14} /> Open Command Palette
            </Button>
            <Button variant="secondary" onClick={() => setShowToast(true)}>
              <Sparkles size={14} /> Show Toast
            </Button>
            <Button variant="secondary" onClick={toggleTheme}>
              {isDark ? <Sun size={14} /> : <Moon size={14} />}
              Toggle Theme
            </Button>
          </motion.div>
        </motion.section>
      </main>

      {/* Footer */}
      <footer className="border-t border-[var(--border-subtle)] mt-32">
        <div className="max-w-6xl mx-auto px-8 py-8 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <img src="/aiva-mark.svg" alt="" className="h-5 w-5" />
            <span className="text-sm text-[var(--text-tertiary)]">AIVA Design System v2.0</span>
          </div>
          <p className="text-xs text-[var(--text-tertiary)]">Built for the future. Available today.</p>
        </div>
      </footer>

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

      <Toast
        visible={showToast}
        onClose={() => setShowToast(false)}
        icon={<Sparkles size={14} className="text-[var(--aiva-blue)]" />}
        message='AIVA learned your preference for "Sounds good" over "Acknowledged".'
      />
    </div>
  );
}
