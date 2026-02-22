# AIVA.io — Master UI/UX & Frontend PRD (Linear Aesthetic Edition)

**Version:** 2.0 (Design & Frontend Focus)
**Status:** Approved for Development
**Objective:** Deliver a world-class, high-performance landing page and web application utilizing a strict greyscale/black aesthetic with highly intentional blue accents, subtle Lottie animations, and generative UI widgets.

---

## 1. Global Design System & Token Architecture

The aesthetic is not just a skin; it is a mathematical system of spacing, typography, and borders.

### 1.1 Typography Set

- **Primary Typeface:** `Inter` (sans-serif). Standardized across all viewports.
- **Feature / Code Typeface:** `JetBrains Mono` or `Geist Mono` for logs, API keys, and raw AI confidence scores.
- **Weight Mapping:**
- `400` (Regular): All body text, inbox message previews, standard UI labels.
- `500` (Medium): Buttons, active states, sub-headers, sender names.
- `600` (Semi-bold): Section headers, bento grid titles.
- `700` (Bold): Hero text, major marketing callouts.

- **Letter Spacing (Tracking):**
- Headers (H1-H3): `-0.02em` to `-0.04em` (creates that tight, premium SaaS look).
- Body: `0em` to `0.01em`.
- Uppercase UI Labels (e.g., "NEW", "VIP"): `0.06em` (wide tracking for micro-copy).

### 1.2 Color Palette (The "Dark Default")

The app is natively dark, utilizing ultra-low contrast borders to separate panels rather than distinct background colors.

- **Backgrounds:**
- `Background Main`: `#000000` (Pure Black) - Used for the landing page body and main app canvas.
- `Background Elevated`: `#0A0A0A` - Used for bento grids, dropdowns, and cards.
- `Background Sidebar`: `#050505` - Used for the app navigation sidebar.

- **Text Colors:**
- `Text Primary`: `#F4F4F5` (Zinc 100) - For headers and active text.
- `Text Secondary`: `#A1A1AA` (Zinc 400) - For body copy and muted UI elements.
- `Text Tertiary`: `#52525B` (Zinc 600) - For timestamps, minor borders, and disabled states.

- **Accents (AIVA Blue):**
- `Blue Primary`: `#3B82F6` (Used sparingly for primary CTAs, active active states, and focus rings).
- `Blue Glow`: `rgba(59, 130, 246, 0.15)` (Used for subtle background radial gradients behind important elements).

- **Borders & Dividers:**
- `Border Subtle`: `rgba(255, 255, 255, 0.08)` (The secret to the Linear look—barely visible borders separating bento grids and list items).
- `Border Glow`: `rgba(255, 255, 255, 0.15)` (Used on hover states).

### 1.3 Spacing, Whitespace, & Layout Grids

- **Baseline Grid:** 8pt system. Every margin, padding, and height must be a multiple of 8 (8, 16, 24, 32, 64, 128).
- **Whitespace:** Generous. Marketing sections have `128px` to `160px` of vertical padding between them.
- **Bento Grid Gaps:** Exactly `1px` or `16px`. If using `1px`, the background of the container is `Border Subtle`, creating a seamless hairline grid effect.

### 1.4 Animation & Motion Principles

Animations must feel instantaneous, deliberate, and mechanical. No bouncy spring animations.

- **Hover States:** Duration: `150ms`, Easing: `ease-out`. Elements subtly brighten (`Text Secondary` -> `Text Primary`).
- **Fade-Ins (Scroll Reveal):** Duration: `600ms`, Easing: `cubic-bezier(0.16, 1, 0.3, 1)`. Elements move up by `10px` while fading from `0` to `1` opacity.
- **Lottie Animations:** Rendered in greyscale with stroke widths of 1px or 1.5px. They trigger on hover or scroll-into-view, running once and stopping on the final frame, or looping seamlessly on a slow 4-second cycle.

---

## 2. Landing Page Specification (Marketing Site)

The landing page is a single-page scrolling experience designed to convert. It uses heavy whitespace, a pure black background, and high-fidelity product widgets.

### 2.1 Hero Section

