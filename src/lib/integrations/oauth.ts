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

function getAppUrl(): string {
  if (process.env.NEXT_PUBLIC_APP_URL) return process.env.NEXT_PUBLIC_APP_URL;
  if (process.env.NEXT_PUBLIC_SITE_URL) return process.env.NEXT_PUBLIC_SITE_URL;
  if (process.env.VERCEL_PROJECT_PRODUCTION_URL) return `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`;
  return "http://localhost:3000";
}

export const oauthConfigs: Record<string, () => OAuthConfig> = {
  gmail: () => ({
    clientId: process.env.GMAIL_CLIENT_ID || process.env.GOOGLE_CLIENT_ID || "",
    clientSecret: process.env.GMAIL_CLIENT_SECRET || process.env.GOOGLE_CLIENT_SECRET || "",
    redirectUri: `${getAppUrl()}/api/integrations/callback`,
    authUrl: "https://accounts.google.com/o/oauth2/v2/auth",
    tokenUrl: "https://oauth2.googleapis.com/token",
    scopes: [
      "https://www.googleapis.com/auth/gmail.readonly",
      "https://www.googleapis.com/auth/gmail.send",
      "https://www.googleapis.com/auth/userinfo.email",
    ],
  }),
  slack: () => ({
    clientId: process.env.SLACK_CLIENT_ID || "",
    clientSecret: process.env.SLACK_CLIENT_SECRET || "",
    redirectUri: `${getAppUrl()}/api/integrations/callback`,
    authUrl: "https://slack.com/oauth/v2/authorize",
    tokenUrl: "https://slack.com/api/oauth.v2.access",
    scopes: ["channels:read", "channels:history", "chat:write", "users:read"],
  }),
  shopify: () => ({
    clientId: process.env.SHOPIFY_CLIENT_ID || "",
    clientSecret: process.env.SHOPIFY_CLIENT_SECRET || "",
    redirectUri: `${getAppUrl()}/api/integrations/callback`,
    authUrl: "",
    tokenUrl: "",
    scopes: ["read_customers", "read_orders"],
  }),
  microsoft: () => ({
    clientId: process.env.MICROSOFT_CLIENT_ID || process.env.AZURE_CLIENT_ID || "",
    clientSecret: process.env.MICROSOFT_CLIENT_SECRET || process.env.AZURE_CLIENT_SECRET || "",
    redirectUri: `${getAppUrl()}/api/integrations/callback`,
    authUrl: "https://login.microsoftonline.com/common/oauth2/v2.0/authorize",
    tokenUrl: "https://login.microsoftonline.com/common/oauth2/v2.0/token",
    scopes: [
      "https://graph.microsoft.com/Calendars.ReadWrite",
      "https://graph.microsoft.com/User.Read",
      "offline_access",
      "openid",
    ],
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

  const params: Record<string, string> = {
    client_id: config.clientId,
    redirect_uri: config.redirectUri,
    scope: config.scopes.join(" "),
    response_type: "code",
    state,
  };

  // Google requires access_type=offline for refresh tokens; Microsoft uses offline_access scope
  if (provider !== "microsoft") {
    params.access_type = "offline";
    params.prompt = "consent";
  }

  return `${config.authUrl}?` + new URLSearchParams(params).toString();
}

export async function exchangeCodeForToken(
  provider: string,
  code: string,
  redirectUri: string,
  shopDomain?: string
): Promise<{ accessToken: string; refreshToken?: string; email?: string }> {
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
    body.redirect_uri = redirectUri;
    body.grant_type = "authorization_code";
  }

  const contentType = (provider === "slack" || provider === "microsoft")
    ? "application/x-www-form-urlencoded"
    : "application/json";

  const res = await fetch(tokenUrl, {
    method: "POST",
    headers: { "Content-Type": contentType },
    body: contentType === "application/x-www-form-urlencoded"
      ? new URLSearchParams(body).toString()
      : JSON.stringify(body),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Token exchange failed (${res.status}): ${text}`);
  }

  const data = await res.json();

  let email: string | undefined;

  if (provider === "gmail" && data.access_token) {
    try {
      const profileRes = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
        headers: { Authorization: `Bearer ${data.access_token}` },
      });
      if (profileRes.ok) {
        const profile = await profileRes.json();
        email = profile.email;
      }
    } catch {
      // non-critical
    }
  }

  if (provider === "microsoft" && data.access_token) {
    try {
      const profileRes = await fetch("https://graph.microsoft.com/v1.0/me", {
        headers: { Authorization: `Bearer ${data.access_token}` },
      });
      if (profileRes.ok) {
        const profile = await profileRes.json();
        email = profile.userPrincipalName || profile.mail;
      }
    } catch {
      // non-critical
    }
  }

  return {
    accessToken: data.access_token,
    refreshToken: data.refresh_token,
    email,
  };
}
