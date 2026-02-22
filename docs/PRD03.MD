# AIVA.io — Master PRD 3 of 5: The Auto-Send Boolean Engine & Safety Vault

**Document Type:** Detailed Product Requirements Document (PRD)
**System Focus:** Deterministic Logic Gates, Supervisor LLM Checks, VIP Routing, and Audit Log UI/UX.
**Design Language:** Linear Aesthetic (Pure Black, Greyscale, `JetBrains Mono` for technical data, high-density table views).
**Target Architecture:** Node.js/Next.js backend, PostgreSQL (Drizzle ORM), tRPC, React (Web), Flutter (Mobile).

---

## 1. Executive Summary & Engineering Philosophy

The fundamental barrier to mainstream adoption of AI executive assistants is **trust**. Users are terrified that an AI will auto-send a hallucinated discount to a client, agree to a legally binding term, or insult a VIP.

To solve this, AIVA relies on a strict separation of concerns: **Probabilistic Generation** (the LLM drafting the reply) vs. **Deterministic Execution** (the Boolean Engine).

The Auto-Send Boolean Engine is an immutable series of logic gates. An LLM _never_ has the final authority to send a message. The LLM submits a draft to the Boolean Engine, which evaluates it against 10 strict criteria, runs a secondary "Supervisor" LLM check, and either dispatches the payload to the integration adapter or halts execution, safely routing the message to the user's "Drafts for Review" queue.

This PRD outlines the exact backend logic gates, the CRM-linked hard blocks, and the frontend interfaces (The Safety Vault & Audit Log) required to give the user absolute, granular control over this system.

---

## 2. The Deterministic Pipeline (Architecture)

When a message is received and an auto-send is potentially viable, it enters the Safety Vault Pipeline.

### 2.1 The Execution Flow

1. **Trigger:** Webhook receives incoming message.
2. **Draft Generation:** The primary LLM generates the optimal response based on the `USER_TONE_PROFILE` and context.
3. **Supervisor Evaluation:** A secondary, distinct LLM call (e.g., GPT-4o-mini, optimized for structured JSON output) evaluates the draft against the context to generate a `SAFE_TO_SEND` payload.
4. **The Boolean Gauntlet:** The backend Node.js service runs the 10-Gate sequence.
5. **Outcome A (Pass):** If `evaluateAllGates() === true`, the system fires `api.integrations.sendMessage` and creates a row in `ai_action_logs`.
6. **Outcome B (Fail):** If _any_ gate fails, execution halts. The draft is saved to the DB with `status: 'REQUIRES_REVIEW'` and the exact `RISK_REASON` is attached to the payload for UI rendering.

---

## 3. The 10-Gate Verification Sequence

For a message to be auto-sent, it must return `true` for all 10 of the following programmatic gates. **This is a fail-closed system.** If a gate times out or returns an error, it defaults to `false`.

### Gate 1: Global & Channel Feature Flag

- **Logic:** `user.settings.autoSendEnabled === true && channel.autoSendEnabled === true`
- **Description:** The master kill switch. If the user has disabled auto-send for their workspace, or specifically disabled it for WhatsApp, halt immediately.

### Gate 2: Confidence Threshold

- **Logic:** `supervisor.confidenceScore >= user.settings.confidenceThreshold`
- **Description:** The user sets a threshold (e.g., `0.85`). The Supervisor LLM scores the predictability and safety of the draft from 0.00 to 1.00.

### Gate 3: The Supervisor `SAFE_TO_SEND` Check

- **Logic:** `supervisor.safeToSend === true`
- **Description:** The secondary LLM explicitly outputs a boolean indicating if the draft contains complex reasoning, ambiguity, or sensitive info.

### Gate 4: Contact Precedence (The First-Touch Block)

- **Logic:** `crm.contact.messageCount > 0 && !crm.contact.isNew`
- **Description:** AIVA must **never** auto-reply to the very first message a new contact sends. A human must establish the relationship baseline.

### Gate 5: Complexity Constraint

