# AIVA.io — Master PRD 1 of 5: Generative UI & Transparent Research Engine

**Document Type:** Detailed Product Requirements Document (PRD)
**System Focus:** The "Command Center" Chat Interface, Server-Driven UI (SDUI), and Citation Engine.
**Design Language:** Linear Aesthetic (Pure Black, Greyscale, Inter/JetBrains Mono, Subtle Borders, High Information Density).
**Target Platforms:** Next.js 15 (Web) & Flutter (Mobile iOS/Android).

---

## 1. Executive Summary & Philosophy

Traditional AI chatbots (like ChatGPT or Claude) output walls of unstructured markdown text. This is unacceptable for an elite executive assistant. AIVA operates on a **Generative UI** paradigm. When a user asks a complex, cross-platform question (e.g., _"What is my itinerary when I land in Vegas?"_), AIVA does not just generate text; she acts as an orchestration layer.

This PRD defines the exact mechanics, user experience, and engineering architecture for AIVA's **Transparent Research Engine**. It covers how the AI "shows its work" by visually querying integrations (Gmail, Airbnb, Delta), how it attributes citations, and how the backend serves native, high-fidelity UI widgets (Flight Cards, Hotel Cards) instead of plain text.

---

## 2. The "Command Center" Paradigm (UI/UX Foundation)

AIVA’s chat interface is not a traditional messaging thread. It is a "Command Center" accessed via `Cmd+K` on the web or a floating action button on mobile.

### 2.1 Visual Anatomy of the Command Center

- **Background:** `rgba(0, 0, 0, 0.6)` with `backdrop-filter: blur(16px)`. It overlays the current inbox.
- **Input Field:**
- _Typography:_ `Inter`, `24px` (Desktop), `18px` (Mobile), `Text Primary` (`#F4F4F5`).
- _Border:_ `1px solid rgba(255, 255, 255, 0.1)`. Focus state transitions to `1px solid rgba(59, 130, 246, 0.5)` (AIVA Blue).
- _Placeholder:_ _"Ask AIVA to find, draft, or execute..."_ in `Text Tertiary` (`#52525B`).

- **Layout:** Content grows upwards from the input on mobile (bottom-sheet style) and downwards from the input on desktop (Spotlight style).

---

## 3. The "Researching" State (Building Trust Through Visibility)

When the user submits a prompt, the system must visually demonstrate the AI reading through secure data silos. We do not use generic loading spinners. We use a **Deterministic Status Reel**.

### 3.1 The 4-Phase Loading Animation

When the prompt _"What do I need to do when I land in Vegas?"_ is fired:

- **Phase 1: Intent Parsing (0 - 300ms)**
- _UI State:_ Input text locks. A glowing, 1px thick linear progress bar appears at the top edge of the input field.
- _Micro-copy:_ `Geist Mono`, `11px`, `Text Secondary`. Text reads: `> parsing_intent...`

- **Phase 2: Integration Polling (300ms - 2500ms)**
- _UI State:_ A horizontal flex row of 24x24 greyscale integration logos appears (Gmail, Outlook, Slack, Shopify).
- _Animation:_ As the backend RAG (Retrieval-Augmented Generation) engine queries specific vectors, the corresponding logo transitions from `opacity-40` greyscale to `opacity-100` full-color.
- _Micro-copy Updates:_ \* `> querying: gmail (query: "Vegas OR Las Vegas OR flight OR hotel")`
- `> scanning: delta_airlines_receipts...`
- `> scanning: opentable_reservations...`

- _Motion:_ Use Framer Motion (`easeInOut`, duration `0.2s`) for the logo color transitions.

- **Phase 3: Synthesis (2500ms - 3000ms)**
- _UI State:_ The logos fade out (`opacity: 0`, `y: -10`).
- _Micro-copy:_ `> synthesizing_response...`

- **Phase 4: Output Rendering**
- The text begins streaming in, followed immediately by the snapping-in of Generative UI Widgets.

---

