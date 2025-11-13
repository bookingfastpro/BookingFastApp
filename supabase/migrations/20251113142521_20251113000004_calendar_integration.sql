/*
  # Migration 04: Calendar Integration
  
  ## Overview
  Google Calendar integration and availability management
  
  ## Tables Created
  1. **google_calendar_tokens**
     - id, user_id, access_token, refresh_token
     - token_expiry, scope, calendar_id
  
  2. **unavailabilities**
     - id, user_id, date, start_time, end_time
     - reason, is_recurring, recurrence_pattern
  
  3. **blocked_date_ranges**
     - id, user_id, start_date, end_date
     - reason, is_all_day
  
  ## Security
  - RLS enabled on all tables
  - Users can only manage their own calendar tokens
  - Users can only manage their own unavailabilities
  - Users can manage blocked date ranges
*/

-- ============================================================================
-- DROP EXISTING TABLES
-- ============================================================================

DROP TABLE IF EXISTS blocked_date_ranges CASCADE;
DROP TABLE IF EXISTS unavailabilities CASCADE;
DROP TABLE IF EXISTS google_calendar_tokens CASCADE;

-- ============================================================================
-- TABLE: google_calendar_tokens
-- ============================================================================

CREATE TABLE IF NOT EXISTS google_calendar_tokens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  access_token text NOT NULL,
  refresh_token text NOT NULL,
  token_expiry timestamptz NOT NULL,
  scope text NOT NULL,
  calendar_id text,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL,
  UNIQUE(user_id)
);

COMMENT ON TABLE google_calendar_tokens IS 'Google Calendar OAuth tokens per user';

ALTER TABLE google_calendar_tokens ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own tokens"
  ON google_calendar_tokens FOR ALL
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- ============================================================================
-- TABLE: unavailabilities
-- ============================================================================

CREATE TABLE IF NOT EXISTS unavailabilities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  date date NOT NULL,
  start_time time NOT NULL,
  end_time time NOT NULL,
  reason text,
  is_recurring boolean DEFAULT false,
  recurrence_pattern jsonb,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

COMMENT ON TABLE unavailabilities IS 'User unavailability periods';

ALTER TABLE unavailabilities ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view all unavailabilities"
  ON unavailabilities FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can manage their own unavailabilities"
  ON unavailabilities FOR ALL
  TO authenticated
  USING (user_id = auth.uid() OR user_id IS NULL)
  WITH CHECK (user_id = auth.uid() OR user_id IS NULL);

-- Allow anon to view for public booking pages
CREATE POLICY "Public can view unavailabilities"
  ON unavailabilities FOR SELECT
  TO anon
  USING (true);

-- ============================================================================
-- TABLE: blocked_date_ranges
-- ============================================================================

CREATE TABLE IF NOT EXISTS blocked_date_ranges (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  start_date date NOT NULL,
  end_date date NOT NULL,
  reason text,
  is_all_day boolean DEFAULT true,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL,
  CHECK (end_date >= start_date)
);

COMMENT ON TABLE blocked_date_ranges IS 'Blocked date ranges for vacation, holidays, etc.';

ALTER TABLE blocked_date_ranges ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Everyone can view blocked dates"
  ON blocked_date_ranges FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Authenticated users can manage blocked dates"
  ON blocked_date_ranges FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_google_calendar_tokens_user_id ON google_calendar_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_unavailabilities_user_id ON unavailabilities(user_id);
CREATE INDEX IF NOT EXISTS idx_unavailabilities_date ON unavailabilities(date);
CREATE INDEX IF NOT EXISTS idx_blocked_date_ranges_dates ON blocked_date_ranges(start_date, end_date);

-- Grants
GRANT ALL ON google_calendar_tokens TO authenticated;
GRANT ALL ON unavailabilities TO authenticated;
GRANT SELECT ON unavailabilities TO anon;
GRANT ALL ON blocked_date_ranges TO authenticated;
GRANT SELECT ON blocked_date_ranges TO anon;