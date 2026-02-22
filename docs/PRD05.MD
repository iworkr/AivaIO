# AIVA.io — Master PRD 5 of 5: Shopify & CRM Deep Integration Pipeline

**Document Type:** Detailed Product Requirements Document (PRD)
**System Focus:** E-commerce Data Synchronization, OAuth Flows, Webhooks, LTV Calculation, and the AI Context Builder.
**Design Language:** Linear Aesthetic (Pure Black, Greyscale, `JetBrains Mono` for order IDs and financial data, high-density CRM panels).
**Target Architecture:** Node.js/Next.js backend, PostgreSQL (Drizzle ORM), tRPC, React (Web), Flutter (Mobile).

---

## 1. Executive Summary & Engineering Philosophy

Generic AI chatbots fail at e-commerce customer support because they lack stateful context. When a customer emails, _"Where is my order?"_, an isolated LLM can only hallucinate or politely ask for an order number.

AIVA operates differently. By fusing a lightweight internal CRM with a deep, bidirectional Shopify integration, AIVA resolves the sender's identity _before_ the LLM ever sees the message. The AI is injected with deterministic context: the customer's Lifetime Value (LTV), their exact recent orders, fulfillment statuses, and tracking links.

This PRD outlines the architecture required to securely ingest Shopify data, calculate customer value, and inject this context into the RAG pipeline. It also defines the frontend "CRM Panel" UI, ensuring AIVA's interface remains as sleek and information-dense as an elite developer tool.

---

## 2. Architecture & OAuth Flow (The Connection)

AIVA acts as a secure, multi-tenant Shopify App. The connection process must be frictionless for the merchant while strictly adhering to the principle of least privilege.

### 2.1 Required Shopify API Scopes

We do not request write access unless absolutely necessary. AIVA requires:

- `read_customers`: To build the CRM profile, calculate LTV, and read tags.
- `read_orders`: To fetch historical and active order statuses, line items, and tracking.
- _(Future Phase)_ `write_draft_orders`: To allow AIVA to generate return labels or replacement orders via Generative UI Action Cards.

### 2.2 The OAuth Handshake Flow

1. **Initiation:** User navigates to `Settings > Integrations > Shopify` and clicks "Connect".
2. **Redirect:** The frontend redirects to `/api/auth/shopify`, passing the workspace ID and the merchant's `.myshopify.com` domain.
3. **Authorization:** The merchant approves the scopes on Shopify's end.
4. **Token Exchange & Encryption:** Shopify redirects to our callback URL. The backend exchanges the code for a persistent `access_token`.
5. **Storage:** The token is immediately encrypted using AES-256-GCM and stored in the `shopify_connections` table. It is _never_ exposed to the React/Flutter client.

---

## 3. The Synchronization Engine (Historical + Real-Time)

Data synchronization occurs in two phases: the initial historical backfill and the continuous real-time webhook ingestion.

### 3.1 The Historical Sync (Background Worker)

Upon successful OAuth, a background job (e.g., Inngest or BullMQ) is queued to fetch historical context.

- **Customers:** Paginates through the GraphQL Admin API, upserting records into `shopify_customers`.
- **Orders:** Fetches the last 90 days of orders. For AIVA's context window, we only need recent, actionable data.
- **UI Feedback:** In the AIVA app, the Shopify integration icon displays a pulsing yellow dot with the `JetBrains Mono` micro-copy: `> sync_in_progress (batch 1/4)`.

### 3.2 Real-Time Webhooks (The Lifeline)

AIVA subscribes to mandatory Shopify webhooks to keep the CRM perfectly synced without expensive polling.

- `orders/create`: Inserts a new row into `shopify_orders` and increments the customer's `ordersCount` and `totalSpent` (LTV).
- `orders/updated`: Crucial for tracking fulfillment. When an order shifts from `UNFULFILLED` to `FULFILLED`, AIVA updates the local status and stores the `tracking_url`.
- `customers/update`: Captures changes to VIP tags or email addresses.

---

## 4. CRM Data Modeling & LTV Calculation

