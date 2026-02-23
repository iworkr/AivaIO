-- ═══════════════════════════════════════════════════════════════
-- NEXUS ENGINE: Inbox-Calendar Integration Schema
-- Run this migration against your Supabase project
-- ═══════════════════════════════════════════════════════════════

-- 1. Pending AIVA Actions queue (approval workflow)
CREATE TABLE IF NOT EXISTS aiva_pending_actions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('send_scheduling_email', 'create_calendar_event', 'timebox_task', 'auto_reply', 'reschedule')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'executed')),
  summary TEXT NOT NULL,
  details JSONB NOT NULL DEFAULT '{}',
  source_thread_id UUID REFERENCES threads(id) ON DELETE SET NULL,
  audit_reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  executed_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_pending_actions_user_status ON aiva_pending_actions(user_id, status);
CREATE INDEX IF NOT EXISTS idx_pending_actions_created ON aiva_pending_actions(created_at DESC);

-- 2. Extend calendar_events with Nexus fields
ALTER TABLE calendar_events
  ADD COLUMN IF NOT EXISTS conference_url TEXT,
  ADD COLUMN IF NOT EXISTS attendees JSONB DEFAULT '[]',
  ADD COLUMN IF NOT EXISTS created_by TEXT DEFAULT 'user' CHECK (created_by IN ('user', 'aiva')),
  ADD COLUMN IF NOT EXISTS source_thread_id UUID REFERENCES threads(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS source_action TEXT;

CREATE INDEX IF NOT EXISTS idx_calendar_events_source_thread ON calendar_events(source_thread_id) WHERE source_thread_id IS NOT NULL;

-- 3. Extend tasks with source thread reference
ALTER TABLE tasks
  ADD COLUMN IF NOT EXISTS source_thread_id UUID REFERENCES threads(id) ON DELETE SET NULL;

-- 4. Add scheduling_rules to workspace_settings
ALTER TABLE workspace_settings
  ADD COLUMN IF NOT EXISTS scheduling_rules JSONB DEFAULT '{
    "bufferMinutes": 15,
    "noMeetingDays": [],
    "workingHoursStart": "09:00",
    "workingHoursEnd": "17:00",
    "defaultMeetingDuration": 30,
    "timezone": "America/New_York"
  }';

-- Also support user-level scheduling rules
ALTER TABLE workspace_settings
  ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- 5. Contact knowledge graph enhancements
ALTER TABLE contacts
  ADD COLUMN IF NOT EXISTS meeting_frequency REAL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS priority_score REAL DEFAULT 0.5,
  ADD COLUMN IF NOT EXISTS timezone TEXT,
  ADD COLUMN IF NOT EXISTS last_meeting_at TIMESTAMPTZ;

-- 6. Extend ai_action_logs for Nexus audit trail
ALTER TABLE ai_action_logs
  ADD COLUMN IF NOT EXISTS source_thread_id UUID REFERENCES threads(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS details JSONB DEFAULT '{}';

-- 7. RLS policies for aiva_pending_actions
ALTER TABLE aiva_pending_actions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own pending actions"
  ON aiva_pending_actions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own pending actions"
  ON aiva_pending_actions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own pending actions"
  ON aiva_pending_actions FOR UPDATE
  USING (auth.uid() = user_id);

-- 8. Function to auto-update updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_aiva_pending_actions_updated_at
  BEFORE UPDATE ON aiva_pending_actions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
