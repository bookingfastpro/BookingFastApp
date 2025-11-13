/*
  # Migration 06: Subscription System
  
  ## Overview
  User subscription management with Stripe integration
  
  ## Tables Created
  1. **subscription_plans**
     - id, name, description, price_monthly, price_yearly
     - features (JSONB), is_active, max_team_members
     - max_bookings_per_month, stripe_price_id
  
  2. **subscriptions**
     - id, user_id, plan_id, status
     - stripe_subscription_id, stripe_customer_id
     - current_period_start, current_period_end
     - cancel_at_period_end, cancelled_at
  
  3. **stripe_customers**
     - id, user_id, stripe_customer_id, email
  
  4. **stripe_subscriptions**
     - id, user_id, stripe_subscription_id, stripe_customer_id
     - plan_id, status, current_period_start, current_period_end
  
  ## Security
  - RLS enabled on all tables
  - Users can view all plans
  - Users can only manage their own subscriptions
*/

-- ============================================================================
-- DROP EXISTING TABLES
-- ============================================================================

DROP TABLE IF EXISTS stripe_subscriptions CASCADE;
DROP TABLE IF EXISTS stripe_customers CASCADE;
DROP TABLE IF EXISTS subscriptions CASCADE;
DROP TABLE IF EXISTS subscription_plans CASCADE;

-- ============================================================================
-- TABLE: subscription_plans
-- ============================================================================

CREATE TABLE IF NOT EXISTS subscription_plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  price_monthly numeric(10,2) DEFAULT 0,
  price_yearly numeric(10,2) DEFAULT 0,
  features jsonb DEFAULT '[]'::jsonb,
  is_active boolean DEFAULT true,
  max_team_members integer DEFAULT 1,
  max_bookings_per_month integer,
  stripe_price_id text,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

COMMENT ON TABLE subscription_plans IS 'Available subscription plans';

ALTER TABLE subscription_plans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Everyone can view active plans"
  ON subscription_plans FOR SELECT
  TO public
  USING (is_active = true);

CREATE POLICY "Authenticated users can view all plans"
  ON subscription_plans FOR SELECT
  TO authenticated
  USING (true);

-- ============================================================================
-- TABLE: subscriptions
-- ============================================================================

CREATE TABLE IF NOT EXISTS subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  plan_id uuid REFERENCES subscription_plans(id) ON DELETE SET NULL,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'cancelled', 'past_due', 'trialing')),
  stripe_subscription_id text,
  stripe_customer_id text,
  current_period_start timestamptz,
  current_period_end timestamptz,
  cancel_at_period_end boolean DEFAULT false,
  cancelled_at timestamptz,
  trial_end timestamptz,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

COMMENT ON TABLE subscriptions IS 'User subscriptions to plans';

ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own subscriptions"
  ON subscriptions FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert their own subscriptions"
  ON subscriptions FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own subscriptions"
  ON subscriptions FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- ============================================================================
-- TABLE: stripe_customers
-- ============================================================================

CREATE TABLE IF NOT EXISTS stripe_customers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  stripe_customer_id text NOT NULL UNIQUE,
  email text NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL,
  UNIQUE(user_id)
);

COMMENT ON TABLE stripe_customers IS 'Stripe customer IDs linked to users';

ALTER TABLE stripe_customers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own stripe customer"
  ON stripe_customers FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Service role can manage stripe customers"
  ON stripe_customers FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- ============================================================================
-- TABLE: stripe_subscriptions
-- ============================================================================

CREATE TABLE IF NOT EXISTS stripe_subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  stripe_subscription_id text NOT NULL UNIQUE,
  stripe_customer_id text NOT NULL,
  plan_id uuid REFERENCES subscription_plans(id) ON DELETE SET NULL,
  status text NOT NULL CHECK (status IN ('active', 'canceled', 'incomplete', 'incomplete_expired', 'past_due', 'trialing', 'unpaid')),
  current_period_start timestamptz NOT NULL,
  current_period_end timestamptz NOT NULL,
  cancel_at_period_end boolean DEFAULT false,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

COMMENT ON TABLE stripe_subscriptions IS 'Stripe subscription details';

ALTER TABLE stripe_subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own stripe subscriptions"
  ON stripe_subscriptions FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Service role can manage stripe subscriptions"
  ON stripe_subscriptions FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_subscription_plans_is_active ON subscription_plans(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_plan_id ON subscriptions(plan_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_subscriptions_stripe_id ON subscriptions(stripe_subscription_id) WHERE stripe_subscription_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_stripe_customers_user_id ON stripe_customers(user_id);
CREATE INDEX IF NOT EXISTS idx_stripe_customers_stripe_id ON stripe_customers(stripe_customer_id);
CREATE INDEX IF NOT EXISTS idx_stripe_subscriptions_user_id ON stripe_subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_stripe_subscriptions_stripe_id ON stripe_subscriptions(stripe_subscription_id);

-- Grants
GRANT ALL ON subscription_plans TO authenticated;
GRANT SELECT ON subscription_plans TO anon;
GRANT ALL ON subscriptions TO authenticated;
GRANT ALL ON stripe_customers TO authenticated, service_role;
GRANT ALL ON stripe_subscriptions TO authenticated, service_role;