AIVA's database must mirror the necessary Shopify data while linking it to our native, omni-channel `contacts` table.

### 4.1 Database Schema (Drizzle ORM)

```typescript
// packages/db/src/schema/shopify.ts

export const shopifyCustomers = pgTable("shopify_customers", {
  id: uuid("id").defaultRandom().primaryKey(),
  workspaceId: varchar("workspace_id").notNull(),
  shopifyId: varchar("shopify_id").notNull().unique(),
  email: varchar("email").notNull(),
  ordersCount: integer("orders_count").default(0),
  totalSpent: numeric("total_spent").default("0.00"), // Used for LTV
  tags: jsonb("tags").default([]), // e.g., ['VIP', 'Wholesale']
  lastOrderAt: timestamp("last_order_at"),
});

export const shopifyOrders = pgTable("shopify_orders", {
  id: uuid("id").defaultRandom().primaryKey(),
  workspaceId: varchar("workspace_id").notNull(),
  shopifyOrderId: varchar("shopify_order_id").notNull(),
  orderName: varchar("order_name").notNull(), // e.g., "#1042"
  customerEmail: varchar("customer_email").notNull(),
  financialStatus: varchar("financial_status"), // 'paid', 'refunded'
  fulfillmentStatus: varchar("fulfillment_status"), // 'fulfilled', 'unfulfilled'
  totalPrice: numeric("total_price"),
  lineItemsSummary: jsonb("line_items_summary"), // [{ title: "Blue Widget", qty: 2 }]
  trackingInfo: jsonb("tracking_info"), // { carrier: "USPS", number: "1Z999", url: "..." }
});
```

### 4.2 LTV Calculation & Contact Precedence

When an email arrives from `john@example.com`, AIVA resolves this email against `shopify_customers`.

- **LTV (Lifetime Value):** The `totalSpent` column is read.
- **Precedence Scoring:** A backend utility calculates `SHOPIFY_CONTACT_PRECEDENCE`.
- If `ordersCount === 1`, precedence is `NEW_CUSTOMER`.
- If `ordersCount > 1 && ordersCount < 5`, precedence is `RETURNING_CUSTOMER`.
- If `totalSpent > 500` or `tags.includes('VIP')`, precedence is `VIP_CUSTOMER`.

- _Safety Link:_ If `VIP_CUSTOMER` is true, the Auto-Send Boolean Engine (PRD 3) automatically trips a hard block, routing any drafted replies to the manual review queue.

---

## 5. The AI Context Builder (Prompt Injection)

This is where the magic happens. Before the LLM generates a reply, the Context Builder intercepts the request and injects the deterministic Shopify data.

### 5.1 The Injection Pipeline

1. **Message Received:** "Can you check on my order? I bought the blue widgets." (From: `john@example.com`).
2. **CRM Resolution:** The backend queries `shopify_orders` where `customerEmail = 'john@example.com'` ordered by `createdAt` DESC limit 3.
3. **Stringification:** The raw JSON is converted into highly compressed, token-efficient strings.

### 5.2 The Executable Context Prompt

The standard reply prompt (from PRD 2) is augmented with the following block:

```text
# SHOPIFY CUSTOMER CONTEXT
Customer Identity: Returning Customer (Orders: 3, LTV: $450.00)
Tags: [VIP, Fall_Sale]

# RECENT ORDERS (Last 30 Days)
Order: #1042
Date: 2026-02-20
Status: PAID, FULFILLED
Items: Blue Widget (x2)
Tracking: USPS (1Z999...)

# RULES FOR E-COMMERCE QUERIES
1. If the user asks about an order, reference Order #1042.
2. Provide the exact fulfillment status and tracking information.
3. Do NOT hallucinate order numbers, prices, or shipping carriers.
4. Adapt tone: This is a VIP customer. Be exceptionally warm and accommodating.

```

By framing the prompt this way, the LLM safely generates: _"Hi John, thank you for being a VIP with us! I checked on Order #1042 for your Blue Widgets. It was fulfilled yesterday and shipped via USPS. You can track it here..."_