- **Visual:** Pure black background. A massive, subtly glowing radial gradient (`Blue Glow`) sits at the top center, fading out before it hits the text.
- **Copy:**
- _(Micro-badge above H1)_: A small pill with a subtle border. Text: "Introducing AIVA 2.0 →" (Hovering glows the border).
- **H1 (Massive, tight tracking):** "The product development system for your inbox." (Adapted to: "The AI executive assistant for modern communication.")
- **Subtext:** "Connect Gmail, Slack, and Shopify. AIVA prioritizes what matters, drafts replies in your tone, and auto-sends the routine—so nothing important slips through."

- **CTAs:**
- Primary: "Start Free" (Black button, white text, 1px solid white border. On hover: Inverts to White button, black text).
- Secondary: "Watch 2-minute tour" (Transparent button, Text Secondary. On hover: Text Primary + subtle underline).

- **Product Shot:** Below the text, fading in as the user scrolls, is a massive, edge-to-edge high-fidelity mockup of the AIVA app. It features a translucent gradient mask at the bottom so it fades perfectly into the black background.

### 2.2 Logo Cloud (Integrations)

- **Layout:** A horizontal marquee, perfectly centered.
- **Visuals:** Logos of Gmail, Outlook, Slack, Teams, WhatsApp, Shopify. All strictly rendered in greyscale with 40% opacity. On hover, the specific logo transitions to 100% opacity and its brand color (e.g., Slack becomes colorful).

### 2.3 The "Bento Grid" Feature Showcase

This section replaces traditional bullet points with a beautiful, asymmetrical grid of cards. The container has a pure black background, but the gaps between the cards are `rgba(255,255,255,0.08)`, creating hairline borders.

**Grid Layout (3x2):**

- **Bento Box 1 (Large - Span 2 columns): "Unified Inbox."**
- _UI:_ A mockup of the AIVA sidebar showing Gmail, Slack, and WhatsApp messages merged into one list.
- _Animation:_ A Lottie animation of a message flying from a Slack icon and a Gmail icon into a central "Inbox" folder.
- _Copy:_ "A command center for communication. Stop context-switching."

- **Bento Box 2 (Medium - Span 1 column): "AI Priority Engine."**
- _UI:_ A visual of three tags: [Urgent - 98%], [Needs Reply - 87%], [FYI - 40%].
- _Animation:_ The tags subtly reorder themselves based on priority.
- _Copy:_ "Know what matters instantly. Intent, urgency, and confidence scored."

- **Bento Box 3 (Medium - Span 1 column): "Smart Drafts."**
- _UI:_ A mock text editor typing out a reply.
- _Animation:_ A Lottie animation of a cursor typing text, with an "AIVA" sparkle icon suggesting completions.
- _Copy:_ "Reply faster without sounding robotic. Tone matched to you."

- **Bento Box 4 (Large - Span 2 columns): "Generative UI & Shopify Context."**
- _UI:_ A beautiful, native-looking "Flight Card" and "Shopify Order Card" rendered inside an email thread.
- _Copy:_ "Not just text. AIVA pulls live data from Shopify and your calendar to render beautiful, actionable widgets directly in your chat."

### 2.4 Generative UI Deep Dive (The "Vegas" & "Shopify" Examples)

- **Layout:** A two-column section. Left side is sticky text; right side scrolls through interactive product examples.
- **Sticky Copy:** "Stop hallucinating. Start executing. AIVA reads your connected apps and generates rich, interactive widgets to solve complex requests instantly."
- **Scrollable Right Side (The Widgets):**
- _Widget 1 (Travel):_ A dark-mode Apple-style flight widget showing "Delta DL404", a visual progress bar, and gate info.
- _Widget 2 (Shopify):_ A clean card showing a Shopify order. _Lottie Animation:_ A green "Fulfilled" badge pops in. Data shown: Order #1001, $450 spent, 3 items. Action button: "Draft Refund."

### 2.5 Testimonial Carousel

- **Visual:** A single row of cards that can be dragged horizontally.
- **Card Design:** Pure black background, `Border Subtle`.
- **Content:**
- _Stars:_ 5 tiny white SVG stars.
- _Quote:_ "AIVA saves me 8 hours a week. It perfectly mimics my tone and handles my Shopify support automatically."
- _Author:_ Avatar (greyscale), Name, Title.

### 2.6 Pricing Table

Linear's pricing is famous for its restraint. No massive colored banners.

