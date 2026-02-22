# AIVA.io — Master PRD 4 of 5: The Multi-Channel Unified Inbox & Triage UX

**Document Type:** Detailed Product Requirements Document (PRD)
**System Focus:** Cross-Channel Aggregation, Swipe-to-Approve Architecture, Keyboard-First Navigation, and High-Density List Rendering.
**Design Language:** Linear Aesthetic (Pure Black, Greyscale, `Inter` typography, zero-friction interactions, extreme information density).
**Target Architecture:** Next.js 15 (Web), tRPC, PostgreSQL, React, Flutter (Mobile iOS/Android).

---

## 1. Executive Summary & Engineering Philosophy

Modern communication is fundamentally broken by fragmentation. Professionals lose hours daily context-switching between Gmail, Slack, WhatsApp, and Teams. The cognitive load of checking five different inboxes is the root cause of "inbox anxiety."

AIVA solves this by treating all communication protocols as raw data streams, normalizing them into a single, aggressively unified interface. However, aggregating noise just creates a louder room. Therefore, the Unified Inbox must be paired with an elite **Triage UX**.

This PRD defines the frontend architecture required to render thousands of cross-platform messages without dropping frames. It details the keyboard-first web navigation required for power users and the "Swipe-to-Approve" mobile gestures designed to let executives clear 50 emails during a 5-minute Uber ride.

---

## 2. Visual Architecture & High-Density Layout (Web)

The web application utilizes a strict 3-pane layout, deeply inspired by high-performance developer tools. There is zero wasted whitespace in the list views, but generous whitespace in the reading views.

### 2.1 The 3-Pane Structure

- **Pane 1: The Sidebar (240px fixed).** Background is `#050505`. Contains the Workspace Switcher, primary triage views (Inbox, VIP, Drafts Ready), and connection statuses.
- **Pane 2: The Inbox List (380px fixed).** Background is `#000000`. Separated from the sidebar by a 1px `rgba(255, 255, 255, 0.08)` border. This is a highly virtualized list.
- **Pane 3: The Conversation View (Fluid fill).** Background is `#000000`. This is where the actual thread history and AI Draft Box are rendered.

### 2.2 The 48px List Item Specification

Every row in the Inbox List must adhere to a strict 48px height to maximize scannability without feeling cramped.

- **Container:** `h-[48px]`, `px-4`, `flex`, `items-center`.
- **Hover State:** Background shifts to `rgba(255, 255, 255, 0.03)`. Transition is `150ms ease-out`.
- **Channel Indicator:** A 16x16px greyscale SVG icon (Slack, Gmail, WhatsApp) vertically centered on the far left. Opacity is 50%, transitioning to 100% on hover.
- **Sender Identity:** `Text Primary` (`#F4F4F5`), `font-medium`, 13px. Truncated at 120px.
- **The AI Priority Badge:** A minimalist pill next to the sender. If Urgent, `bg-[rgba(239,68,68,0.1)] text-red-400`. If FYI, `bg-[rgba(255,255,255,0.05)] text-secondary`.
- **Subject / Snippet:** `Text Secondary` (`#A1A1AA`), 13px, `truncate`.
- **Draft Ready Indicator:** If AIVA has successfully generated a >80% confidence draft, a tiny blue sparkle icon (✨) appears right-aligned next to the timestamp.

### 2.3 Virtualization & Rendering Performance

To handle users with 10,000+ synced messages, the Inbox List must use a virtualizer (e.g., `@tanstack/react-virtual`). Only the ~20 items currently visible in the DOM are rendered. Scrolling must maintain a strict 60fps.

---

## 3. Keyboard-First Navigation (The Power User UX)

Executives and developers hate using the mouse for repetitive tasks. The Web UX must be entirely navigable via the keyboard, establishing muscle memory for inbox zero.

### 3.1 Global Hotkeys

- `Cmd + K`: Opens the Global Command Palette (Search contacts, jump to channels, toggle dark mode).
- `?`: Opens the keyboard shortcut cheat sheet in a sleek, blurred overlay.

### 3.2 Triage Shortcuts (Vim-Inspired)

When focus is on the Inbox List:

- `j` / `Down Arrow`: Move selection down.
- `k` / `Up Arrow`: Move selection up.
- `Enter`: Open the selected conversation in Pane 3.
- `e`: Archive / Mark as Done. Immediately selects the next item.
- `x`: Select multiple items (reveals bulk-action toolbar).
- `Cmd + Shift + U`: Mark as Unread.

### 3.3 Draft Execution Shortcuts

When focus is in the Conversation View (Pane 3) and an AI Draft is queued:

- `Cmd + Enter`: Approve and Send the AI draft instantly.
- `Tab`: Move focus into the text editor to manually adjust the draft.
- `Cmd + J`: Cycle through tone variations (Friendly -> Professional -> Brief). Triggers a 300ms Lottie spinner while the LLM rewrites the text.

---

## 4. Mobile Gesture Mechanics (Flutter Swipe-to-Approve)