---

## 6. UI/UX: The Customer Support Command Center

When an agent or founder views a conversation in AIVA, they shouldn't need to open a new tab to check Shopify. The UI must render this context natively, adhering to the Linear design system.

### 6.1 The CRM Panel (Right Sidebar)

- **Layout:** A `300px` fixed-width sidebar on the right side of the Conversation View.
- **Aesthetic:** `bg-elevated` (`#0A0A0A`), separated from the chat by a 1px `Border Subtle`.
- **Section 1: The Identity Card**
- Avatar (Initials in `Text Primary`, `bg-[rgba(255,255,255,0.05)]`).
- Name & Email (`Inter`, 14px).
- **LTV Badge:** A prominent `JetBrains Mono` badge. E.g., `$450.00 LTV`. If VIP, the badge has a subtle gold/yellow text hue (`#FBBF24`).

- **Section 2: Order History (Timeline)**
- A vertical list of recent orders.
- Each order acts as an accordion.
- _Header:_ `#1042 • Feb 20` (Right aligned: a green dot for Fulfilled, a yellow dot for Unfulfilled).
- _Expanded Body:_ \* Line items rendered in `Geist Mono` (`2x Blue Widget`).
- A 1px subtle button: `Copy Tracking Link`.

### 6.2 In-Chat Generative Widgets

If AIVA auto-drafts a reply regarding an order, it doesn't just output text. It utilizes the Server-Driven UI (SDUI) schema defined in PRD 1.

- **The Order Widget (`SHOPIFY_ORDER_CARD`):** Rendered directly above the text draft.
- _Design:_ Pure black card, subtle border.
- _Data:_ Shows the visual progression of the order (Ordered -> Packed -> Shipped).
- _Interaction:_ A button on the widget says "Append to Draft". Clicking this inserts a perfectly formatted HTML/Markdown tracking block into the editable text area below.

---

## 7. Automated Workflows & Use Cases

With this pipeline, AIVA can handle 60%+ of standard e-commerce support volume deterministically.

### 7.1 "WISMO" (Where Is My Order?)

- **Intent:** `Order Status Inquiry`.
- **AIVA Logic:** Retrieves latest order. Checks `fulfillmentStatus`.
- _If FULFILLED:_ Auto-drafts a reply with the tracking URL. Confidence Score: `0.95`. (Auto-sends based on PRD 3 rules).
- _If UNFULFILLED:_ Auto-drafts a reply acknowledging the delay. "Your order is currently being packed by our warehouse team and will ship within 24 hours." Confidence Score: `0.88`.

### 7.2 Return & Exchange Requests

- **Intent:** `Return Request`.
- **AIVA Logic:** Retrieves the order. Checks if the `createdAt` date is within the merchant's 30-day return policy window.
- _If within window:_ Generates a reply with a link to the Shopify Return Portal.
- _If outside window:_ Generates a polite rejection draft. Flags the message for **Manual Review** (Hard block) so the human can decide if they want to make an exception.

---

## 8. Security, GDPR & Data Lifecycle

Integrating with PII (Personally Identifiable Information) requires strict compliance measures.

### 8.1 Mandatory Webhooks (Compliance)

AIVA must implement handlers for Shopify's mandatory privacy webhooks:

- `customers/data_request`: Returns a JSON payload of all AIVA CRM data related to the customer.
- `customers/redact`: Instantly deletes the row from `shopify_customers` and anonymizes the associated `contacts` row in AIVA.
- `shop/redact`: Triggered upon uninstallation. Drops all workspace-associated Shopify data from the AIVA PostgreSQL database within 48 hours.

### 8.2 Ephemeral LLM Boundaries

The Shopify context strings (`# SHOPIFY CUSTOMER CONTEXT`) are passed to the LLM during the generation phase, but they are **never** stored in AIVA's generic AI training logs. API calls to OpenAI/Anthropic must strictly utilize enterprise zero-data-retention endpoints, ensuring merchant PII is never used to train foundational models.

---

### End of PRD 5.
