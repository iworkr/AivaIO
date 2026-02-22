# AIVA.io — Master PRD 2 of 5: The AI Tone Calibration & Continuous Learning Engine

**Document Type:** Detailed Product Requirements Document (PRD)
**System Focus:** Historical Sync, Vector Data Extraction, RAG Prompt Injection, and the Delta Feedback Loop.
**Design Language:** Linear Aesthetic (High-density, greyscale, background tasks, transparent status UI).
**Target Architecture:** Node.js/Next.js backend, PostgreSQL (pgvector via Drizzle ORM), tRPC, React (Web), Flutter (Mobile).

---

## 1. Executive Summary & Engineering Philosophy

For an AI Executive Assistant to cross the chasm from "gimmick" to "indispensable tool," it must sound exactly like the user. A robotic, generic, or overly verbose AI draft creates friction; the user spends more time editing the draft than they would have spent writing it from scratch.

AIVA solves this not by training an expensive, slow fine-tuned model for every user, but by utilizing a highly efficient **Few-Shot Retrieval-Augmented Generation (RAG) & Delta Feedback Engine**.

This PRD outlines the exact backend pipelines, database schemas, prompt construction rules, and user interfaces required to seamlessly ingest a user's communication history, map their structural DNA (Formality, Length, Warmth, Certainty), and continuously learn from their manual edits without ever asking them to fill out a feedback form.

---

## 2. Phase 1: The Historical Sync (Curing the Cold Start)

The "Cold Start Problem" occurs when a user first signs up and the AI has zero context regarding their personal style. AIVA bridges this gap within the first 60 seconds of onboarding via the Historical Sync.

### 2.1 Trigger & Extraction Pipeline

1. **The Trigger:** Immediately after the user successfully completes the OAuth flow for their primary email integration (Gmail or Outlook).
2. **The Extraction Job:** The backend queues an asynchronous background worker (e.g., using Inngest or BullMQ) to fetch the user's historical data.

- _Constraint:_ We strictly fetch messages from the **Sent Items** folder. We do not analyze incoming mail for tone.
- _Batching:_ We fetch the last 200 sent emails.

3. **Sanitization (The "Noise Filter"):**

- Raw email data is dirty. The parser must aggressively strip:
- Quoted reply threads (e.g., anything below `On [Date], [Name] wrote:`).
- Standardized signature blocks (e.g., "Best, John Doe | CEO | Acme Corp").
- Automated replies (e.g., "I am currently out of the office").
- HTML tags and CSS styling.

- _Result:_ Pure, unstructured plaintext representing the user's physical keystrokes.

### 2.2 Dimensional Scoring via LLM

Once the plaintext is sanitized, it is passed in batches to a fast, cost-effective LLM (e.g., GPT-4o-mini or Claude 3.5 Haiku) designed purely for classification.

The LLM evaluates the text across four strict dimensions:

- **Formality (1-10):** Casual ("Hey mate,") ↔ Formal ("Good afternoon John,").
- **Length (1-10):** Concise (2 sentences) ↔ Detailed (2 paragraphs).
- **Warmth (1-10):** Reserved/Factual ↔ Friendly/Supportive.
- **Certainty (1-10):** Tentative ("might work") ↔ Assertive ("works well for me").

### 2.3 The Baseline Profile JSON Schema

The backend calculates the median scores across the 200 emails and stores the result in the `users` (or `workspace_member_settings`) table as a JSONB object.

```json
{
  "toneProfile": {
    "dimensions": {
      "formality": 6.5,
      "length": 3.0,
      "warmth": 7.0,
      "certainty": 8.5
    },
    "frequentSignOffs": ["Best,", "Thanks,", "- J"],
    "frequentGreetings": ["Hi [Name],", "Hey [Name],"],
    "vocabularyQuirks": ["Awesome", "Makes sense", "Will do"]
  },
  "lastSyncedAt": "2026-02-22T14:00:40Z"
}
```

---

## 3. Phase 2: Vector Database Extraction & RAG Architecture

