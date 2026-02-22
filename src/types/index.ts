/* Widget types for SDUI (Server-Driven UI) */

export interface FlightWidgetData {
  type: "FLIGHT_CARD";
  data: {
    airline: string;
    flightNumber: string;
    status: "ON_TIME" | "DELAYED" | "CANCELLED" | "BOARDING" | "LANDED";
    departure: { airport: string; time: string; gate?: string; terminal?: string };
    arrival: { airport: string; time: string; gate?: string; terminal?: string };
  };
}

export interface ShopifyWidgetData {
  type: "SHOPIFY_CARD";
  data: {
    orderId: string;
    orderName: string;
    customerName: string;
    financialStatus: "paid" | "refunded" | "pending";
    fulfillmentStatus: "fulfilled" | "unfulfilled" | "partial";
    totalPrice: string;
    currency: string;
    lineItems: Array<{ title: string; quantity: number; price: string }>;
    trackingInfo?: { carrier: string; number: string; url: string };
  };
}

export interface CalendarWidgetData {
  type: "CALENDAR_CARD";
  data: {
    title: string;
    startTime: string;
    endTime: string;
    location?: string;
    attendees: Array<{ name: string; email: string; status: "accepted" | "declined" | "tentative" }>;
    conferenceUrl?: string;
  };
}

export interface ActionWidgetData {
  type: "ACTION_CARD";
  data: {
    suggestion: string;
    actions: Array<{ label: string; actionType: "primary" | "ghost"; actionId: string }>;
  };
}

export interface EmailSummaryWidgetData {
  type: "EMAIL_SUMMARY_CARD";
  data: {
    threadId: string;
    sender: string;
    senderEmail: string;
    subject: string;
    snippet: string;
    timestamp: string;
    priority: "urgent" | "high" | "medium" | "low";
    provider: "gmail" | "slack" | "shopify";
    isUnread: boolean;
  };
}

export type WidgetData =
  | FlightWidgetData
  | ShopifyWidgetData
  | CalendarWidgetData
  | ActionWidgetData
  | EmailSummaryWidgetData;

export interface AIResponse {
  textSummary: string;
  widgets: WidgetData[];
  citations: Array<{
    id: string;
    source: "gmail" | "slack" | "whatsapp" | "shopify";
    snippet: string;
  }>;
}

/* Message types */

export type MessageProvider = "GMAIL" | "SLACK" | "WHATSAPP" | "SHOPIFY";
export type MessageDirection = "INBOUND" | "OUTBOUND";
export type Priority = "URGENT" | "HIGH" | "NORMAL" | "LOW" | "FYI";

export interface NormalizedMessage {
  id: string;
  threadId: string;
  provider: MessageProvider;
  direction: MessageDirection;
  sender: {
    name: string;
    email: string;
    avatarUrl?: string;
  };
  subject?: string;
  plainText: string;
  htmlBody?: string;
  timestamp: string;
  priority: Priority;
  confidenceScore?: number;
  hasDraft: boolean;
}

export interface Thread {
  id: string;
  subject: string;
  provider: MessageProvider;
  lastMessageAt: string;
  messageCount: number;
  unread: boolean;
  priority: Priority;
  participants: Array<{ name: string; email: string }>;
  snippet: string;
  hasDraft: boolean;
  confidenceScore?: number;
}

/* Tone Profile */

export interface ToneProfile {
  dimensions: {
    formality: number;
    length: number;
    warmth: number;
    certainty: number;
  };
  frequentSignOffs: string[];
  frequentGreetings: string[];
  vocabularyQuirks: string[];
}

/* Integration Connection */

export type ConnectionStatus = "disconnected" | "connecting" | "syncing" | "active";

export interface IntegrationConnection {
  id: string;
  provider: string;
  status: ConnectionStatus;
  lastSyncedAt?: string;
  accountLabel?: string;
}
