/*
  # Migration 10: Notifications and Affiliate Program
  
  ## Overview
  Notification system and affiliate/referral program
  
  ## Tables Created
  1. **notifications**
     - id, user_id, type, title, message
     - is_read, action_url, metadata (JSONB)
  
  2. **affiliates**
     - id, user_id, code, commission_rate
     - total_earnings, status, payment_info (JSONB)
  
  3. **affiliate_referrals**
     - id, affiliate_id, referred_user_id
     - referral_code, status, converted_at
  
  4. **affiliate_commissions**
     - id, affiliate_id, referral_id, amount
     - status, paid_at, payment_reference
  
  5. **affiliate_settings**
     - id, user_id, is_affiliate_enabled
     - default_commission_rate, payment_threshold
  
  6. **access_codes**
     - id, code, type, value, max_uses
     - current_uses, expires_at, is_active
  
  7. **code_redemptions**
     - id, code_id, user_id, redeemed_at
  
  8. **onesignal_logs**
     - id, user_id, notification_type, external_id
     - status, response_data (JSONB)
  
  ## Security
  - RLS enabled on all tables
  - Users can only view their own notifications
  - Affiliates can view their own referrals and commissions
*/

-- ============================================================================
-- DROP EXISTING TABLES
-- ============================================================================

DROP TABLE IF EXISTS onesignal_logs CASCADE;
DROP TABLE IF EXISTS code_redemptions CASCADE;
DROP TABLE IF EXISTS access_codes CASCADE;
DROP TABLE IF EXISTS affiliate_settings CASCADE;
DROP TABLE IF EXISTS affiliate_commissions CASCADE;
DROP TABLE IF EXISTS affiliate_referrals CASCADE;
DROP TABLE IF EXISTS affiliates CASCADE;
DROP TABLE IF EXISTS notifications CASCADE;

-- ============================================================================
-- TABLE: notifications
-- ============================================================================

CREATE TABLE IF NOT EXISTS notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type text NOT NULL CHECK (type IN ('info', 'success', 'warning', 'error', 'booking', 'payment', 'system')),
  title text NOT NULL,
  message text NOT NULL,
  is_read boolean DEFAULT false,
  action_url text,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now() NOT NULL,
  read_at timestamptz
);

COMMENT ON TABLE notifications IS 'User notifications and alerts';

ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own notifications"
  ON notifications FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can update their own notifications"
  ON notifications FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Service role can manage notifications"
  ON notifications FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- ============================================================================
-- TABLE: affiliates
-- ============================================================================

CREATE TABLE IF NOT EXISTS affiliates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  code text UNIQUE NOT NULL,
  commission_rate numeric(5,2) DEFAULT 10.00,
  total_earnings numeric(10,2) DEFAULT 0,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'suspended')),
  payment_info jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

COMMENT ON TABLE affiliates IS 'Affiliate partners and their settings';

ALTER TABLE affiliates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Affiliates can view their own data"
  ON affiliates FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Affiliates can update their own data"
  ON affiliates FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- ============================================================================
-- TABLE: affiliate_referrals
-- ============================================================================

CREATE TABLE IF NOT EXISTS affiliate_referrals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  affiliate_id uuid NOT NULL REFERENCES affiliates(id) ON DELETE CASCADE,
  referred_user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  referral_code text NOT NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'converted', 'cancelled')),
  converted_at timestamptz,
  created_at timestamptz DEFAULT now() NOT NULL
);

COMMENT ON TABLE affiliate_referrals IS 'Tracked affiliate referrals';

ALTER TABLE affiliate_referrals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Affiliates can view their own referrals"
  ON affiliate_referrals FOR SELECT
  TO authenticated
  USING (
    affiliate_id IN (SELECT id FROM affiliates WHERE user_id = auth.uid())
  );

-- ============================================================================
-- TABLE: affiliate_commissions
-- ============================================================================

CREATE TABLE IF NOT EXISTS affiliate_commissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  affiliate_id uuid NOT NULL REFERENCES affiliates(id) ON DELETE CASCADE,
  referral_id uuid REFERENCES affiliate_referrals(id) ON DELETE SET NULL,
  amount numeric(10,2) NOT NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'cancelled')),
  paid_at timestamptz,
  payment_reference text,
  created_at timestamptz DEFAULT now() NOT NULL
);

COMMENT ON TABLE affiliate_commissions IS 'Commission payments to affiliates';