- **Logic:** `supervisor.messageType === 'ACKNOWLEDGEMENT' || supervisor.messageType === 'CONFIRMATION'`
- **Description:** Auto-send is restricted to routine, low-risk interactions ("Got it," "Thanks," "Confirmed for 3 PM"). If the draft requires multi-step reasoning, it fails.

### Gate 6: Forbidden Topic Filter (Regex + LLM)

- **Logic:** `!containsForbiddenTopics(draft.text) && supervisor.hasForbiddenTopics === false`
- **Description:** Scans for keywords related to pricing ($, "cost", "invoice"), legal ("contract", "sue", "terms"), and refunds. If detected, halt.

### Gate 7: Scheduling Ambiguity

- **Logic:** `if (intent === 'SCHEDULING') return supervisor.isSchedulingUnambiguous === true`
- **Description:** If AIVA is confirming a meeting, the time, duration, and attendees must be perfectly parsed. If the user said "Sometime next week maybe," halt.

### Gate 8: No New Promises (The Hallucination Lock)

- **Logic:** `supervisor.containsNewCommitments === false`
- **Description:** The draft must not introduce dates, deliverables, or promises that were not explicitly present in the preceding thread or injected user context.

### Gate 9: Time Window Constraint

- **Logic:** `currentTime >= user.settings.workingHours.start && currentTime <= user.settings.workingHours.end`
- **Description:** Do not auto-send a business email at 2:00 AM unless the user has explicitly checked "Allow After-Hours Auto-Send."

### Gate 10: Attachment Request Block

- **Logic:** `supervisor.senderRequestedAttachment === false`
- **Description:** If the incoming email says, "Please attach the Q4 report," AIVA cannot physically generate the PDF. It must halt and route to the user.

---

## 4. Hard Blocks & VIP Routing

Certain conditions bypass the 10-Gate sequence entirely and trigger an immediate hard block.

### 4.1 The VIP CRM Tag

In the AIVA CRM (`contacts` table), users can apply tags. If a contact has the tag slug `vip`, the system sets a database-level constraint: `allowAutoSend: false`.

- _UI Execution:_ In the Inbox view, any draft queued for a VIP has a distinct visual treatment. The `Auto-Send Confidence` badge is hidden, replaced by a `JetBrains Mono` badge reading `[VIP_MANUAL_OVERRIDE]`.

### 4.2 Negative Sentiment Detection

The initial Intent classification engine scores sentiment. If `sentimentScore < 0.3` (indicating anger, frustration, or urgency/panic), the message is instantly hard-blocked. AIVA does not auto-reply to angry clients.

---

## 5. UI/UX: The Safety Vault (Configuration)

The Safety Vault is where the user configures these rules. It lives under `Settings > Automation > Safety Vault`. It must look like a high-end developer tool—precise, technical, and trustworthy.

### 5.1 Visual Layout (Linear Aesthetic)

- **Background:** `Background Main` (`#000000`).
- **Container:** A sleek, 600px wide centered column.
- **Typography:** Section headers are `Inter`, Semi-bold, `Text Primary`. Data points and thresholds are `JetBrains Mono`.

### 5.2 The Confidence Slider Component

- **Label:** "Auto-Send Confidence Threshold"
- **Description:** `Text Secondary`, 13px. "AIVA will only dispatch messages that score above this threshold."
- **Track:** A 2px high horizontal line (`rgba(255,255,255,0.1)`).
- **Fill:** A subtle blue gradient (`#3B82F6` to `#60A5FA`).
- **Thumb:** A pure white `16x16px` circle with a subtle drop shadow.
- **Readout:** To the right of the slider, a fixed-width `JetBrains Mono` readout box with a 1px border. As the slider moves, it displays `0.82`, `0.85`, `0.95`.

### 5.3 The Rule Toggles (Bento List)

A vertical list of constraints. Each item has a `48px` height, separated by `Border Subtle`.

- **Component Anatomy:**
- _Left:_ Icon (Lucide React, e.g., `ShieldAlert`, `Clock`), size 16px, `Text Secondary`.
- _Center:_ Label (e.g., "Block Pricing & Legal Topics").
- _Right:_ The Toggle Switch.

