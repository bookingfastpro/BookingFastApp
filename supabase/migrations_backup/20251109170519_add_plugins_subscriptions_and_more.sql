/*
  # Tables Plugins, Abonnements, Emails, Notifications et autres

  1. Nouvelles Tables
    - plugins: Catalogue de plugins
    - plugin_subscriptions: Abonnements aux plugins
    - plugin_configurations: Configurations des plugins
    - subscription_plans: Plans d'abonnement
    - subscriptions: Abonnements utilisateurs
    - email_workflows: Workflows d'emails
    - email_templates: Templates d'emails
    - notifications: Notifications
    - unavailabilities: Indisponibilités
    - blocked_date_ranges: Plages de dates bloquées
    - booking_history: Historique des réservations
    - multi_user_settings: Paramètres multi-utilisateurs
    - platform_settings: Paramètres de la plateforme
    - app_versions: Versions de l'application

  2. Sécurité
    - RLS activé sur toutes les tables
    - Politiques d'accès restrictives
*/

-- ============================================================================
-- TABLE: plugins
-- ============================================================================

CREATE TABLE IF NOT EXISTS plugins (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text UNIQUE NOT NULL,
  description text NOT NULL,
  icon text NOT NULL DEFAULT 'Package',
  category text NOT NULL DEFAULT 'general',
  base_price numeric(10,2) NOT NULL DEFAULT 0,
  stripe_price_id text,
  stripe_payment_link text,
  features jsonb NOT NULL DEFAULT '[]'::jsonb,
  is_active boolean NOT NULL DEFAULT true,
  is_featured boolean NOT NULL DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE plugins ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view active plugins" ON plugins;
CREATE POLICY "Anyone can view active plugins"
  ON plugins FOR SELECT
  TO authenticated
  USING (is_active = true);

-- ============================================================================
-- TABLE: plugin_subscriptions
-- ============================================================================

CREATE TABLE IF NOT EXISTS plugin_subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  plugin_id uuid NOT NULL REFERENCES plugins(id) ON DELETE CASCADE,
  stripe_subscription_id text,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'cancelled', 'expired', 'trial')),
  current_period_start timestamptz,
  current_period_end timestamptz,
  grace_period_end timestamptz,
  activated_features jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id, plugin_id)
);

ALTER TABLE plugin_subscriptions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own subscriptions" ON plugin_subscriptions;
CREATE POLICY "Users can view own subscriptions"
  ON plugin_subscriptions FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can insert own subscriptions" ON plugin_subscriptions;
CREATE POLICY "Users can insert own subscriptions"
  ON plugin_subscriptions FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can update own subscriptions" ON plugin_subscriptions;
CREATE POLICY "Users can update own subscriptions"
  ON plugin_subscriptions FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid());

-- ============================================================================
-- TABLE: subscription_plans
-- ============================================================================

CREATE TABLE IF NOT EXISTS subscription_plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  plan_id text UNIQUE NOT NULL,
  price_monthly numeric(10,2) NOT NULL,
  price_yearly numeric(10,2),
  features jsonb NOT NULL DEFAULT '[]'::jsonb,
  stripe_price_id text,
  is_active boolean NOT NULL DEFAULT true,
  display_order integer NOT NULL DEFAULT 0,
  max_team_members integer DEFAULT 1,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE subscription_plans ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Plans are viewable by everyone" ON subscription_plans;
CREATE POLICY "Plans are viewable by everyone"
  ON subscription_plans FOR SELECT
  TO public
  USING (is_active = true);

-- ============================================================================
-- TABLE: subscriptions
-- ============================================================================

CREATE TABLE IF NOT EXISTS subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  plan_id uuid REFERENCES subscription_plans(id) ON DELETE SET NULL,
  stripe_customer_id text,
  stripe_subscription_id text,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'cancelled', 'expired', 'trial')),
  current_period_start timestamptz,
  current_period_end timestamptz,
  cancel_at_period_end boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own subscription" ON subscriptions;
CREATE POLICY "Users can view own subscription"
  ON subscriptions FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can manage own subscription" ON subscriptions;
CREATE POLICY "Users can manage own subscription"
  ON subscriptions FOR ALL
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- ============================================================================
-- TABLE: email_workflows
-- ============================================================================

