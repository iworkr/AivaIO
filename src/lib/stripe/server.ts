import Stripe from "stripe";

let _stripe: Stripe | null = null;

export function getStripe(): Stripe {
  if (!_stripe) {
    const key = process.env.STRIPE_SECRET_KEY;
    if (!key) throw new Error("STRIPE_SECRET_KEY not set");
    _stripe = new Stripe(key, { apiVersion: "2026-01-28.clover" as const });
  }
  return _stripe;
}

export function getStripePrices(): { monthly: string; annual: string } {
  const monthly = process.env.STRIPE_PRICE_MONTHLY;
  const annual = process.env.STRIPE_PRICE_ANNUAL;
  if (!monthly) throw new Error("STRIPE_PRICE_MONTHLY not set");
  if (!annual) throw new Error("STRIPE_PRICE_ANNUAL not set");
  return { monthly, annual };
}

export const STRIPE_WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET || "";
