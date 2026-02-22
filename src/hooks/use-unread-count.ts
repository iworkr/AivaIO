"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "./use-auth";

export function useUnreadCount() {
  const { user } = useAuth();
  const [count, setCount] = useState<number>(0);

  useEffect(() => {
    if (!user) return;

    const supabase = createClient();

    async function fetchCount() {
      const { count: unread } = await supabase
        .from("threads")
        .select("id", { count: "exact", head: true })
        .eq("is_unread", true)
        .eq("is_archived", false);

      setCount(unread ?? 0);
    }

    fetchCount();

    const channel = supabase
      .channel("unread-count")
      .on("postgres_changes", { event: "*", schema: "public", table: "threads" }, () => {
        fetchCount();
      })
      .subscribe();

    return () => { channel.unsubscribe(); };
  }, [user]);

  return count;
}
