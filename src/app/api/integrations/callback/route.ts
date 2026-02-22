import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { exchangeCodeForToken } from "@/lib/integrations/oauth";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const stateParam = searchParams.get("state");
  const shop = searchParams.get("shop");

  if (!code || !stateParam) {
    return NextResponse.redirect(`${origin}/app/settings?error=oauth_missing_params`);
  }

  let provider = "gmail";
  let userId: string | undefined;

  try {
    const decoded = JSON.parse(Buffer.from(stateParam, "base64url").toString());
    provider = decoded.provider || "gmail";
    userId = decoded.userId;
  } catch {
    return NextResponse.redirect(`${origin}/app/settings?error=invalid_state`);
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.redirect(`${origin}/auth/login`);
  }

  if (userId && userId !== user.id) {
    return NextResponse.redirect(`${origin}/app/settings?error=state_mismatch`);
  }

  const workspaceId = (user.user_metadata as Record<string, string>)?.workspace_id;

  let resolvedWorkspaceId = workspaceId;

  if (!resolvedWorkspaceId) {
    const { data: membership } = await supabase
      .from("workspace_members")
      .select("workspace_id")
      .eq("workspace_member_id", user.id)
      .limit(1)
      .maybeSingle();

    if (membership?.workspace_id) {
      resolvedWorkspaceId = membership.workspace_id as string;
    }
  }

  if (!resolvedWorkspaceId) {
    const { data: workspace } = await supabase
      .from("workspaces")
      .select("id")
      .limit(1)
      .maybeSingle();

    resolvedWorkspaceId = workspace?.id as string;
  }

  if (!resolvedWorkspaceId) {
    return NextResponse.redirect(`${origin}/app/settings?error=no_workspace`);
  }

  try {
    const redirectUri = `${origin}/api/integrations/callback`;
    const { accessToken, refreshToken, email } = await exchangeCodeForToken(
      provider, code, redirectUri, shop || undefined
    );

    const accountId = email || shop || user.email || user.id;
    const accountName = email || shop || user.email || provider;

    const { data: existing } = await supabase
      .from("channel_connections")
      .select("id")
      .eq("user_id", user.id)
      .eq("provider", provider)
      .maybeSingle();

    if (existing) {
      await supabase.from("channel_connections").update({
        access_token: accessToken,
        refresh_token: refreshToken || null,
        provider_account_id: accountId,
        provider_account_name: accountName,
        status: "active",
        last_sync_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }).eq("id", existing.id);
    } else {
      await supabase.from("channel_connections").insert({
        workspace_id: resolvedWorkspaceId,
        user_id: user.id,
        provider,
        provider_account_id: accountId,
        provider_account_name: accountName,
        access_token: accessToken,
        refresh_token: refreshToken || null,
        status: "active",
        scopes: provider === "gmail"
          ? ["gmail.readonly", "gmail.send"]
          : provider === "slack"
          ? ["channels:read", "channels:history", "chat:write"]
          : ["read_customers", "read_orders"],
        last_sync_at: new Date().toISOString(),
      });
    }

    return NextResponse.redirect(`${origin}/app/settings?connected=${provider}`);
  } catch (err) {
    console.error(`OAuth callback error for ${provider}:`, err);
    return NextResponse.redirect(`${origin}/app/settings?error=token_exchange_failed`);
  }
}
