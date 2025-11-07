/*
  # Système complet d'abonnement et codes d'accès

  1. Nouvelles Tables
    - `subscription_plans` - Plans d'abonnement disponibles
    - `user_subscriptions` - Abonnements des utilisateurs
    - Mise à jour de `access_codes` et `code_redemptions`
    
  2. Sécurité
    - Enable RLS sur toutes les tables
    - Policies pour super admins et utilisateurs
    
  3. Fonctions
    - Fonction pour vérifier l'accès utilisateur
    - Triggers pour maintenir la cohérence
*/

-- Table des plans d'abonnement
CREATE TABLE IF NOT EXISTS subscription_plans (
  id text PRIMARY KEY,
  name text NOT NULL,
  description text DEFAULT '',
  price_monthly numeric(10,2) NOT NULL DEFAULT 0,
  price_yearly numeric(10,2) DEFAULT NULL,
  stripe_price_id_monthly text DEFAULT NULL,
  stripe_price_id_yearly text DEFAULT NULL,
  features jsonb DEFAULT '[]'::jsonb,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Table des abonnements utilisateurs
CREATE TABLE IF NOT EXISTS user_subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  plan_id text NOT NULL REFERENCES subscription_plans(id) ON DELETE CASCADE,
  stripe_subscription_id text DEFAULT NULL,
  stripe_customer_id text DEFAULT NULL,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'cancelled', 'past_due', 'unpaid', 'trialing')),
  current_period_start timestamptz DEFAULT NULL,
  current_period_end timestamptz DEFAULT NULL,
  cancel_at_period_end boolean DEFAULT false,
  trial_start timestamptz DEFAULT NULL,
  trial_end timestamptz DEFAULT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id, plan_id)
);

-- Améliorer la table access_codes si elle existe déjà
DO $$
BEGIN
  -- Vérifier si la colonne description existe
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'access_codes' AND column_name = 'description'
  ) THEN
    ALTER TABLE access_codes ADD COLUMN description text DEFAULT NULL;
  END IF;
  
  -- Vérifier si la colonne access_type existe
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'access_codes' AND column_name = 'access_type'
  ) THEN
    ALTER TABLE access_codes ADD COLUMN access_type text NOT NULL DEFAULT 'days' CHECK (access_type IN ('days', 'weeks', 'months', 'lifetime'));
  END IF;
  
  -- Vérifier si la colonne access_duration existe
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'access_codes' AND column_name = 'access_duration'
  ) THEN
    ALTER TABLE access_codes ADD COLUMN access_duration integer DEFAULT NULL;
  END IF;
END $$;

-- Améliorer la table code_redemptions si elle existe déjà
DO $$
BEGIN
  -- Vérifier si la colonne access_granted_until existe
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'code_redemptions' AND column_name = 'access_granted_until'
  ) THEN
    ALTER TABLE code_redemptions ADD COLUMN access_granted_until timestamptz DEFAULT NULL;
  END IF;
END $$;

-- Insérer les plans par défaut
INSERT INTO subscription_plans (id, name, description, price_monthly, price_yearly, features, is_active) VALUES
('monthly', 'Plan Mensuel', 'Accès complet mensuel', 59.99, NULL, '["Réservations illimitées", "Gestion des clients", "Paiements en ligne", "Workflows email", "Support email"]'::jsonb, true),
('yearly', 'Plan Annuel', 'Accès complet annuel avec réduction', 41.67, 499.99, '["Tout du plan mensuel", "2 mois gratuits", "Support prioritaire", "Fonctionnalités avancées", "Accès aux bêtas"]'::jsonb, true)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  price_monthly = EXCLUDED.price_monthly,
  price_yearly = EXCLUDED.price_yearly,
  features = EXCLUDED.features,
  updated_at = now();

-- Enable RLS
ALTER TABLE subscription_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_subscriptions ENABLE ROW LEVEL SECURITY;

-- Policies pour subscription_plans
CREATE POLICY "Anyone can view subscription plans"
  ON subscription_plans
  FOR SELECT
  TO authenticated
  USING (is_active = true);

CREATE POLICY "Super admins can manage subscription plans"
  ON subscription_plans
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() AND users.is_super_admin = true
    )
  );

-- Policies pour user_subscriptions
CREATE POLICY "Users can view their own subscriptions"
  ON user_subscriptions
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Super admins can view all subscriptions"
  ON user_subscriptions
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() AND users.is_super_admin = true
    )
  );

CREATE POLICY "Super admins can manage all subscriptions"
  ON user_subscriptions
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() AND users.is_super_admin = true
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() AND users.is_super_admin = true
    )
  );

-- Fonction pour vérifier l'accès utilisateur
CREATE OR REPLACE FUNCTION check_user_access(user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  user_record users%ROWTYPE;
  active_subscription user_subscriptions%ROWTYPE;
  lifetime_redemption code_redemptions%ROWTYPE;
BEGIN
  -- Récupérer les infos utilisateur
  SELECT * INTO user_record FROM users WHERE id = user_id;
  
  IF NOT FOUND THEN
    RETURN false;
  END IF;
  
  -- Vérifier si l'utilisateur a un code à vie
  SELECT cr.* INTO lifetime_redemption 
  FROM code_redemptions cr
  JOIN access_codes ac ON cr.code_id = ac.id
  WHERE cr.user_id = user_id 
    AND ac.access_type = 'lifetime'
    AND ac.is_active = true
  LIMIT 1;
  
  IF FOUND THEN
    RETURN true;
  END IF;
  
  -- Vérifier si l'utilisateur a un abonnement actif
  SELECT * INTO active_subscription 
  FROM user_subscriptions 
  WHERE user_id = user_id 
    AND status = 'active'
    AND (current_period_end IS NULL OR current_period_end > now())
  LIMIT 1;
  
  IF FOUND THEN
    RETURN true;
  END IF;
  
  -- Vérifier si l'essai gratuit est encore valide
  IF user_record.subscription_status = 'trial' 
     AND user_record.trial_ends_at IS NOT NULL 
     AND user_record.trial_ends_at > now() THEN
    RETURN true;
  END IF;
  
  -- Vérifier si l'utilisateur a un code temporaire valide
  SELECT cr.* INTO lifetime_redemption 
  FROM code_redemptions cr
  JOIN access_codes ac ON cr.code_id = ac.id
  WHERE cr.user_id = user_id 
    AND ac.access_type != 'lifetime'
    AND ac.is_active = true
    AND (cr.access_granted_until IS NULL OR cr.access_granted_until > now())
  LIMIT 1;
  
  IF FOUND THEN
    RETURN true;
  END IF;
  
  RETURN false;
END;
$$;

-- Trigger pour mettre à jour updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers pour les tables
DROP TRIGGER IF EXISTS update_subscription_plans_updated_at ON subscription_plans;
CREATE TRIGGER update_subscription_plans_updated_at
  BEFORE UPDATE ON subscription_plans
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_user_subscriptions_updated_at ON user_subscriptions;
CREATE TRIGGER update_user_subscriptions_updated_at
  BEFORE UPDATE ON user_subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Index pour les performances
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_user_id ON user_subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_status ON user_subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_stripe_id ON user_subscriptions(stripe_subscription_id);
CREATE INDEX IF NOT EXISTS idx_subscription_plans_active ON subscription_plans(is_active);