- **Layout:** 3 columns. Starter, Team, Enterprise.
- **Card Design:** Black background. The "Team" card has a subtle `Border Glow` (`rgba(59, 130, 246, 0.3)`) to indicate the popular tier.
- **Starter ($29/mo):** "For personal inbox control." List features with tiny, muted SVG checkmarks.
- **Team ($79/mo):** "For client work + collaboration." Includes auto-send with approval, unlimited channels.
- **Enterprise (Custom):** "SSO, audit logs, API."
- **Toggle:** A sleek pill-shaped toggle for Monthly / Annual (Save 20%). The toggle handle is pure white.

### 2.7 The Footer

- **Layout:** Massive whitespace above it. A simple grid of links.
- **Left:** AIVA logo in white. "Built for the future. Available today."
- **Columns:** Product, Company, Legal, Social.
- **Text:** `Text Secondary`, transitioning to `Text Primary` on hover.

---

## 3. Web Application UI/UX (The In-App Experience)

Once authenticated, the user enters the app. The transition should be seamless. The app is a Single Page Application (SPA) with keyboard-first navigation (Command+K).

### 3.1 Global App Layout

- **Sidebar (Left):** Width `240px`. Fixed. Background `Background Sidebar` (`#050505`). Separated from the main canvas by a 1px `Border Subtle`.
- **Main Canvas (Center/Right):** Fluid width. Background `Background Main` (`#000000`).
- **Command Bar (Hidden by default):** Triggered via `Cmd+K`. An overlay search bar centered on the screen with a blurred backdrop (`backdrop-filter: blur(8px)`).

### 3.2 Sidebar Navigation

- **Top Header:** Workspace Switcher. Shows the Aiva Logo and current Workspace Name. On click, opens a dropdown.
- **Primary Links:**
- 📥 Inbox (Shows unread count pill: e.g., `12` with a subtle blue background).
- ⭐ VIP / Urgent
- drafts
- ✅ Tasks / Follow-ups

- **Integrations (Sub-menu):**
- Gmail
- Slack
- WhatsApp
- Shopify (Has a tiny green dot indicating active webhook connection).

- **Bottom:** User Profile, Settings (Gear icon), Theme Toggle.

### 3.3 The Inbox (List View)

This is where the Linear aesthetic shines. High density, no wasted space.

- **List Item Height:** Exactly `48px`.
- **Columns:**
- _Channel Icon:_ A tiny 16x16 greyscale icon (Slack, Gmail).
- _Priority Tag:_ A tiny badge (e.g., `URGENT` in red text with a dark red background at 10% opacity, or `FYI` in grey).
- _Sender:_ `Text Primary`, Weight 500.
- _Subject/Snippet:_ `Text Secondary`, Weight 400. Truncated with ellipsis.
- _Time:_ Right-aligned, `Text Tertiary`.

- **Hover State:** The entire row gets a background of `rgba(255,255,255,0.03)`. A "Quick Actions" menu appears on the far right (Archive, Draft Reply, Mark Read).
- **Selection:** Checkboxes appear on hover. Shift-click to select multiple.

### 3.4 Conversation View (Detail View)

Clicking an item opens the Conversation View (either pushing the list to the left, or opening in a center pane).

- **Header:** Subject line, tags, and a prominent "Confidence Score" if a draft is ready (e.g., `Auto-Send Confidence: 92%`).
- **Thread History:** Messages stack vertically. User messages are right-aligned, incoming are left-aligned.
- **The AI Draft Box (The Magic):**
- Located at the bottom.
- If a draft is ready, it sits in an editable text area with a subtle glowing border.
- **Controls:** Three buttons above the draft: `Friendly`, `Professional`, `Brief`. Clicking one triggers a loading spinner (a sleek, 1px thick SVG ring spinning), and the text morphs into the new tone.

- **Generative UI Injection:**
- If the message says, "Where is my order?", AIVA inserts the **Shopify Widget** directly into the conversation feed above the draft box.
- _Shopify Widget Design:_ A dark card. Header: "Order #1001". Body: "Blue Widget x2". Status: "Shipped". A secondary button on the card says "Insert Tracking into Draft".

### 3.5 The Settings & Preferences (Tone Calibration)

- **Layout:** A multi-pane settings menu.
- **AI Rules Engine UI:**
- A slider for "Auto-Send Confidence Threshold" (70% to 95%).
- Toggle switches for "Require approval for VIPs", "Block pricing terms".

