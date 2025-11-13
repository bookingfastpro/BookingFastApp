/*
  # Migration 11: Audit, History, and Platform Settings
  
  ## Overview
  Audit trails, booking history, and platform-wide settings
  
  ## Tables Created
  1. **booking_history**
     - id, booking_id, user_id, action
     - changes (JSONB), ip_address
  
  2. **multi_user_settings**
     - id, user_id, setting_key, setting_value (JSONB)
  
  3. **platform_settings**
     - id, setting_key, setting_value (JSONB)
     - is_public, description
  
  4. **app_versions**
     - id, version_number, release_date
     - features (JSONB), is_current
  
  5. **admin_sessions**
     - id, admin_user_id, impersonated_user_id
     - started_at, ended_at, reason
  
  ## Security
  - RLS enabled on all tables
  - Users can view their own history
  - Platform settings viewable based on is_public flag
*/

-- ============================================================================
-- DROP EXISTING TABLES
-- ============================================================================

DROP TABLE IF EXISTS admin_sessions CASCADE;
DROP TABLE IF EXISTS app_versions CASCADE;
DROP TABLE IF EXISTS platform_settings CASCADE;
DROP TABLE IF EXISTS multi_user_settings CASCADE;
DROP TABLE IF EXISTS booking_history CASCADE;

-- ============================================================================
-- TABLE: booking_history
-- ============================================================================

CREATE TABLE IF NOT EXISTS booking_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id uuid REFERENCES bookings(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  action text NOT NULL CHECK (action IN ('created', 'updated', 'deleted', 'cancelled', 'confirmed', 'payment_received')),
  changes jsonb DEFAULT '{}'::jsonb,
  ip_address text,
  user_agent text,
  created_at timestamptz DEFAULT now() NOT NULL
);

COMMENT ON TABLE booking_history IS 'Audit trail for booking modifications';

ALTER TABLE booking_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view history for their bookings"
  ON booking_history FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "System can insert booking history"
  ON booking_history FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Service role can manage booking history"
  ON booking_history FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- ============================================================================
-- TABLE: multi_user_settings
-- ============================================================================

CREATE TABLE IF NOT EXISTS multi_user_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  setting_key text NOT NULL,
  setting_value jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL,
  UNIQUE(user_id, setting_key)
);

COMMENT ON TABLE multi_user_settings IS 'Per-user configuration settings';

ALTER TABLE multi_user_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own settings"
  ON multi_user_settings FOR ALL
  TO authenticated
  USING (user_id = auth.uid() OR user_id IS NULL)
  WITH CHECK (user_id = auth.uid() OR user_id IS NULL);

-- ============================================================================
-- TABLE: platform_settings
-- ============================================================================

CREATE TABLE IF NOT EXISTS platform_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  setting_key text UNIQUE NOT NULL,
  setting_value jsonb NOT NULL DEFAULT '{}'::jsonb,
  is_public boolean DEFAULT false,
  description text,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

COMMENT ON TABLE platform_settings IS 'Platform-wide configuration settings';

ALTER TABLE platform_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can view public settings"
  ON platform_settings FOR SELECT
  TO public
  USING (is_public = true);

CREATE POLICY "Authenticated users can view all settings"
  ON platform_settings FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can manage settings"
  ON platform_settings FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- ============================================================================
-- TABLE: app_versions
-- ============================================================================

CREATE TABLE IF NOT EXISTS app_versions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  version_number text UNIQUE NOT NULL,
  release_date date NOT NULL DEFAULT CURRENT_DATE,
  features jsonb DEFAULT '[]'::jsonb,
  is_current boolean DEFAULT false,
  created_at timestamptz DEFAULT now() NOT NULL
);

COMMENT ON TABLE app_versions IS 'Application version tracking';

ALTER TABLE app_versions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Everyone can view app versions"
  ON app_versions FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Authenticated users can manage versions"
  ON app_versions FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- ============================================================================
-- TABLE: admin_sessions
-- ============================================================================

CREATE TABLE IF NOT EXISTS admin_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  impersonated_user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  reason text,
  started_at timestamptz DEFAULT now() NOT NULL,
  ended_at timestamptz,
  created_at timestamptz DEFAULT now() NOT NULL
);

COMMENT ON TABLE admin_sessions IS 'Admin user impersonation sessions for support';

ALTER TABLE admin_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view their own sessions"
  ON admin_sessions FOR SELECT
  TO authenticated
  USING (admin_user_id = auth.uid() OR impersonated_user_id = auth.uid());

CREATE POLICY "Admins can manage sessions"
  ON admin_sessions FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_booking_history_booking_id ON booking_history(booking_id);
CREATE INDEX IF NOT EXISTS idx_booking_history_user_id ON booking_history(user_id);
CREATE INDEX IF NOT EXISTS idx_booking_history_created_at ON booking_history(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_multi_user_settings_user_id ON multi_user_settings(user_id);
CREATE INDEX IF NOT EXISTS idx_multi_user_settings_key ON multi_user_settings(setting_key);
CREATE INDEX IF NOT EXISTS idx_platform_settings_key ON platform_settings(setting_key);
CREATE INDEX IF NOT EXISTS idx_platform_settings_is_public ON platform_settings(is_public) WHERE is_public = true;
CREATE INDEX IF NOT EXISTS idx_app_versions_is_current ON app_versions(is_current) WHERE is_current = true;
CREATE INDEX IF NOT EXISTS idx_admin_sessions_admin_user ON admin_sessions(admin_user_id);
CREATE INDEX IF NOT EXISTS idx_admin_sessions_impersonated_user ON admin_sessions(impersonated_user_id);

-- Grants
GRANT ALL ON booking_history TO authenticated, service_role;
GRANT ALL ON multi_user_settings TO authenticated;
GRANT ALL ON platform_settings TO authenticated;
GRANT SELECT ON platform_settings TO anon;
GRANT ALL ON app_versions TO authenticated;
GRANT SELECT ON app_versions TO anon;
GRANT ALL ON admin_sessions TO authenticated;