Abstract dimensions (e.g., "Formality: 6.5") are helpful, but LLMs perform exponentially better when given concrete examples. We will store "Golden Emails" to be injected into future prompts as Few-Shot examples.

### 3.1 Selecting the "Golden Emails"

During the Historical Sync, the classification LLM doesn't just score dimensions; it tags emails by intent (e.g., `Scheduling`, `Pushback/Rejection`, `Check-in`, `Support`). The system selects the top 2 highest-quality, most representative emails for each category.

### 3.2 Vector Storage (`pgvector` + Drizzle ORM)

These Golden Emails are converted into embeddings (e.g., via `text-embedding-3-small`) and stored in a dedicated PostgreSQL table using the `pgvector` extension.

```typescript
// Drizzle ORM Schema (packages/db/src/schema/ai.ts)
export const userExemplars = pgTable("user_exemplars", {
  id: uuid("id").defaultRandom().primaryKey(),
  workspaceId: varchar("workspace_id").notNull(),
  userId: varchar("user_id").notNull(),
  channel: varchar("channel").notNull(), // 'email', 'slack', etc.
  intentCategory: varchar("intent_category").notNull(),
  content: text("content").notNull(), // The plaintext exemplar
  embedding: vector("embedding", { dimensions: 1536 }),
  createdAt: timestamp("created_at").defaultNow(),
});
```

### 3.3 The Contextual Retrieval Mechanism

When the user clicks "Draft Reply" on an incoming email about scheduling a meeting:

1. The AIVA backend detects the `is_scheduling` intent.
2. It queries the `userExemplars` table using a cosine similarity search against the current context, filtering by `userId` and `channel`.
3. It retrieves the user's best past scheduling email to use as a template.

---

## 4. Phase 3: The Delta Feedback Loop (Continuous Learning)

AIVA must learn without annoying the user. The Delta Feedback Loop intercepts the user's manual edits right before they hit "Send."

### 4.1 The Interception Mechanics

When AIVA generates a draft, it saves a copy of that draft's text in a temporary state linked to the `messageId`.

- _Action:_ User edits the AIVA draft in the text area.
- _Action:_ User clicks "Send".
- _Frontend Execution:_ The client fires the `api.integrations.sendMessage` tRPC mutation. The payload includes both the `originalAIVADraft` and the `finalUserText`.

### 4.2 The Diff Calculation

In the backend background worker, AIVA runs a comparison:

1. **Levenshtein Distance Check:** If the distance between the original draft and the final text is `< 5%`, the change was likely a typo fix. We ignore it. If the difference is `> 80%`, the user completely rewrote it. We replace a "Golden Email" with this new structure.
2. **Semantic Shift Analysis:** If the change is between 5% and 80%, we pass both texts to an LLM:

- _Prompt:_ "Analyze the difference between the Original Draft and the User's Final Edit. How did the user alter the tone? Return JSON adjustments."
- _Output:_ `{"formalityDelta": -0.5, "warmthDelta": 0.2, "addedQuirk": "cheers"}`

### 4.3 Asynchronous Profile Updates

The user's JSONB `toneProfile` in the database is silently updated. AIVA mathematically moves closer to the user's exact voice with every single sent message.

---

## 5. Phase 4: Context Injection & The RAG Prompt String

To synthesize this data, the backend AI service constructs a master prompt. The architecture relies heavily on Variable / Token injection.

### 5.1 Channel Etiquette Overrides

People speak differently on Slack than they do on Email. The prompt must mathematically adjust the user's baseline based on the channel.

- **LinkedIn:** Always applies a `+1 formality` modifier to the baseline.
- **WhatsApp / SMS:** Always applies a `-1 formality` modifier to the baseline.

### 5.2 The Executable System Prompt Template

This is the canonical string compiled by the backend before calling the LLM API.