- **Tone Calibration UI:**
- A visual radar chart or a series of sliders (Formality, Length, Warmth, Certainty).
- A button: "Recalibrate from Sent Mail" (Triggers a progress bar as the backend analyzes the last 200 emails).

### 3.6 In-App Theme Toggle (Light/Dark Mode)

While the default is Dark, a Light theme is supported for accessibility.

- **Trigger:** Cmd+Shift+L, or via the user dropdown.
- **Light Theme Mapping:**
- `Background Main`: `#FFFFFF`
- `Background Sidebar`: `#F9FAFB`
- `Text Primary`: `#111827`
- `Text Secondary`: `#6B7280`
- `Border Subtle`: `rgba(0, 0, 0, 0.08)`

- **Transition:** A smooth `300ms` cross-fade applied globally via CSS variables.

---

## 4. Interaction & Animation Rules (Micro-Interactions)

The magic of Linear is in the code execution of animations.

- **Focus Rings:** When tabbing via keyboard, focus rings are NOT default browser blue. They are `2px solid rgba(59, 130, 246, 0.5)` with an `offset` of `2px`.
- **Loading States:** No massive skeleton screens. Use "Progressive Enhancement." If data is fetching, keep the old data visible but reduce its opacity to `50%`, and show a tiny top-edge loading bar (like YouTube or GitHub).
- **Swipe-to-Approve (Mobile/Touch):**
- In the mobile view, dragging a message row right reveals a green background with a checkmark icon. Hitting a 40% threshold triggers haptic feedback, and releasing auto-sends the draft.

- **Lottie Player:** All Lotties must be exported via Bodymovin as `.json` files. Use the `@lottiefiles/react-lottie-player` package. Set `loop={false}` for feature grid icons so they play once on hover.

---

## 5. Technical Implementation (Frontend Architecture)

To execute this PRD, the engineering team must adhere to the following stack and patterns.

### 5.1 Technology Stack

- **Framework:** Next.js 15 (App Router).
- **Styling:** Tailwind CSS (Strictly using a custom `tailwind.config.ts` to map the color tokens).
- **Components:** Radix UI primitives (Headless, accessible UI) combined with Tailwind.
- **Animations:** Framer Motion.
- **Data Fetching:** tRPC + React Query (Ensures type safety from DB to UI).
- **Icons:** Lucide React (Clean, consistent 2px stroke icons).

### 5.2 Tailwind Configuration (`tailwind.config.ts`)

```javascript
module.exports = {
  darkMode: "class", // Enables the theme toggle
  theme: {
    extend: {
      colors: {
        background: "var(--background-main)",
        elevated: "var(--background-elevated)",
        primary: "var(--text-primary)",
        secondary: "var(--text-secondary)",
        border: "var(--border-subtle)",
        aivaBlue: "#3B82F6",
      },
      fontFamily: {
        sans: ["Inter", "sans-serif"],
        mono: ["JetBrains Mono", "monospace"],
      },
      transitionTimingFunction: {
        "linear-ease": "cubic-bezier(0.16, 1, 0.3, 1)",
      },
    },
  },
};
```

### 5.3 Framer Motion Variants (Standardized Fade-In)

Every section on the landing page must use this exact variant to ensure the "Linear" scroll reveal.

```javascript
export const linearFadeIn = {
  hidden: { opacity: 0, y: 12 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] },
  },
};
// Usage: <motion.div variants={linearFadeIn} initial="hidden" whileInView="visible" viewport={{ once: true }}>
```

---

## 6. Generative UI Architecture (Backend to Frontend mapping)

When the user asks, "What is my flight?", the AI does not return a string. It returns a JSON object that React parses into a Widget.

### 6.1 The tRPC Router Concept

The AI Orchestration engine (backend) runs the RAG pipeline. The return type of the tRPC mutation `api.ai.askQuestion` is a Union Type:

```typescript
type AIResponse = {
  textSummary: string;
  widgets: Array<FlightWidgetData | ShopifyWidgetData | CalendarWidgetData>;
  citations: Array<{ id: string; source: "gmail" | "slack"; snippet: string }>;
};
```

### 6.2 The Flight Widget JSON Schema

If the backend detects a flight context, it returns:

