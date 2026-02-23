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

export const STRIPE_PRICES = {
  monthly: process.env.STRIPE_PRICE_MONTHLY || "price_monthly_placeholder",
  annual: process.env.STRIPE_PRICE_ANNUAL || "price_annual_placeholder",
} as const;

export const STRIPE_WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET || "";
