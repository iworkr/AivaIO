import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { exchangeCodeForToken, encryptToken } from "@/lib/integrations/oauth";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const state = searchParams.get("state");
  const provider = searchParams.get("provider") || "gmail";
  const shop = searchParams.get("shop");

  if (!code || !state) {
    return NextResponse.redirect(new URL("/app/settings?error=oauth_failed", request.url));
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.redirect(new URL("/auth/login", request.url));
  }

  // Validate state
  const { data: connection } = await supabase
    .from("channel_connections")
    .select("*")
    .eq("user_id", user.id)
    .eq("provider", provider)
    .eq("oauth_state", state)
    .maybeSingle();

  if (!connection) {
    return NextResponse.redirect(new URL("/app/settings?error=invalid_state", request.url));
  }

  try {
    const { accessToken, refreshToken } = await exchangeCodeForToken(provider, code, shop || undefined);

    // Encrypt and store token
    const encrypted = encryptToken(accessToken);

    await supabase.from("channel_connections").update({
      status: "syncing",
      encrypted_access_token: encrypted.encrypted,
      encryption_iv: encrypted.iv,
      encryption_tag: encrypted.tag,
      refresh_token: refreshToken ? encryptToken(refreshToken).encrypted : null,
      account_label: shop || user.email,
      last_synced_at: new Date().toISOString(),
    }).eq("id", connection.id);

    return NextResponse.redirect(new URL("/app/settings?connected=" + provider, request.url));
  } catch {
    await supabase.from("channel_connections").update({
      status: "disconnected",
    }).eq("id", connection.id);

    return NextResponse.redirect(new URL("/app/settings?error=token_exchange_failed", request.url));
  }
}
