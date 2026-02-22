"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "./use-auth";

export interface Integration {
  id: string;
  provider: string;
  status: "active" | "syncing" | "needs_reauth" | "disconnected";
  lastSyncAt: string | null;
  accountName: string | null;
}

export function useIntegrations() {
  const { user } = useAuth();
  const [integrations, setIntegrations] = useState<Integration[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!user) return;
    const supabase = createClient();
    const { data } = await supabase
      .from("channel_connections")
      .select("id, provider, status, last_sync_at, provider_account_name")
      .eq("user_id", user.id);

    setIntegrations(
      (data || []).map((c) => ({
        id: c.id,
        provider: c.provider,
        status: c.status as Integration["status"],
        lastSyncAt: c.last_sync_at,
        accountName: c.provider_account_name,
      }))
    );
    setLoading(false);
  }, [user]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const isConnected = useCallback(
    (provider: string) => integrations.some((i) => i.provider === provider && i.status === "active"),
    [integrations]
  );

  const hasAnyConnection = integrations.some((i) => i.status === "active");

  return { integrations, loading, refresh, isConnected, hasAnyConnection };
}
