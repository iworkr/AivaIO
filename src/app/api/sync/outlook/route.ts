import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { oauthConfigs } from "@/lib/integrations/oauth";

export const maxDuration = 60;

const GRAPH_API = "https://graph.microsoft.com/v1.0";

async function refreshMicrosoftToken(
  refreshToken: string
): Promise<{ accessToken: string; expiresAt: Date }> {
  const config = oauthConfigs.microsoft();
  const res = await fetch("https://login.microsoftonline.com/common/oauth2/v2.0/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: config.clientId,
      client_secret: config.clientSecret,
      refresh_token: refreshToken,
      grant_type: "refresh_token",
      scope: config.scopes.join(" "),
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Microsoft token refresh failed (${res.status}): ${text}`);
  }

  const data = await res.json();
  return {
    accessToken: data.access_token,
    expiresAt: new Date(Date.now() + (data.expires_in || 3600) * 1000),
  };
}

export async function POST() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: connection } = await supabase
    .from("channel_connections")
    .select("*")
    .eq("user_id", user.id)
    .eq("provider", "microsoft")
    .eq("status", "active")
    .maybeSingle();

  if (!connection) {
    return NextResponse.json({ error: "No active Microsoft connection found" }, { status: 404 });
  }

  let accessToken = connection.access_token as string;
  const expiresAt = new Date(connection.token_expires_at || 0);

  if (expiresAt <= new Date()) {
    const refreshed = await refreshMicrosoftToken(connection.refresh_token as string);
    accessToken = refreshed.accessToken;
    await supabase
      .from("channel_connections")
      .update({
        access_token: refreshed.accessToken,
        token_expires_at: refreshed.expiresAt.toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", connection.id);
  }

  // Sync calendar events for the next 30 days plus past 7 days
  const now = new Date();
  const startDate = new Date(now);
  startDate.setDate(startDate.getDate() - 7);
  const endDate = new Date(now);
  endDate.setDate(endDate.getDate() + 30);

  const calViewUrl =
    `${GRAPH_API}/me/calendarView` +
    `?startDateTime=${startDate.toISOString()}` +
    `&endDateTime=${endDate.toISOString()}` +
    `&$top=100` +
    `&$select=id,subject,start,end,location,attendees,onlineMeeting,isAllDay,isCancelled,bodyPreview`;

  const eventsRes = await fetch(calViewUrl, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!eventsRes.ok) {
    const text = await eventsRes.text();
    throw new Error(`Microsoft Graph calendarView failed (${eventsRes.status}): ${text}`);
  }

  const eventsData = await eventsRes.json();
  const events: Array<Record<string, unknown>> = eventsData.value || [];

  let synced = 0;

  for (const event of events) {
    if (event.isCancelled) continue;

    const providerEventId = `msft_${event.id}`;
    const startTime = (event.start as Record<string, string>)?.dateTime;
    const endTime = (event.end as Record<string, string>)?.dateTime;
    if (!startTime || !endTime) continue;

    const attendees = ((event.attendees as Array<{ emailAddress: { address: string; name: string } }>) || [])
      .map((a) => a.emailAddress?.address)
      .filter(Boolean);

    const conferenceUrl =
      (event.onlineMeeting as Record<string, string> | null)?.joinUrl || null;

    const locationStr =
      (event.location as Record<string, string> | null)?.displayName || null;

    const { data: existing } = await supabase
      .from("calendar_events")
      .select("id")
      .eq("user_id", user.id)
      .eq("provider_event_id", providerEventId)
      .maybeSingle();

    const eventPayload = {
      user_id: user.id,
      title: (event.subject as string) || "(No title)",
      start_time: new Date(startTime).toISOString(),
      end_time: new Date(endTime).toISOString(),
      description: (event.bodyPreview as string) || null,
      location: locationStr,
      attendees,
      conference_url: conferenceUrl,
      provider: "microsoft",
      provider_event_id: providerEventId,
      is_all_day: (event.isAllDay as boolean) || false,
      updated_at: new Date().toISOString(),
    };

    if (existing) {
      await supabase.from("calendar_events").update(eventPayload).eq("id", existing.id);
    } else {
      await supabase.from("calendar_events").insert({ ...eventPayload, created_by: "outlook_sync" });
      synced++;
    }
  }

  await supabase
    .from("channel_connections")
    .update({ last_sync_at: new Date().toISOString(), updated_at: new Date().toISOString() })
    .eq("id", connection.id);

  return NextResponse.json({ synced, total: events.length });
}