```text
# SYSTEM PERSONA
You are AIVA, an elite executive assistant drafting a reply on behalf of {{USER_NAME}}.
Your goal is to save the user time while perfectly mimicking their personal style.
Do not hallucinate. Do not use AI clichés (e.g., "I hope this email finds you well").

# CHANNEL ETIQUETTE
Current Channel: {{CHANNEL}}
Rules for this channel:
- Max tokens: {{CHANNEL_MAX_TOKENS}}
- Signature allowed: {{CHANNEL_ALLOWS_SIGNATURE}}

# USER TONE PROFILE
The user's style is mathematically defined as:
- Formality: {{TONE_FORMALITY}}/10 (1=Casual, 10=Formal)
- Length: {{TONE_LENGTH}}/10 (1=Concise, 10=Detailed)
- Warmth: {{TONE_WARMTH}}/10 (1=Reserved, 10=Friendly)
- Certainty: {{TONE_CERTAINTY}}/10 (1=Tentative, 10=Assertive)

# GOLDEN EXAMPLES (Few-Shot)
To help you match the tone, here is exactly how the user has responded to similar situations in the past:
<example_1>
{{EXEMPLAR_TEXT_1}}
</example_1>

# TASK
Draft a reply to the {{LATEST_MESSAGE}} using {{CONVERSATION_SUMMARY}} as context.
Match the tone profile and channel etiquette exactly.

```

---

## 6. UI/UX: Visualizing the Learning Engine (Linear Aesthetic)

The user must feel in control of this learning engine. In the Settings dashboard, we expose the Tone Calibration UI.

### 6.1 Settings > Tone Calibration (Visual Specs)

- **Layout:** A strict 2-column bento grid. Left side: The DNA Visualizer. Right side: Manual Overrides.
- **Background:** `Background Elevated` (`#0A0A0A`) with `Border Subtle` (`rgba(255,255,255,0.08)`).

### 6.2 The "DNA Visualizer" (Radar Chart)

Instead of boring progress bars, we use a sleek, minimalist SVG Radar/Spider Chart representing the 4 dimensions.

- _Aesthetic:_ Pure black background. The axis lines are `Text Tertiary` (`#52525B`). The polygon representing the user's tone is filled with `rgba(59, 130, 246, 0.1)` (AIVA Blue, 10% opacity) and bordered with a crisp `1.5px` solid `#3B82F6` line.
- _Interactivity:_ Hovering over a point on the radar chart triggers a tooltip: _"Formality: 6.5. AIVA leans slightly professional based on your Gmail history."_

### 6.3 Manual Overrides & Syncer UI

- **Slider Components:** Minimalist horizontal track. The track is `Border Subtle`. The thumb is a pure white `12x12px` circle.
- **The "Recalibrate" Button:** A ghost button `border border-border text-secondary`.
- _Click State:_ The text changes to "Analyzing sent mail..." A highly subtle, 1px linear loading bar appears at the bottom edge of the button bounding box.

### 6.4 The "Learning Indicator" (In-Chat)

To build trust, when the Delta Feedback loop completes a successful adjustment, we don't send a push notification. Instead, the next time the user opens the app, a micro-toast appears in the bottom right:

- _Design:_ `bg-[#050505]`, `border border-border`.
- _Copy:_ `✨ AIVA learned your preference for "Sounds good" over "Acknowledged".`
- _Duration:_ Fades out gracefully after 4 seconds (`linear-ease`).

---

## 7. Data Privacy & SOC 2 Compliance Matrix

Because we are extracting and analyzing sent communications, security is paramount.

- **Ephemeral LLM Processing:** The background worker that calculates the Delta Diff must pass data to the LLM via APIs with strict zero-data-retention agreements (e.g., OpenAI Enterprise Zero-Day Retention).
- **Vector Sanitization:** Before an email is embedded into the `userExemplars` table, a PII-scrubber regex removes Social Security Numbers, Credit Cards, and explicit phone numbers to prevent accidental leakage in future prompt injections.
- **Workspace Isolation:** The `userExemplars` table has a composite index on `(workspaceId, userId)`. A RAG query must explicitly pass the `workspaceId` context to ensure one user's golden emails never cross-pollinate into another tenant's drafts.
- **Opt-Out:** A master toggle in the Settings > Security panel allows the user to disable the "Continuous Learning (Delta Feedback)" loop. If disabled, AIVA relies purely on manual slider inputs.

---

### End of PRD 2.

---