## 4. The Citation & Source Attribution System

AIVA must never ask the user to blindly trust her. Every factual claim must be attributed to the exact source email, Slack message, or Shopify order.

### 4.1 Inline Citations

- _Design:_ Citations are inline, pill-shaped components at the end of sentences.
- _Specs:_ Height `18px`, Padding `0 6px`, Border Radius `999px`, Background `rgba(255, 255, 255, 0.05)`, Border `1px solid rgba(255, 255, 255, 0.1)`.
- _Content:_ A tiny 10x10 icon of the source (e.g., Gmail icon) and a truncated reference (e.g., "Oct 12").
- _Example Output:_ "You land at Harry Reid Airport at 4:15 PM. `[G]` You're staying at the Bellagio. `[G]`"

### 4.2 The "Source Preview" Interaction

- **Web (Hover/Click):** Hovering over a citation pill changes the border to `rgba(255, 255, 255, 0.4)`. Clicking it opens a small floating Popover (Radix UI) directly above the pill.
- _Popover Design:_ `width: 320px`, pure black, subtle border.
- _Popover Content:_ The exact excerpt from the source email. "From: Delta Airlines. Subject: Your itinerary DL404. Arriving 4:15 PM."

- **Mobile (Tap):** Tapping the pill triggers `HapticFeedback.lightImpact()`. A bottom sheet slides up (`duration: 250ms`, `curve: easeOutQuad`) displaying the source email snippet, with a button to "Open full email".

---

## 5. Server-Driven UI (SDUI) Architecture

To render beautiful widgets, the AI backend must output a strict JSON schema. The tRPC router parses the LLM output, validates it against a Zod schema, and streams it to the frontend.

### 5.1 The tRPC Response Schema

The payload sent to the Web/Flutter client consists of `prose` (the conversational text) and `widgets` (the UI components).

```typescript
// Backend Zod Schema for SDUI Response
const AICommandResponseSchema = z.object({
  id: z.string(),
  prose: z.string(), // "You land at Harry Reid Airport at 4:15 PM..."
  citations: z.array(
    z.object({
      id: z.string(),
      sourceIntegration: z.enum(["GMAIL", "SLACK", "SHOPIFY"]),
      originalId: z.string(), // e.g., the Gmail Message ID
      snippet: z.string(),
    }),
  ),
  widgets: z.array(
    z.discriminatedUnion("type", [
      FlightWidgetSchema,
      AccommodationWidgetSchema,
      ShopifyOrderWidgetSchema,
      ActionWidgetSchema,
    ]),
  ),
});
```

### 5.2 Client-Side Parsing (The Widget Engine)

Both Next.js and Flutter will implement a Factory pattern.

- If `widget.type === 'FLIGHT'`, the app mounts the `<FlightCard />` component, passing `widget.data` as props.
- Widgets snap into view using a spring animation (`stiffness: 300`, `damping: 30`) to give them weight and physical presence.

---

## 6. Core Widget Specifications (The "Sexy" UI)

These widgets are the crown jewels of the AIVA visual experience. They must adhere strictly to the 8pt grid, use zero highly saturated background colors, and rely on `Border Subtle` for structure.

### 6.1 Flight Widget (`FLIGHT_CARD`)

- **Container:** `bg-[#0A0A0A]`, `border border-[rgba(255,255,255,0.08)]`, `rounded-xl`, `padding: 16px`.
- **Header Row:**
- Left: Airline Logo (Greyscale) + Airline Name (`Text Secondary`, `12px`, `Geist Mono`).
- Right: Flight Status Pill. If "On Time", background is `rgba(34, 197, 94, 0.1)`, text is `#4ADE80` (Green).

- **Main Visual (The Flight Path):**
- A horizontal layout.
- _Left (Departure):_ Huge Typography (`Inter`, `32px`, `font-bold`, `Text Primary`). E.g., "JFK". Below it: "2:00 PM" (`Text Secondary`).
- _Center (Path):_ A horizontal dotted line (`stroke-dasharray="4 4"`, `#52525B`). In the center of the line, a tiny airplane SVG pointing right.
- _Right (Arrival):_ Huge Typography "LAS". Below it: "4:15 PM".

