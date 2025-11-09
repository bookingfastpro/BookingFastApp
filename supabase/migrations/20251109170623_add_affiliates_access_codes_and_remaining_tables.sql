/*
  # Tables Affiliés, Codes d'Accès et Tables Restantes

  1. Nouvelles Tables
    - affiliates: Affiliés
    - affiliate_settings: Paramètres d'affiliation
    - affiliate_referrals: Parrainages
    - affiliate_commissions: Commissions
    - access_codes: Codes d'accès
    - code_redemptions: Utilisations de codes
    - service_categories: Catégories de services
    - team_member_plugin_permissions: Permissions plugins par membre
    - stripe_customers: Clients Stripe
    - stripe_subscriptions: Abonnements Stripe

  2. Sécurité
    - RLS activé sur toutes les tables
    - Politiques d'accès restrictives
*/

-- ============================================================================
-- TABLE: affiliates
-- ============================================================================

CREATE TABLE IF NOT EXISTS affiliates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  affiliate_code text UNIQUE NOT NULL,
  commission_rate numeric(5,2) NOT NULL DEFAULT 20.00 CHECK (commission_rate >= 0 AND commission_rate <= 100),
  total_referrals integer DEFAULT 0,
  total_revenue numeric(10,2) DEFAULT 0,
  total_commission numeric(10,2) DEFAULT 0,
  payout_email text,
  payout_method text DEFAULT 'stripe',
  status text DEFAULT 'active' CHECK (status IN ('active', 'suspended', 'inactive')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE affiliates ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own affiliate data" ON affiliates;
CREATE POLICY "Users can view own affiliate data"
  ON affiliates FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can update own affiliate data" ON affiliates;
CREATE POLICY "Users can update own affiliate data"
  ON affiliates FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- ============================================================================
-- TABLE: affiliate_settings
-- ============================================================================

CREATE TABLE IF NOT EXISTS affiliate_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text UNIQUE NOT NULL,
  value jsonb NOT NULL DEFAULT '{}'::jsonb,
  description text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE affiliate_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can read affiliate settings" ON affiliate_settings;
CREATE POLICY "Anyone can read affiliate settings"
  ON affiliate_settings FOR SELECT
  TO authenticated
  USING (true);

-- ============================================================================
-- TABLE: affiliate_referrals
-- ============================================================================

CREATE TABLE IF NOT EXISTS affiliate_referrals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  affiliate_id uuid REFERENCES affiliates(id) ON DELETE CASCADE NOT NULL,
  referred_user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  referred_email text NOT NULL,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'converted', 'cancelled')),
  converted_at timestamptz,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE affiliate_referrals ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Affiliates can view own referrals" ON affiliate_referrals;
CREATE POLICY "Affiliates can view own referrals"
  ON affiliate_referrals FOR SELECT
  TO authenticated
  USING (
    affiliate_id IN (
      SELECT id FROM affiliates WHERE user_id = auth.uid()
    )
  );

-- ============================================================================
-- TABLE: affiliate_commissions
-- ============================================================================

CREATE TABLE IF NOT EXISTS affiliate_commissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  affiliate_id uuid REFERENCES affiliates(id) ON DELETE CASCADE NOT NULL,
  referral_id uuid REFERENCES affiliate_referrals(id) ON DELETE SET NULL,
  amount numeric(10,2) NOT NULL,
  commission_rate numeric(5,2) NOT NULL,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'paid', 'cancelled')),
  paid_at timestamptz,
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE affiliate_commissions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Affiliates can view own commissions" ON affiliate_commissions;
CREATE POLICY "Affiliates can view own commissions"
  ON affiliate_commissions FOR SELECT
  TO authenticated
  USING (
    affiliate_id IN (
      SELECT id FROM affiliates WHERE user_id = auth.uid()
    )
  );

-- ============================================================================
-- TABLE: access_codes
-- ============================================================================

CREATE TABLE IF NOT EXISTS access_codes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text UNIQUE NOT NULL,
  plan_id uuid REFERENCES subscription_plans(id) ON DELETE SET NULL,
  max_uses integer,
  current_uses integer DEFAULT 0,
  expires_at timestamptz,
  is_active boolean DEFAULT true,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE access_codes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated users can read access codes" ON access_codes;
CREATE POLICY "Authenticated users can read access codes"
  ON access_codes FOR SELECT
  TO authenticated
  USING (true);

-- ============================================================================
-- TABLE: code_redemptions
-- ============================================================================

CREATE TABLE IF NOT EXISTS code_redemptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code_id uuid REFERENCES access_codes(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  redeemed_at timestamptz DEFAULT now(),
  UNIQUE(code_id, user_id)
);

ALTER TABLE code_redemptions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own redemptions" ON code_redemptions;
CREATE POLICY "Users can view own redemptions"
  ON code_redemptions FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can create redemptions" ON code_redemptions;
CREATE POLICY "Users can create redemptions"
  ON code_redemptions FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- ============================================================================
-- TABLE: service_categories
-- ============================================================================

CREATE TABLE IF NOT EXISTS service_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  description text,
  color text DEFAULT 'blue',
  icon text DEFAULT 'Folder',
  display_order integer DEFAULT 0,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE service_categories ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage own categories" ON service_categories;