ALTER TABLE affiliate_commissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Affiliates can view their own commissions"
  ON affiliate_commissions FOR SELECT
  TO authenticated
  USING (
    affiliate_id IN (SELECT id FROM affiliates WHERE user_id = auth.uid())
  );

-- ============================================================================
-- TABLE: affiliate_settings
-- ============================================================================

CREATE TABLE IF NOT EXISTS affiliate_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  is_affiliate_enabled boolean DEFAULT true,
  default_commission_rate numeric(5,2) DEFAULT 10.00,
  payment_threshold numeric(10,2) DEFAULT 50.00,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

COMMENT ON TABLE affiliate_settings IS 'Platform affiliate program settings';

ALTER TABLE affiliate_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view affiliate settings"
  ON affiliate_settings FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can manage affiliate settings"
  ON affiliate_settings FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- ============================================================================
-- TABLE: access_codes
-- ============================================================================

CREATE TABLE IF NOT EXISTS access_codes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text UNIQUE NOT NULL,
  type text NOT NULL CHECK (type IN ('discount', 'free_trial', 'plugin_access', 'subscription')),
  value jsonb NOT NULL,
  max_uses integer,
  current_uses integer DEFAULT 0,
  expires_at timestamptz,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

COMMENT ON TABLE access_codes IS 'Access codes for discounts and features';

ALTER TABLE access_codes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Everyone can view active access codes"
  ON access_codes FOR SELECT
  TO public
  USING (is_active = true AND (expires_at IS NULL OR expires_at > now()));

CREATE POLICY "Authenticated users can manage access codes"
  ON access_codes FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- ============================================================================
-- TABLE: code_redemptions
-- ============================================================================

CREATE TABLE IF NOT EXISTS code_redemptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code_id uuid NOT NULL REFERENCES access_codes(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  redeemed_at timestamptz DEFAULT now() NOT NULL,
  UNIQUE(code_id, user_id)
);

COMMENT ON TABLE code_redemptions IS 'Tracking of redeemed access codes';

ALTER TABLE code_redemptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own redemptions"
  ON code_redemptions FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can redeem codes"
  ON code_redemptions FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- ============================================================================
-- TABLE: onesignal_logs
-- ============================================================================

CREATE TABLE IF NOT EXISTS onesignal_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  notification_type text NOT NULL,
  external_id text,
  status text NOT NULL CHECK (status IN ('pending', 'sent', 'failed')),
  response_data jsonb,
  created_at timestamptz DEFAULT now() NOT NULL
);

COMMENT ON TABLE onesignal_logs IS 'OneSignal push notification logs';

ALTER TABLE onesignal_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own OneSignal logs"
  ON onesignal_logs FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Service role can manage OneSignal logs"
  ON onesignal_logs FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications(is_read, user_id) WHERE is_read = false;
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_affiliates_user_id ON affiliates(user_id);
CREATE INDEX IF NOT EXISTS idx_affiliates_code ON affiliates(code);
CREATE INDEX IF NOT EXISTS idx_affiliate_referrals_affiliate_id ON affiliate_referrals(affiliate_id);
CREATE INDEX IF NOT EXISTS idx_affiliate_referrals_referred_user ON affiliate_referrals(referred_user_id);
CREATE INDEX IF NOT EXISTS idx_affiliate_commissions_affiliate_id ON affiliate_commissions(affiliate_id);
CREATE INDEX IF NOT EXISTS idx_access_codes_code ON access_codes(code);
CREATE INDEX IF NOT EXISTS idx_access_codes_is_active ON access_codes(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_code_redemptions_code_id ON code_redemptions(code_id);
CREATE INDEX IF NOT EXISTS idx_code_redemptions_user_id ON code_redemptions(user_id);
CREATE INDEX IF NOT EXISTS idx_onesignal_logs_user_id ON onesignal_logs(user_id);

-- Grants
GRANT ALL ON notifications TO authenticated, service_role;
GRANT ALL ON affiliates TO authenticated;
GRANT ALL ON affiliate_referrals TO authenticated;
GRANT ALL ON affiliate_commissions TO authenticated;
GRANT ALL ON affiliate_settings TO authenticated;
GRANT ALL ON access_codes TO authenticated;
GRANT SELECT ON access_codes TO anon;
GRANT ALL ON code_redemptions TO authenticated;
GRANT ALL ON onesignal_logs TO authenticated, service_role;