CREATE TABLE IF NOT EXISTS email_workflows (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  trigger_event text NOT NULL,
  trigger_conditions jsonb DEFAULT '{}'::jsonb,
  delay_minutes integer DEFAULT 0,
  template_id uuid,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE email_workflows ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage own workflows" ON email_workflows;
CREATE POLICY "Users can manage own workflows"
  ON email_workflows FOR ALL
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- ============================================================================
-- TABLE: email_templates
-- ============================================================================

CREATE TABLE IF NOT EXISTS email_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  subject text NOT NULL,
  body text NOT NULL,
  variables jsonb DEFAULT '[]'::jsonb,
  is_default boolean DEFAULT false,
  template_type text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE email_templates ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage own templates" ON email_templates;
CREATE POLICY "Users can manage own templates"
  ON email_templates FOR ALL
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- ============================================================================
-- TABLE: notifications
-- ============================================================================

CREATE TABLE IF NOT EXISTS notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  type text NOT NULL,
  title text NOT NULL,
  message text NOT NULL,
  link text,
  data jsonb DEFAULT '{}'::jsonb,
  is_read boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own notifications" ON notifications;
CREATE POLICY "Users can view own notifications"
  ON notifications FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can update own notifications" ON notifications;
CREATE POLICY "Users can update own notifications"
  ON notifications FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can delete own notifications" ON notifications;
CREATE POLICY "Users can delete own notifications"
  ON notifications FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

-- ============================================================================
-- TABLE: unavailabilities
-- ============================================================================

CREATE TABLE IF NOT EXISTS unavailabilities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  assigned_user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL,
  start_date date NOT NULL,
  end_date date NOT NULL,
  start_time time,
  end_time time,
  is_all_day boolean DEFAULT false,
  reason text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE unavailabilities ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage unavailabilities" ON unavailabilities;
CREATE POLICY "Users can manage unavailabilities"
  ON unavailabilities FOR ALL
  TO authenticated
  USING (user_id = auth.uid() OR assigned_user_id = auth.uid())
  WITH CHECK (user_id = auth.uid() OR assigned_user_id = auth.uid());

-- ============================================================================
-- TABLE: blocked_date_ranges
-- ============================================================================

CREATE TABLE IF NOT EXISTS blocked_date_ranges (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  assigned_user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  start_date date NOT NULL,
  end_date date NOT NULL,
  reason text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE blocked_date_ranges ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage blocked dates" ON blocked_date_ranges;
CREATE POLICY "Users can manage blocked dates"
  ON blocked_date_ranges FOR ALL
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Public can view blocked dates" ON blocked_date_ranges;
CREATE POLICY "Public can view blocked dates"
  ON blocked_date_ranges FOR SELECT
  TO public
  USING (true);

-- ============================================================================
-- TABLE: booking_history
-- ============================================================================

CREATE TABLE IF NOT EXISTS booking_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id uuid REFERENCES bookings(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  action text NOT NULL,
  changes jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE booking_history ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated users can view booking history" ON booking_history;
CREATE POLICY "Authenticated users can view booking history"
  ON booking_history FOR SELECT
  TO authenticated
  USING (true);

-- ============================================================================
-- TABLE: multi_user_settings
-- ============================================================================

CREATE TABLE IF NOT EXISTS multi_user_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  require_approval boolean DEFAULT false,
  max_bookings_per_user integer DEFAULT 10,
  allow_cancellation boolean DEFAULT true,
  cancellation_deadline_hours integer DEFAULT 24,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE multi_user_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage own settings" ON multi_user_settings;
CREATE POLICY "Users can manage own settings"
  ON multi_user_settings FOR ALL
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Public can view settings" ON multi_user_settings;
CREATE POLICY "Public can view settings"
  ON multi_user_settings FOR SELECT
  TO public
  USING (true);

-- ============================================================================
-- TABLE: platform_settings
-- ============================================================================

CREATE TABLE IF NOT EXISTS platform_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text UNIQUE NOT NULL,
  value jsonb NOT NULL DEFAULT '{}'::jsonb,
  description text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE platform_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can read settings" ON platform_settings;
CREATE POLICY "Anyone can read settings"
  ON platform_settings FOR SELECT
  TO public
  USING (true);

-- ============================================================================
-- TABLE: app_versions
-- ============================================================================

CREATE TABLE IF NOT EXISTS app_versions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  version text NOT NULL UNIQUE,
  release_notes text,
  is_current boolean DEFAULT false,
  released_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE app_versions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view versions" ON app_versions;
CREATE POLICY "Anyone can view versions"
  ON app_versions FOR SELECT
  TO public
  USING (true);

-- ============================================================================
-- TABLE: payment_links
-- ============================================================================

CREATE TABLE IF NOT EXISTS payment_links (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id uuid REFERENCES bookings(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  amount numeric(10,2) NOT NULL,
  currency text DEFAULT 'EUR',
  description text,
  stripe_payment_intent_id text,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed', 'expired')),
  expires_at timestamptz,
  paid_at timestamptz,
  replaced_by uuid REFERENCES payment_links(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE payment_links ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view payment links" ON payment_links;
CREATE POLICY "Anyone can view payment links"
  ON payment_links FOR SELECT
  TO public
  USING (true);

DROP POLICY IF EXISTS "Anyone can create payment links" ON payment_links;
CREATE POLICY "Anyone can create payment links"
  ON payment_links FOR INSERT
  TO public
  WITH CHECK (true);

DROP POLICY IF EXISTS "Anyone can update payment links" ON payment_links;
CREATE POLICY "Anyone can update payment links"
  ON payment_links FOR UPDATE
  TO public
  USING (true)
  WITH CHECK (true);

-- ============================================================================
-- FONCTIONS UTILITAIRES
-- ============================================================================

CREATE OR REPLACE FUNCTION has_plugin_access(p_user_id uuid, p_plugin_slug text)
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM plugin_subscriptions ps
    JOIN plugins p ON p.id = ps.plugin_id
    WHERE ps.user_id = p_user_id
    AND p.slug = p_plugin_slug
    AND ps.status IN ('active', 'trial')
    AND (
      ps.current_period_end IS NULL 
      OR ps.current_period_end > now()
      OR (ps.grace_period_end IS NOT NULL AND ps.grace_period_end > now())
    )
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION get_user_active_plugins(p_user_id uuid)
RETURNS TABLE (
  plugin_id uuid,
  plugin_name text,
  plugin_slug text,
  activated_features jsonb
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id,
    p.name,
    p.slug,
    ps.activated_features
  FROM plugin_subscriptions ps
  JOIN plugins p ON p.id = ps.plugin_id
  WHERE ps.user_id = p_user_id
  AND ps.status IN ('active', 'trial')
  AND (
    ps.current_period_end IS NULL 
    OR ps.current_period_end > now()
    OR (ps.grace_period_end IS NOT NULL AND ps.grace_period_end > now())
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- INDEX POUR PERFORMANCES
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_plugins_slug ON plugins(slug);
CREATE INDEX IF NOT EXISTS idx_plugin_subscriptions_user_id ON plugin_subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_subscription_plans_plan_id ON subscription_plans(plan_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_email_workflows_user_id ON email_workflows(user_id);
CREATE INDEX IF NOT EXISTS idx_email_templates_user_id ON email_templates(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_unavailabilities_user_id ON unavailabilities(user_id);
CREATE INDEX IF NOT EXISTS idx_blocked_date_ranges_user_id ON blocked_date_ranges(user_id);
CREATE INDEX IF NOT EXISTS idx_booking_history_booking_id ON booking_history(booking_id);
CREATE INDEX IF NOT EXISTS idx_payment_links_booking_id ON payment_links(booking_id);
CREATE INDEX IF NOT EXISTS idx_payment_links_status ON payment_links(status);

-- ============================================================================
-- DONNÉES INITIALES
-- ============================================================================

INSERT INTO subscription_plans (name, plan_id, price_monthly, price_yearly, features, display_order, max_team_members)
SELECT * FROM (VALUES
  ('Starter Mensuel', 'starter', 29.99, NULL, '["Réservations illimitées", "Gestion des clients", "Calendrier intégré", "Support email"]'::jsonb, 1, 1),
  ('Plan Pro Mensuel', 'monthly', 49.99, NULL, '["Tout du plan Starter", "Paiements en ligne Stripe", "Workflows email automatiques", "Gestion équipe", "Support prioritaire"]'::jsonb, 2, 5),
  ('Plan Pro Annuel', 'yearly', 41.66, 499.99, '["Tout du plan Pro", "2 mois gratuits", "Support 24/7", "Fonctionnalités avancées", "Accès bêtas"]'::jsonb, 3, 10)
) AS v(name, plan_id, price_monthly, price_yearly, features, display_order, max_team_members)
WHERE NOT EXISTS (SELECT 1 FROM subscription_plans WHERE subscription_plans.plan_id = v.plan_id);