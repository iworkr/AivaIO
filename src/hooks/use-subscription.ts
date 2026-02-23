"use client";

import { useState, useEffect, useCallback, createContext, useContext } from "react";
import type { SubscriptionStatus, SubscriptionTier, ProFeature } from "@/types";

interface SubscriptionContextValue {
  subscription: SubscriptionStatus;
  loading: boolean;
  isPro: boolean;
  canUse: (feature: ProFeature) => boolean;
  refresh: () => Promise<void>;
}

const DEFAULT_SUB: SubscriptionStatus = { tier: "free" };

const SubscriptionContext = createContext<SubscriptionContextValue>({
  subscription: DEFAULT_SUB,
  loading: true,
  isPro: false,
  canUse: () => false,
  refresh: async () => {},
});

export function useSubscription() {
  return useContext(SubscriptionContext);
}

export { SubscriptionContext };

export function useSubscriptionLoader(): SubscriptionContextValue {
  const [subscription, setSubscription] = useState<SubscriptionStatus>(DEFAULT_SUB);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      const res = await fetch("/api/stripe/status");
      if (res.ok) {
        const data = await res.json();
        setSubscription(data);
      }
    } catch {
      setSubscription(DEFAULT_SUB);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const isPro = subscription.tier === "pro";

  const canUse = useCallback(
    (feature: ProFeature) => {
      if (isPro) return true;
      // Free tier allowances
      const freeFeatures: ProFeature[] = [];
      return freeFeatures.includes(feature);
    },
    [isPro]
  );

  return { subscription, loading, isPro, canUse, refresh };
}
