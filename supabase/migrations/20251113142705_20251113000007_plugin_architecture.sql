/*
  # Migration 07: Plugin Architecture
  
  ## Overview
  Modular plugin system with subscriptions and permissions
  
  ## Tables Created
  1. **plugins**
     - id, name, description, icon, price_monthly
     - is_active, stripe_price_id, stripe_payment_link
     - features (JSONB), category
  
  2. **plugin_subscriptions**
     - id, user_id, plugin_id, status
     - stripe_subscription_id, current_period_start, current_period_end
     - grace_period_end
  
  3. **team_member_plugin_permissions**
     - id, team_member_id, plugin_id
     - can_access, can_configure
  
  ## Security
  - RLS enabled on all tables
  - Everyone can view active plugins
  - Users can manage their own subscriptions
  - Team owners can manage plugin permissions
*/

-- ============================================================================
-- DROP EXISTING TABLES
-- ============================================================================

DROP TABLE IF EXISTS team_member_plugin_permissions CASCADE;
DROP TABLE IF EXISTS plugin_subscriptions CASCADE;
DROP TABLE IF EXISTS plugins CASCADE;

-- ============================================================================
-- TABLE: plugins
-- ============================================================================

CREATE TABLE IF NOT EXISTS plugins (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  description text,
  icon text,
  price_monthly numeric(10,2) DEFAULT 0,
  is_active boolean DEFAULT true,
  stripe_price_id text,
  stripe_payment_link text,
  features jsonb DEFAULT '[]'::jsonb,
  category text,
  display_order integer DEFAULT 0,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

COMMENT ON TABLE plugins IS 'Available plugins and extensions';

ALTER TABLE plugins ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Everyone can view active plugins"
  ON plugins FOR SELECT
  TO public
  USING (is_active = true);

CREATE POLICY "Authenticated users can view all plugins"
  ON plugins FOR SELECT
  TO authenticated
  USING (true);

-- ============================================================================
-- TABLE: plugin_subscriptions
-- ============================================================================

CREATE TABLE IF NOT EXISTS plugin_subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  plugin_id uuid NOT NULL REFERENCES plugins(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'cancelled', 'past_due', 'grace_period')),
  stripe_subscription_id text,
  current_period_start timestamptz,
  current_period_end timestamptz,
  grace_period_end timestamptz,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL,
  UNIQUE(user_id, plugin_id)
);

COMMENT ON TABLE plugin_subscriptions IS 'User subscriptions to individual plugins';

ALTER TABLE plugin_subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own plugin subscriptions"
  ON plugin_subscriptions FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can manage their own plugin subscriptions"
  ON plugin_subscriptions FOR ALL
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Service role can manage plugin subscriptions"
  ON plugin_subscriptions FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- ============================================================================
-- TABLE: team_member_plugin_permissions
-- ============================================================================

CREATE TABLE IF NOT EXISTS team_member_plugin_permissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  team_member_id uuid NOT NULL REFERENCES team_members(id) ON DELETE CASCADE,
  plugin_id uuid NOT NULL REFERENCES plugins(id) ON DELETE CASCADE,
  can_access boolean DEFAULT true,
  can_configure boolean DEFAULT false,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL,
  UNIQUE(team_member_id, plugin_id)
);

COMMENT ON TABLE team_member_plugin_permissions IS 'Plugin permissions for team members';

ALTER TABLE team_member_plugin_permissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Team members can view their own permissions"
  ON team_member_plugin_permissions FOR SELECT
  TO authenticated
  USING (
    team_member_id IN (
      SELECT id FROM team_members WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Team owners can manage permissions"
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

-- Indexes
CREATE INDEX IF NOT EXISTS idx_plugins_is_active ON plugins(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_plugins_category ON plugins(category);
CREATE INDEX IF NOT EXISTS idx_plugin_subscriptions_user_id ON plugin_subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_plugin_subscriptions_plugin_id ON plugin_subscriptions(plugin_id);
CREATE INDEX IF NOT EXISTS idx_plugin_subscriptions_status ON plugin_subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_team_member_plugin_permissions_member ON team_member_plugin_permissions(team_member_id);
CREATE INDEX IF NOT EXISTS idx_team_member_plugin_permissions_plugin ON team_member_plugin_permissions(plugin_id);

-- Grants
GRANT ALL ON plugins TO authenticated;
GRANT SELECT ON plugins TO anon;
GRANT ALL ON plugin_subscriptions TO authenticated, service_role;
GRANT ALL ON team_member_plugin_permissions TO authenticated;