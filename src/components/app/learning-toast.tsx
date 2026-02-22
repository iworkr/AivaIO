"use client";

import { useEffect, useState } from "react";
import { Toast } from "@/components/ui";
import { Sparkles } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

export function LearningToast() {
  const [message, setMessage] = useState("");
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const supabase = createClient();

    const channel = supabase
      .channel("learning-updates")
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "voice_preferences" },
        (payload) => {
          const newProfile = payload.new as Record<string, unknown>;
          const oldProfile = payload.old as Record<string, unknown>;
          if (newProfile && oldProfile) {
            setMessage('AIVA updated your tone profile based on recent edits.');
            setVisible(true);
          }
        }
      )
      .subscribe();

    return () => { channel.unsubscribe(); };
  }, []);

  return (
    <Toast
      visible={visible}
      onClose={() => setVisible(false)}
      icon={<Sparkles size={14} className="text-[var(--aiva-blue)]" />}
      message={message}
      duration={4000}
    />
  );
}
