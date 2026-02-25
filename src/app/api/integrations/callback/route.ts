import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";
import { exchangeCodeForToken } from "@/lib/integrations/oauth";

function getServiceClient() {
  return createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

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
  let returnTo: string | undefined;

  try {
    const decoded = JSON.parse(Buffer.from(stateParam, "base64url").toString());
    provider = decoded.provider || "gmail";
    userId = decoded.userId;
    returnTo = decoded.returnTo;
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

  // Resolve workspace_id — use service client to bypass RLS for this lookup
  const serviceClient = getServiceClient();

  const workspaceId = (user.user_metadata as Record<string, string>)?.workspace_id;
  let resolvedWorkspaceId = workspaceId;

  if (!resolvedWorkspaceId) {
    const { data: membership } = await serviceClient
      .from("workspace_members")
      .select("workspace_id")
      .eq("workspace_member_id", user.id)
      .limit(1)
      .maybeSingle();

    if (membership?.workspace_id) {
      resolvedWorkspaceId = membership.workspace_id as string;
    }
  }

  // Final fallback: find workspace where user is a member (service role for reliable lookup)
  if (!resolvedWorkspaceId) {
    console.error(`OAuth callback: no workspace found for user ${user.id}`);
    return NextResponse.redirect(`${origin}/app/settings?error=no_workspace`);
  }

  const errorBase = returnTo || "/app/settings";

  try {
    const redirectUri = `${origin}/api/integrations/callback`;
    const { accessToken, refreshToken, email } = await exchangeCodeForToken(
      provider, code, redirectUri, shop || undefined
    );

    const accountId = email || shop || user.email || user.id;
    const accountName = email || shop || user.email || provider;

    // Use service client for DB writes to bypass RLS issues
    const { data: existing } = await serviceClient
      .from("channel_connections")
      .select("id")
      .eq("user_id", user.id)
      .eq("provider", provider)
      .maybeSingle();

    if (existing) {
      const { error: updateError } = await serviceClient
        .from("channel_connections")
        .update({
          access_token: accessToken,
          refresh_token: refreshToken || null,
          provider_account_id: accountId,
          provider_account_name: accountName,
          status: "active",
          last_sync_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq("id", existing.id);

      if (updateError) {
        console.error(`OAuth callback: failed to update connection for ${provider}:`, updateError);
        return NextResponse.redirect(`${origin}${errorBase}?error=connection_save_failed`);
      }
    } else {
      const { error: insertError } = await serviceClient
        .from("channel_connections")
        .insert({
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
            : provider === "microsoft"
            ? ["Calendars.ReadWrite", "User.Read"]
            : ["read_customers", "read_orders"],
          last_sync_at: new Date().toISOString(),
        });

      if (insertError) {
        console.error(`OAuth callback: failed to insert connection for ${provider}:`, insertError);
        return NextResponse.redirect(`${origin}${errorBase}?error=connection_save_failed`);
      }
    }

    const successBase = returnTo || "/app/settings";
    return NextResponse.redirect(`${origin}${successBase}?success=true&integration=${provider}`);
  } catch (err) {
    console.error(`OAuth callback error for ${provider}:`, err);
    return NextResponse.redirect(`${origin}${errorBase}?error=token_exchange_failed`);
  }
}
