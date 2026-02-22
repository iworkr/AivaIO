import { createCipheriv, createDecipheriv, randomBytes } from "crypto";

const ENCRYPTION_KEY = process.env.INTEGRATION_ENCRYPTION_KEY || randomBytes(32).toString("hex");

export function encryptToken(token: string): { encrypted: string; iv: string; tag: string } {
  const iv = randomBytes(12);
  const key = Buffer.from(ENCRYPTION_KEY, "hex");
  const cipher = createCipheriv("aes-256-gcm", key, iv);

  let encrypted = cipher.update(token, "utf8", "hex");
  encrypted += cipher.final("hex");
  const tag = cipher.getAuthTag().toString("hex");

  return { encrypted, iv: iv.toString("hex"), tag };
}

export function decryptToken(encrypted: string, iv: string, tag: string): string {
  const key = Buffer.from(ENCRYPTION_KEY, "hex");
  const decipher = createDecipheriv("aes-256-gcm", key, Buffer.from(iv, "hex"));
  decipher.setAuthTag(Buffer.from(tag, "hex"));

  let decrypted = decipher.update(encrypted, "hex", "utf8");
  decrypted += decipher.final("utf8");
  return decrypted;
}

export interface OAuthConfig {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
  authUrl: string;
  tokenUrl: string;
  scopes: string[];
}

export const oauthConfigs: Record<string, () => OAuthConfig> = {
  gmail: () => ({
    clientId: process.env.GMAIL_CLIENT_ID || "",
    clientSecret: process.env.GMAIL_CLIENT_SECRET || "",
    redirectUri: `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/api/integrations/gmail/callback`,
    authUrl: "https://accounts.google.com/o/oauth2/v2/auth",
    tokenUrl: "https://oauth2.googleapis.com/token",
    scopes: ["https://www.googleapis.com/auth/gmail.readonly", "https://www.googleapis.com/auth/gmail.send"],
  }),
  slack: () => ({
    clientId: process.env.SLACK_CLIENT_ID || "",
    clientSecret: process.env.SLACK_CLIENT_SECRET || "",
    redirectUri: `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/api/integrations/slack/callback`,
    authUrl: "https://slack.com/oauth/v2/authorize",
    tokenUrl: "https://slack.com/api/oauth.v2.access",
    scopes: ["channels:read", "channels:history", "chat:write", "users:read"],
  }),
  shopify: () => ({
    clientId: process.env.SHOPIFY_CLIENT_ID || "",
    clientSecret: process.env.SHOPIFY_CLIENT_SECRET || "",
    redirectUri: `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/api/integrations/shopify/callback`,
    authUrl: "", // Dynamic per shop
    tokenUrl: "", // Dynamic per shop
    scopes: ["read_customers", "read_orders"],
  }),
};

export function buildOAuthUrl(provider: string, state: string, shopDomain?: string): string {
  const config = oauthConfigs[provider]?.();
  if (!config) throw new Error(`Unknown provider: ${provider}`);

  if (provider === "shopify" && shopDomain) {
    return `https://${shopDomain}/admin/oauth/authorize?` + new URLSearchParams({
      client_id: config.clientId,
      scope: config.scopes.join(","),
      redirect_uri: config.redirectUri,
      state,
    }).toString();
  }

  return `${config.authUrl}?` + new URLSearchParams({
    client_id: config.clientId,
    redirect_uri: config.redirectUri,
    scope: config.scopes.join(" "),
    response_type: "code",
    state,
    access_type: "offline",
    prompt: "consent",
  }).toString();
}

export async function exchangeCodeForToken(
  provider: string,
  code: string,
  shopDomain?: string
): Promise<{ accessToken: string; refreshToken?: string }> {
  const config = oauthConfigs[provider]?.();
  if (!config) throw new Error(`Unknown provider: ${provider}`);

  const tokenUrl = provider === "shopify" && shopDomain
    ? `https://${shopDomain}/admin/oauth/access_token`
    : config.tokenUrl;

  const body: Record<string, string> = {
    client_id: config.clientId,
    client_secret: config.clientSecret,
    code,
  };

  if (provider !== "shopify") {
    body.redirect_uri = config.redirectUri;
    body.grant_type = "authorization_code";
  }

  const res = await fetch(tokenUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!res.ok) throw new Error(`Token exchange failed: ${res.status}`);
  const data = await res.json();

  return {
    accessToken: data.access_token,
    refreshToken: data.refresh_token,
  };
}
