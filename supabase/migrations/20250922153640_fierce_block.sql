/*
  # Système Super Admin avec gestion des utilisateurs et abonnements

  1. Nouvelles Tables
    - `users` - Profils utilisateurs étendus
    - `subscription_plans` - Plans d'abonnement disponibles
    - `user_subscriptions` - Abonnements des utilisateurs
    - `access_codes` - Codes secrets pour accès gratuit
    - `code_redemptions` - Historique des codes utilisés

  2. Sécurité
    - Enable RLS sur toutes les tables
    - Politiques pour super admin et utilisateurs normaux
    - Fonction pour vérifier les droits super admin

  3. Fonctionnalités
    - Essai gratuit de 7 jours
    - Abonnements mensuels et annuels
    - Codes secrets avec durées variables
    - Gestion complète des utilisateurs
*/

-- Table des utilisateurs étendus
CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text UNIQUE NOT NULL,
  full_name text,
  is_super_admin boolean DEFAULT false,
  trial_started_at timestamptz,
  trial_ends_at timestamptz,
  subscription_status text DEFAULT 'trial' CHECK (subscription_status IN ('trial', 'active', 'expired', 'cancelled')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Table des plans d'abonnement
CREATE TABLE IF NOT EXISTS subscription_plans (
  id text PRIMARY KEY,
  name text NOT NULL,
  description text,
  price_monthly numeric(10,2) NOT NULL,
  price_yearly numeric(10,2),
  stripe_price_id_monthly text,
  stripe_price_id_yearly text,
  features jsonb DEFAULT '[]'::jsonb,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Table des abonnements utilisateurs
CREATE TABLE IF NOT EXISTS user_subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  plan_id text NOT NULL REFERENCES subscription_plans(id),
  stripe_subscription_id text UNIQUE,
  status text DEFAULT 'active' CHECK (status IN ('active', 'cancelled', 'past_due', 'unpaid')),
  current_period_start timestamptz,
  current_period_end timestamptz,
  cancel_at_period_end boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Table des codes d'accès secrets
CREATE TABLE IF NOT EXISTS access_codes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text UNIQUE NOT NULL,
  description text,
  access_type text NOT NULL CHECK (access_type IN ('days', 'weeks', 'months', 'lifetime')),
  access_duration integer, -- nombre d'unités (jours, semaines, mois)
  max_uses integer DEFAULT 1,
  current_uses integer DEFAULT 0,
  is_active boolean DEFAULT true,
  created_by uuid REFERENCES users(id),
  expires_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Table des utilisations de codes
CREATE TABLE IF NOT EXISTS code_redemptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code_id uuid NOT NULL REFERENCES access_codes(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  redeemed_at timestamptz DEFAULT now(),
  access_granted_until timestamptz,
  UNIQUE(code_id, user_id)
);

-- Insérer les plans par défaut
INSERT INTO subscription_plans (id, name, description, price_monthly, price_yearly, features) VALUES
('basic', 'Plan Basic', 'Accès complet à BookingPro', 59.99, 499.99, '["Réservations illimitées", "Gestion des clients", "Paiements en ligne", "Support email"]'::jsonb)
ON CONFLICT (id) DO NOTHING;

-- Fonction pour vérifier si un utilisateur est super admin
CREATE OR REPLACE FUNCTION is_super_admin(user_uuid uuid DEFAULT auth.uid())
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM users 
    WHERE id = user_uuid AND is_super_admin = true
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fonction pour vérifier l'accès utilisateur
CREATE OR REPLACE FUNCTION has_valid_access(user_uuid uuid DEFAULT auth.uid())
RETURNS boolean AS $$
DECLARE
  user_record users%ROWTYPE;
  subscription_record user_subscriptions%ROWTYPE;
  code_access_record code_redemptions%ROWTYPE;
BEGIN
  -- Récupérer l'utilisateur
  SELECT * INTO user_record FROM users WHERE id = user_uuid;
  
  IF NOT FOUND THEN
    RETURN false;
  END IF;
  
  -- Super admin a toujours accès
  IF user_record.is_super_admin THEN
    RETURN true;
  END IF;
  
  -- Vérifier l'essai gratuit
  IF user_record.subscription_status = 'trial' AND user_record.trial_ends_at > now() THEN
    RETURN true;
  END IF;
  
  -- Vérifier l'abonnement actif
  SELECT * INTO subscription_record 
  FROM user_subscriptions 
  WHERE user_id = user_uuid 
    AND status = 'active' 
    AND current_period_end > now()
  ORDER BY current_period_end DESC 
  LIMIT 1;
  
  IF FOUND THEN
    RETURN true;
  END IF;
  
  -- Vérifier les codes d'accès
  SELECT * INTO code_access_record
  FROM code_redemptions
  WHERE user_id = user_uuid 
    AND access_granted_until > now()
  ORDER BY access_granted_until DESC
  LIMIT 1;
  
  IF FOUND THEN
    RETURN true;
  END IF;
  
  RETURN false;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fonction pour créer un utilisateur avec essai gratuit
CREATE OR REPLACE FUNCTION create_user_with_trial()
RETURNS trigger AS $$
BEGIN
  INSERT INTO users (id, email, trial_started_at, trial_ends_at, subscription_status)
  VALUES (
    NEW.id,
    NEW.email,
    now(),
    now() + interval '7 days',
    'trial'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger pour créer automatiquement un profil utilisateur
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION create_user_with_trial();

-- Enable RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscription_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE access_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE code_redemptions ENABLE ROW LEVEL SECURITY;

-- Politiques RLS pour users
CREATE POLICY "Users can read own profile" ON users
  FOR SELECT TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON users
  FOR UPDATE TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Super admins can read all users" ON users
  FOR SELECT TO authenticated
  USING (is_super_admin());

CREATE POLICY "Super admins can update all users" ON users
  FOR UPDATE TO authenticated
  USING (is_super_admin());

-- Politiques RLS pour subscription_plans
CREATE POLICY "Anyone can read subscription plans" ON subscription_plans
  FOR SELECT TO authenticated
  USING (is_active = true);

CREATE POLICY "Super admins can manage subscription plans" ON subscription_plans
  FOR ALL TO authenticated
  USING (is_super_admin());

-- Politiques RLS pour user_subscriptions
CREATE POLICY "Users can read own subscriptions" ON user_subscriptions
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Super admins can read all subscriptions" ON user_subscriptions
  FOR SELECT TO authenticated
  USING (is_super_admin());

CREATE POLICY "Super admins can manage all subscriptions" ON user_subscriptions
  FOR ALL TO authenticated
  USING (is_super_admin());

-- Politiques RLS pour access_codes
CREATE POLICY "Super admins can manage access codes" ON access_codes
  FOR ALL TO authenticated
  USING (is_super_admin());

CREATE POLICY "Users can read active codes for redemption" ON access_codes
  FOR SELECT TO authenticated
  USING (is_active = true AND (expires_at IS NULL OR expires_at > now()));

-- Politiques RLS pour code_redemptions
CREATE POLICY "Users can read own redemptions" ON code_redemptions
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own redemptions" ON code_redemptions
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Super admins can read all redemptions" ON code_redemptions
  FOR SELECT TO authenticated
  USING (is_super_admin());

-- Créer le premier super admin (à modifier avec votre email)
-- INSERT INTO users (id, email, is_super_admin, subscription_status) 
-- VALUES (
--   (SELECT id FROM auth.users WHERE email = 'votre-email@example.com' LIMIT 1),
--   'votre-email@example.com',
--   true,
--   'active'
-- ) ON CONFLICT (id) DO UPDATE SET is_super_admin = true;