CREATE POLICY "Users can manage own categories"
  ON service_categories FOR ALL
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Public can view categories" ON service_categories;
CREATE POLICY "Public can view categories"
  ON service_categories FOR SELECT
  TO public
  USING (true);

-- ============================================================================
-- TABLE: team_member_plugin_permissions
-- ============================================================================

CREATE TABLE IF NOT EXISTS team_member_plugin_permissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  team_member_id uuid REFERENCES team_members(id) ON DELETE CASCADE NOT NULL,
  plugin_id uuid REFERENCES plugins(id) ON DELETE CASCADE NOT NULL,
  has_access boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(team_member_id, plugin_id)
);

ALTER TABLE team_member_plugin_permissions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Team owners can manage plugin permissions" ON team_member_plugin_permissions;
CREATE POLICY "Team owners can manage plugin permissions"
  ON team_member_plugin_permissions FOR ALL
  TO authenticated
  USING (
    team_member_id IN (
      SELECT tm.id FROM team_members tm
      JOIN teams t ON t.id = tm.team_id
      WHERE t.owner_id = auth.uid()
    )
  )
  WITH CHECK (
    team_member_id IN (
      SELECT tm.id FROM team_members tm
      JOIN teams t ON t.id = tm.team_id
      WHERE t.owner_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Team members can view own permissions" ON team_member_plugin_permissions;
CREATE POLICY "Team members can view own permissions"
  ON team_member_plugin_permissions FOR SELECT
  TO authenticated
  USING (
    team_member_id IN (
      SELECT id FROM team_members WHERE user_id = auth.uid()
    )
  );

-- ============================================================================
-- TABLE: stripe_customers
-- ============================================================================

CREATE TABLE IF NOT EXISTS stripe_customers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  stripe_customer_id text UNIQUE NOT NULL,
  email text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE stripe_customers ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own stripe customer" ON stripe_customers;
CREATE POLICY "Users can view own stripe customer"
  ON stripe_customers FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- ============================================================================
-- TABLE: stripe_subscriptions (pour tracking Stripe)
-- ============================================================================

CREATE TABLE IF NOT EXISTS stripe_subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  stripe_subscription_id text UNIQUE NOT NULL,
  stripe_customer_id text NOT NULL,
  status text NOT NULL,
  current_period_start timestamptz,
  current_period_end timestamptz,
  cancel_at_period_end boolean DEFAULT false,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE stripe_subscriptions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own stripe subscriptions" ON stripe_subscriptions;
CREATE POLICY "Users can view own stripe subscriptions"
  ON stripe_subscriptions FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- ============================================================================
-- TRIGGERS POUR NOTIFICATIONS
-- ============================================================================

CREATE OR REPLACE FUNCTION notify_booking_created()
RETURNS trigger AS $$
BEGIN
  INSERT INTO notifications (user_id, type, title, message, link, data)
  VALUES (
    (SELECT user_id FROM business_settings LIMIT 1),
    'booking_created',
    'Nouvelle réservation',
    'Une nouvelle réservation a été créée pour ' || NEW.client_firstname || ' ' || NEW.client_name,
    '/calendar',
    jsonb_build_object('booking_id', NEW.id)
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_notify_booking_created ON bookings;
CREATE TRIGGER trigger_notify_booking_created
  AFTER INSERT ON bookings
  FOR EACH ROW
  EXECUTE FUNCTION notify_booking_created();

CREATE OR REPLACE FUNCTION notify_booking_updated()
RETURNS trigger AS $$
BEGIN
  IF OLD.payment_status != NEW.payment_status THEN
    INSERT INTO notifications (user_id, type, title, message, link, data)
    VALUES (
      (SELECT user_id FROM business_settings LIMIT 1),
      'booking_payment_updated',
      'Paiement mis à jour',
      'Le statut de paiement pour ' || NEW.client_firstname || ' ' || NEW.client_name || ' a été modifié',
      '/calendar',
      jsonb_build_object('booking_id', NEW.id, 'old_status', OLD.payment_status, 'new_status', NEW.payment_status)
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_notify_booking_updated ON bookings;
CREATE TRIGGER trigger_notify_booking_updated
  AFTER UPDATE ON bookings
  FOR EACH ROW
  EXECUTE FUNCTION notify_booking_updated();

-- ============================================================================
-- INDEX POUR PERFORMANCES
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_affiliates_user_id ON affiliates(user_id);
CREATE INDEX IF NOT EXISTS idx_affiliates_code ON affiliates(affiliate_code);
CREATE INDEX IF NOT EXISTS idx_affiliate_referrals_affiliate_id ON affiliate_referrals(affiliate_id);
CREATE INDEX IF NOT EXISTS idx_affiliate_commissions_affiliate_id ON affiliate_commissions(affiliate_id);
CREATE INDEX IF NOT EXISTS idx_access_codes_code ON access_codes(code);
CREATE INDEX IF NOT EXISTS idx_code_redemptions_user_id ON code_redemptions(user_id);
CREATE INDEX IF NOT EXISTS idx_service_categories_user_id ON service_categories(user_id);
CREATE INDEX IF NOT EXISTS idx_team_member_plugin_permissions_team_member ON team_member_plugin_permissions(team_member_id);
CREATE INDEX IF NOT EXISTS idx_stripe_customers_user_id ON stripe_customers(user_id);
CREATE INDEX IF NOT EXISTS idx_stripe_subscriptions_user_id ON stripe_subscriptions(user_id);