- **The Toggle Design:** \* _Off:_ `bg-[rgba(255,255,255,0.1)]`, thumb is `Text Secondary`.
- _On:_ `bg-white`, thumb is `black`. The transition is `150ms ease-out`.

### 5.4 Global Kill Switch

At the very top of the vault, separated by a generous 32px margin, is a prominent, full-width button.

- _Design:_ `bg-[rgba(239,68,68,0.1)]` (Muted Red), `border border-[rgba(239,68,68,0.3)]`, `text-red-400`.
- _Label:_ "Halt All Automation (Draft-Only Mode)".
- _Interaction:_ Clicking it instantly updates the workspace settings via tRPC, disabling Gate 1. All subsequent processing stops at the draft stage.

---

## 6. UI/UX: The Audit Log (Transparency)

For users to trust the system, they must be able to verify what it did while they were away. The Audit Log is a dedicated view accessible via the Sidebar (`/app/audit`).

### 6.1 Database Schema (The Log)

```typescript
// packages/db/src/schema/logs.ts
export const aiActionLogs = pgTable("ai_action_logs", {
  id: uuid("id").defaultRandom().primaryKey(),
  workspaceId: varchar("workspace_id").notNull(),
  action: varchar("action").notNull(), // 'AUTO_SEND' | 'DRAFT_REJECTED'
  channel: varchar("channel").notNull(), // 'GMAIL', 'SLACK'
  recipient: varchar("recipient").notNull(),
  confidenceScore: numeric("confidence_score"),
  riskReason: varchar("risk_reason"), // Populated if blocked
  originalMessage: text("original_message"),
  dispatchedDraft: text("dispatched_draft"),
  sentAt: timestamp("sent_at").defaultNow(),
});
```

### 6.2 The Audit Feed UI

This view looks like a highly polished server log or CI/CD pipeline history.

- **Layout:** A dense, full-width table. `Row Height: 48px`.
- **Columns:**
- `Status:` A tiny dot. Green (`bg-green-500`) for Sent, Yellow (`bg-yellow-500`) for Blocked/Drafted.
- `Time:` `JetBrains Mono`, `Text Tertiary` (e.g., `14:02:45`).
- `Channel:` 14px greyscale icon (Slack/Gmail).
- `Recipient:` `Text Primary`, Weight 500.
- `Action:` e.g., "Confirmed Meeting", "Acknowledged Receipt".
- `Confidence:` A small pill. e.g., `[ 0.92 ]`. If it was blocked, it shows `[ BLOCK ]` in red text.

### 6.3 The "Diff & Reasoning" Drawer

Clicking any row in the Audit Log slides out a right-hand panel (`width: 400px`, `Border Subtle` on the left edge).

- **The Header:** "Dispatch Report #A8B2"
- **The Boolean Checklist:** A visual representation of the 10 Gates.
- If the message was sent, it shows 10 tiny green checkmarks.
- If it was blocked, it highlights the exact gate that failed. E.g., `[x] Gate 6 Failed: Forbidden Topic (Regex matched 'invoice')`.

- **The Message Viewer:** Shows the exact text AIVA sent, rendered in `Geist Mono` with a subtle `bg-elevated` background.
- **The Reversal Action:** A "Follow Up" button at the bottom allows the user to immediately compose a manual reply to that thread if they spot a nuance AIVA missed.

---

## 7. Fail-Safes, Rate Limits & Compliance

- **Burst Limits:** AIVA limits auto-sends to `10 per hour per user` by default. If an influx of emails triggers 50 valid auto-send conditions, AIVA sends the first 10, then fails-closed on the remaining 40, routing them to the Drafts queue with the `RISK_REASON: RATE_LIMIT_EXCEEDED`. This prevents runaway loop errors.
- **SOC 2 Auditability:** Because the `ai_action_logs` table stores the exact `confidenceScore` and boolean state at the exact millisecond of dispatch, the platform is inherently compliant for enterprise IT audits.
- **Fallback to Draft-Only:** If the primary OpenAI/Anthropic API goes down, or the tRPC connection stutters, the Boolean Engine fails-closed. Zero messages leave the server without absolute cryptographic confirmation from the Supervisor LLM.

---

### End of PRD 3.
