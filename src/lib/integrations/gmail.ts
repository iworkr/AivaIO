import { oauthConfigs } from "./oauth";

const GMAIL_API = "https://gmail.googleapis.com/gmail/v1/users/me";

export interface GmailThread {
  id: string;
  historyId: string;
  messages: GmailMessage[];
}

export interface GmailMessage {
  id: string;
  threadId: string;
  labelIds: string[];
  snippet: string;
  internalDate: string;
  payload: GmailPayload;
}

interface GmailPayload {
  headers: Array<{ name: string; value: string }>;
  mimeType: string;
  body: { data?: string; size: number };
  parts?: GmailPayloadPart[];
}

interface GmailPayloadPart {
  mimeType: string;
  body: { data?: string; size: number };
  parts?: GmailPayloadPart[];
}

export async function refreshGmailToken(
  refreshToken: string
): Promise<{ accessToken: string; expiresAt: Date }> {
  const config = oauthConfigs.gmail();
  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: config.clientId,
      client_secret: config.clientSecret,
      refresh_token: refreshToken,
      grant_type: "refresh_token",
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Token refresh failed (${res.status}): ${text}`);
  }

  const data = await res.json();
  return {
    accessToken: data.access_token,
    expiresAt: new Date(Date.now() + data.expires_in * 1000),
  };
}

export async function listGmailThreads(
  accessToken: string,
  maxResults = 25,
  pageToken?: string
): Promise<{ threads: Array<{ id: string; snippet: string }>; nextPageToken?: string }> {
  const params = new URLSearchParams({
    maxResults: String(maxResults),
    labelIds: "INBOX",
  });
  if (pageToken) params.set("pageToken", pageToken);

  const res = await fetch(`${GMAIL_API}/threads?${params}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Gmail threads.list failed (${res.status}): ${text}`);
  }

  const data = await res.json();
  return {
    threads: data.threads || [],
    nextPageToken: data.nextPageToken,
  };
}

export async function getGmailThread(
  accessToken: string,
  threadId: string
): Promise<GmailThread> {
  const res = await fetch(`${GMAIL_API}/threads/${threadId}?format=full`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Gmail threads.get failed (${res.status}): ${text}`);
  }

  return res.json();
}

export function getHeader(message: GmailMessage, name: string): string {
  const header = message.payload.headers.find(
    (h) => h.name.toLowerCase() === name.toLowerCase()
  );
  return header?.value || "";
}

export function parseEmailAddress(raw: string): { name: string; email: string } {
  const match = raw.match(/^(.+?)\s*<(.+?)>$/);
  if (match) return { name: match[1].replace(/"/g, "").trim(), email: match[2].trim() };
  return { name: raw.split("@")[0], email: raw.trim() };
}

function decodeBase64Url(data: string): string {
  const base64 = data.replace(/-/g, "+").replace(/_/g, "/");
  return Buffer.from(base64, "base64").toString("utf-8");
}

function extractBody(
  payload: GmailPayload | GmailPayloadPart,
  mimeType: string
): string | null {
  if (payload.mimeType === mimeType && payload.body?.data) {
    return decodeBase64Url(payload.body.data);
  }

  if (payload.parts) {
    for (const part of payload.parts) {
      const result = extractBody(part, mimeType);
      if (result) return result;
    }
  }

  return null;
}

export function getMessagePlainText(message: GmailMessage): string {
  return extractBody(message.payload, "text/plain") || message.snippet || "";
}

export function getMessageHtml(message: GmailMessage): string | null {
  return extractBody(message.payload, "text/html");
}

function encodeBase64Url(str: string): string {
  return Buffer.from(str, "utf-8")
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

export interface SendGmailOptions {
  accessToken: string;
  to: string;
  subject: string;
  body: string;
  from?: string;
  threadId?: string;
  inReplyTo?: string;
  references?: string;
}

export async function sendGmailMessage(opts: SendGmailOptions): Promise<{ id: string; threadId: string }> {
  const lines: string[] = [];
  if (opts.from) lines.push(`From: ${opts.from}`);
  lines.push(`To: ${opts.to}`);
  lines.push(`Subject: ${opts.subject}`);
  if (opts.inReplyTo) lines.push(`In-Reply-To: ${opts.inReplyTo}`);
  if (opts.references) lines.push(`References: ${opts.references}`);
  lines.push("Content-Type: text/plain; charset=utf-8");
  lines.push("MIME-Version: 1.0");
  lines.push("");
  lines.push(opts.body);

  const raw = encodeBase64Url(lines.join("\r\n"));

  const payload: Record<string, string> = { raw };
  if (opts.threadId) payload.threadId = opts.threadId;

  const res = await fetch(`${GMAIL_API}/messages/send`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${opts.accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Gmail messages.send failed (${res.status}): ${text}`);
  }

  return res.json();
}

export function getMessageRecipients(
  message: GmailMessage
): Array<{ email: string; name: string; type: "to" | "cc" | "bcc" }> {
  const recipients: Array<{ email: string; name: string; type: "to" | "cc" | "bcc" }> = [];

  for (const type of ["to", "cc", "bcc"] as const) {
    const header = getHeader(message, type);
    if (!header) continue;
    const addresses = header.split(",").map((s) => s.trim()).filter(Boolean);
    for (const addr of addresses) {
      const parsed = parseEmailAddress(addr);
      recipients.push({ ...parsed, type });
    }
  }

  return recipients;
}