- **Footer Row:**
- Gate Info, Terminal Info, Seat Number (rendered in `Geist Mono`, `Text Secondary`).

### 6.2 Accommodation Widget (`ACCOMMODATION_CARD`)

- **Container:** Same physical dimensions as the Flight Widget.
- **Visual Layout:** Split vertically.
- _Left (Image):_ A square thumbnail (`80x80px`, `rounded-lg`) of the Airbnb/Hotel, extracted from the email. `filter: grayscale(20%)` to fit the dark aesthetic.
- _Right (Details):_ \* Title: "Bellagio Hotel & Casino" (`Text Primary`, `font-medium`).
- Details: "Check-in: 3:00 PM • Conf: #89432M" (`Text Secondary`, `12px`).

- **Action Row:** A full-width, low-contrast button at the bottom: "Get Directions" (Opens native Apple/Google Maps).

### 6.3 Action Widget (`ACTION_CARD`)

Used when AIVA detects a proactive step the user should take based on the context (e.g., flight lands at 4, check-in is at 6).

- **Container:** `bg-transparent`, `border border-[rgba(59,130,246,0.3)]` (AIVA Blue glow border), `rounded-lg`.
- **Layout:** \* Icon: ✨ (Sparkle) or standard Bot icon.
- Text: "You have a 2-hour gap before check-in. Would you like me to draft an email requesting early check-in?"
- Buttons: [Draft Email] (Primary Blue), [Dismiss] (Ghost).

---

## 7. Mobile (Flutter) Specific Execution

Translating the Linear aesthetic to a mobile device requires obsessive attention to native feel, haptics, and gestures.

### 7.1 Flutter Architecture & Packages

- **State Management:** Riverpod (for managing the complex streaming state of the SDUI).
- **Styling:** Custom `ThemeData` enforcing the pure black (`#000000`) backgrounds and `Inter` font family (via `google_fonts` package).
- **Animations:** `flutter_animate` package. When widgets arrive in the payload, they should trigger `.animate().fadeIn().slideY(begin: 0.1, curve: Curves.easeOut)`.

### 7.2 The "Vegas" Flow on Mobile

1. **Trigger:** User taps the persistent floating "AIVA Sparkle" icon at the bottom center of the inbox.
2. **Input:** A bottom sheet snaps up to 90% of screen height. Keyboard auto-focuses. User dictates via native voice-to-text.
3. **The Hunt:** The keyboard drops. The 4-phase loading reel (Section 3.1) plays perfectly centered on the screen. Haptic engine taps lightly for each integration logo that lights up (`HapticFeedback.selectionClick()`).
4. **The Reveal:** The text streams in. As soon as the JSON payload completes, the Flight Widget and Hotel Widget snap into a vertical `ListView` with a satisfying `HapticFeedback.mediumImpact()`.
5. **Interactivity:** Tapping the Hotel widget triggers a hero animation that expands it into a full-screen detailed view, pulling the actual original receipt email underneath it.

---

## 8. Edge Cases & Error Handling

To maintain the elite "Chief of Staff" persona, AIVA must never throw a raw red error code. Errors must be handled gracefully.

- **Missing Integration Data:** If the user asks about Vegas, but their Delta receipt went to an unconnected email address, the SDUI returns:
- `prose`: "I see your hotel booking at the Bellagio, but I cannot locate your flight details. Did you book it on an unconnected account?"
- `widgets`: Renders the Hotel Card, followed by an `ACTION_CARD` suggesting to "Connect another Gmail account."

- **Timeout / LLM Failure:** If the RAG engine takes longer than 15 seconds:
- The loading reel gracefully fades out.
- Message: "I'm having trouble accessing that data right now. Please try again in a moment."

---

### End of PRD 1.

---
