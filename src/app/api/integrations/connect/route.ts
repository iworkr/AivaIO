import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { buildOAuthUrl } from "@/lib/integrations/oauth";
import { randomBytes } from "crypto";

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { provider, shopDomain, returnTo } = await request.json();

  if (!provider) {
    return NextResponse.json({ error: "Missing provider" }, { status: 400 });
  }

  const state = randomBytes(16).toString("hex");
  const statePayload = JSON.stringify({ provider, userId: user.id, state, returnTo });
  const encodedState = Buffer.from(statePayload).toString("base64url");

  try {
    const authUrl = buildOAuthUrl(provider, encodedState, shopDomain);
    return NextResponse.json({ authUrl });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to build OAuth URL" },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const provider = searchParams.get("provider");

  if (!provider) {
    return NextResponse.redirect(`${origin}/app/settings?error=missing_provider`);
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.redirect(`${origin}/auth/login`);
  }

  const state = randomBytes(16).toString("hex");
  const statePayload = JSON.stringify({ provider, userId: user.id, state });
  const encodedState = Buffer.from(statePayload).toString("base64url");

  try {
    const authUrl = buildOAuthUrl(provider, encodedState);
    return NextResponse.redirect(authUrl);
  } catch {
    return NextResponse.redirect(`${origin}/app/settings?error=oauth_init_failed`);
  }
}
