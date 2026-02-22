import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { buildOAuthUrl } from "@/lib/integrations/oauth";
import { randomBytes } from "crypto";

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { provider, shopDomain } = await request.json();

  if (!provider) {
    return NextResponse.json({ error: "Missing provider" }, { status: 400 });
  }

  const state = randomBytes(16).toString("hex");

  // Store state for CSRF validation
  await supabase.from("channel_connections").upsert({
    user_id: user.id,
    provider,
    status: "connecting",
    oauth_state: state,
    workspace_id: user.user_metadata?.workspace_id,
  });

  const authUrl = buildOAuthUrl(provider, state, shopDomain);

  return NextResponse.json({ authUrl });
}