```json
{
  "type": "FLIGHT_CARD",
  "data": {
    "airline": "Delta",
    "flightNumber": "DL404",
    "status": "ON_TIME",
    "departure": {
      "airport": "JFK",
      "time": "2026-02-23T14:00:00Z",
      "gate": "B12"
    },
    "arrival": {
      "airport": "LAS",
      "time": "2026-02-23T16:15:00Z",
      "gate": "T3"
    }
  }
}
```

### 6.3 React Rendering Logic

The frontend maps this JSON directly to the `FlightWidget.tsx` component.

```jsx
// Simplified React execution
function AIResponseRenderer({ response }) {
  return (
    <div className="flex flex-col gap-4">
      <p className="text-secondary leading-relaxed">{response.textSummary}</p>

      {response.widgets.map((widget) => {
        if (widget.type === "FLIGHT_CARD")
          return <FlightWidget data={widget.data} />;
        if (widget.type === "SHOPIFY_CARD")
          return <ShopifyWidget data={widget.data} />;
      })}
    </div>
  );
}
```

_Design of FlightWidget.tsx:_ A `div` with `bg-elevated`, `border border-border`, rounded `xl`. Inside, a flex layout showing the departure time on the left, an SVG dotted line with an airplane icon in the center, and arrival time on the right.

---

## 7. Integration Handling & Environment Workflows

The app relies heavily on API keys provided via environment variables. The frontend must gracefully handle missing keys or disconnected states.

### 7.1 Connection States

- **State 1: Unconnected.** In settings, the Shopify row shows a "Connect" button. Clicking redirects to the OAuth flow.
- **State 2: Connecting.** A spinner appears.
- **State 3: Connected & Syncing.** A yellow dot indicator. "Syncing historical data..."
- **State 4: Active.** A green dot. "Connected. Last synced 2m ago."

### 7.2 Handling the Cold Start

When a user connects their first channel (e.g., Gmail), the frontend immediately polls a tRPC endpoint `api.workspaces.syncStatus`.
While syncing, the main inbox shows an empty state:

- _Visual:_ A subtle Lottie animation of a scanner.
- _Text:_ "AIVA is analyzing your communication history to calibrate your Tone Profile. This takes about 30 seconds."
- Once complete, the page triggers a Framer Motion layout transition, revealing the populated inbox.

### 7.3 Security & API Key Flow

- **Rule:** Frontend _never_ sees or handles raw Integration API keys (e.g., Shopify Admin tokens or OpenAI keys).
- **Flow:** The `env` variables (`SHOPIFY_CLIENT_ID`, `OPENAI_API_KEY`) live strictly on the Node.js/Next.js server environment.
- **Execution:** When a user requests an AI draft, the React client calls `tRPC.ai.draftReply`. The server retrieves the user's encrypted OAuth tokens from PostgreSQL, injects the `env` LLM keys, executes the request, and returns only the final drafted string to the frontend.

---

## 8. Copywriting & Content Strategy (The Voice of AIVA)

The tone of the website and app must match the aesthetic: Confident, sparse, and highly competent. No marketing fluff.

### 8.1 Key Phrases to Use Throughout

- "A command center for communication."
- "Operates in the background. Acts on your approval."
- "Your Tone. Scaled."
- "Generative interfaces, not just chat."

### 8.2 Error & Empty States

Never use generic "Oops!" errors.

- **Empty Inbox:** "Inbox Zero. All channels clear." (With a highly muted checkmark icon).
- **Integration Failed:** "Connection lost. Re-authenticate Shopify to restore order context."
- **AI Confidence Low:** "Confidence threshold not met (68%). Manual review required."

---

## 9. Next Steps for Engineering

1. **Initialize Monorepo:** Set up Turborepo with Next.js (web) and Expo/Flutter (mobile).
2. **Design Tokens:** Implement the `tailwind.config.ts` mapping precisely to the color definitions in Section 1.2.
3. **Component Library:** Build the core primitives (Button, Input, BentoGrid, Sidebar) using Radix UI before assembling pages.
4. **Mock Data:** Build the Inbox view using static JSON arrays to perfect the layout and Framer Motion animations before connecting to the live tRPC Postgres database.

This document serves as the absolute source of truth for the frontend execution of AIVA.io. By adhering strictly to these layout, typography, and animation constraints, the application will achieve the premium, high-performance feel required to dominate the AI Executive Assistant market.