The mobile experience (iOS/Android) cannot just be a shrunken version of the web app. It must be built around one-handed, thumb-driven triage.

### 4.1 The Tinder-for-Inbox Paradigm

When the user opens the app, they enter "Triage Mode." Drafts that meet the user's base confidence criteria are presented as a stack of cards or a dense list with powerful swipe actions.

### 4.2 Gesture Specifications (Using Flutter `Dismissible`)

- **Swipe Right (Approve & Send):**
- _Visual:_ As the user drags the row right, the revealed background is `bg-green-900`. A white checkmark icon scales up `from 0.5 to 1.0`.
- _Haptics:_ At 40% screen width, trigger `HapticFeedback.mediumImpact()`. This signals the commit threshold.
- _Release:_ The row slides off-screen (`curve: Curves.easeOutExp`). A micro-toast appears: "Sent to Sarah."

- **Swipe Left (Archive / Defer):**
- _Visual:_ Dragging left reveals a `bg-zinc-800` background with a crossed-out icon.
- _Haptics:_ Light impact at threshold.
- _Release:_ The message is cleared from the triage queue without sending the draft.

- **Tap (Edit/Review):**
- Tapping the row opens the Full Conversation View, sliding in from the right (`CupertinoPageRoute` transition). The keyboard auto-focuses on the AI draft text box for immediate manual editing.

---

## 5. The Priority Engine & Triage Pipeline

AIVA does not display messages chronologically by default. Chronological inboxes bury critical client emails under automated newsletters.

### 5.1 The Sorting Algorithm

The backend calculates a dynamic `triageScore` for every incoming message.

- Base Score: Chronological timestamp.
- Multiplier 1: `Intent`. (Scheduling = 1.5x, Action Required = 2.0x, Newsletter = 0.1x).
- Multiplier 2: `VIP Status`. (Matched against CRM tags = 3.0x).
- Multiplier 3: `Confidence`. If AIVA has a draft ready with 95% confidence, it is bubbled to the top of the "Review" queue.

### 5.2 Inbox Filters (The Top Bar)

Above the Inbox List, three minimalist toggle pills allow instant filtering:

- `All` (Default)
- `Needs Review` (Only shows messages where an AI draft is >70% confident and awaiting human swipe/approval).
- `Urgent` (Only shows VIPs and high-sentiment-score items).

---

## 6. The Conversation Thread (Cross-Channel Normalization)

Rendering a Slack thread, a WhatsApp conversation, and a 20-reply Gmail chain in the same UI requires heavy normalization on the frontend.

### 6.1 Unified Message Data Model

The backend standardizes all provider payloads into a single tRPC interface:

```typescript
interface NormalizedMessage {
  id: string;
  provider: "GMAIL" | "SLACK" | "WHATSAPP";
  direction: "INBOUND" | "OUTBOUND";
  sender: ContactReference;
  htmlBody?: string;
  plainText: string;
  timestamp: Date;
  attachments: AttachmentReference[];
}
```

### 6.2 The Feed Rendering

- **Layout:** Messages stack vertically. Outbound (user/AIVA) messages are slightly indented on the right, inbound on the left.
- **The "Mute" Treatment:** Long email signatures and quoted replies are automatically hidden behind an ellipsis button (`...`). Only the net-new text of the email is displayed.
- **Channel Watermarks:** A highly subtle, `opacity-10` watermark of the provider logo (e.g., the Slack hashtag) sits in the top right corner of the message bubble, reminding the user where this conversation is actually taking place.

---

## 7. Draft Approval & The AI Editor

The bottom of the Conversation View is dedicated to the AI Draft Box. It replaces the traditional "Reply" text area.

### 7.1 The Draft Box UI

- **Container:** A sticky footer. `bg-elevated`, `border-t border-border`.
- **The Header (Confidence Bar):**
- A 2px linear bar spans the top of the draft box. If confidence is 92%, the bar is 92% filled with AIVA Blue.
- Text: `Auto-Send Confidence: 92% • Safe to auto-send`.

- **The Text Area:**
- Automatically populates with the LLM's best draft.
- Typography: `Inter`, `14px`, `Text Primary`.
- It is a fully controlled React component. If the user types a single character, the "Confidence Bar" disappears, and the state transitions from `AI_DRAFT` to `MANUAL_EDIT`.

- **Tone Adjustment Controls:**
- Three ghost buttons above the text: `[Friendly]`, `[Professional]`, `[Brief]`.
- Clicking one fires `api.ai.rewriteDraft`. The text area dims to 50% opacity, a 1px Lottie spinner activates, and the new text streams in via Server-Sent Events (SSE) or a fast tRPC mutation.

### 7.2 The Action Row

- **Primary Button:** `[ Approve & Send ]`. (Keyboard: `Cmd + Enter`).
- **Secondary Button:** `[ Discard Draft ]`.
- **The Automation Lock:** A tiny lock icon next to the Send button. If clicked, it opens a popover: _"Always auto-send replies like this to Sarah in the future?"_ This allows the user to train the Auto-Send Boolean Engine directly from the inbox.

---

### End of PRD 4.
