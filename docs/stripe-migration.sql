-- ═══════════════════════════════════════════════════════
-- Aiva Pro – Stripe Billing Schema Migration
-- ═══════════════════════════════════════════════════════

-- 1. Extend user_profiles with subscription fields
ALTER TABLE user_profiles
  ADD COLUMN IF NOT EXISTS subscription_tier TEXT NOT NULL DEFAULT 'free'
    CHECK (subscription_tier IN ('free', 'pro')),
  ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT UNIQUE,
  ADD COLUMN IF NOT EXISTS stripe_subscription_id TEXT UNIQUE,
  ADD COLUMN IF NOT EXISTS billing_interval TEXT
    CHECK (billing_interval IN ('monthly', 'annual')),
  ADD COLUMN IF NOT EXISTS current_period_end TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS cancel_at_period_end BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS payment_failed BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS grace_deadline TIMESTAMPTZ;

-- Index for webhook lookups
CREATE INDEX IF NOT EXISTS idx_user_profiles_stripe_customer
  ON user_profiles(stripe_customer_id)
  WHERE stripe_customer_id IS NOT NULL;

-- 2. Webhook idempotency table
CREATE TABLE IF NOT EXISTS stripe_webhook_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  stripe_event_id TEXT NOT NULL UNIQUE,
  event_type TEXT NOT NULL,
  processed_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- RLS: service-role only (webhooks use admin client)
ALTER TABLE stripe_webhook_events ENABLE ROW LEVEL SECURITY;

-- Auto-clean events older than 30 days (optional, run via cron)
-- DELETE FROM stripe_webhook_events WHERE processed_at < now() - interval '30 days';

-- 3. RLS policies for user_profiles subscription columns
-- Users can read their own subscription info (already covered by existing RLS on user_profiles)
-- Only the service role (webhook handler) should update subscription_tier, stripe_* columns.
-- The existing RLS policy for user_profiles already allows:
--   SELECT: auth.uid() = id
--   UPDATE: auth.uid() = id
-- Stripe webhook uses supabase admin client which bypasses RLS.
