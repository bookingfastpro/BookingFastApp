/*
  # Reconstruction complète de la base de données BookingPro

  1. Suppression complète
    - Supprime toutes les tables, vues, fonctions et types existants
    - Nettoyage complet pour repartir à zéro

  2. Nouvelles tables
    - `users` - Profils utilisateurs avec abonnements
    - `services` - Services proposés
    - `clients` - Base de données clients
    - `bookings` - Réservations avec paiements
    - `business_settings` - Paramètres de l'entreprise
    - `email_workflows` - Automatisation email
    - `email_templates` - Templates d'emails

  3. Sécurité
    - RLS activé sur toutes les tables
    - Politiques simples basées sur user_id
    - Pas de récursion ou de jointures complexes

  4. Fonctions utilitaires
    - Triggers pour les timestamps
    - Fonction de calcul des paiements
*/

-- Suppression complète de l'existant
DROP VIEW IF EXISTS user_accessible_accounts CASCADE;
DROP VIEW IF EXISTS stripe_user_subscriptions CASCADE;
DROP VIEW IF EXISTS stripe_user_orders CASCADE;

DROP TABLE IF EXISTS code_redemptions CASCADE;
DROP TABLE IF EXISTS access_codes CASCADE;
DROP TABLE IF EXISTS user_subscriptions CASCADE;
DROP TABLE IF EXISTS subscription_plans CASCADE;
DROP TABLE IF EXISTS stripe_orders CASCADE;
DROP TABLE IF EXISTS stripe_subscriptions CASCADE;
DROP TABLE IF EXISTS stripe_customers CASCADE;
DROP TABLE IF EXISTS email_workflows CASCADE;
DROP TABLE IF EXISTS email_templates CASCADE;
DROP TABLE IF EXISTS business_settings CASCADE;
DROP TABLE IF EXISTS bookings CASCADE;
DROP TABLE IF EXISTS clients CASCADE;
DROP TABLE IF EXISTS services CASCADE;
DROP TABLE IF EXISTS user_roles CASCADE;
DROP TABLE IF EXISTS roles CASCADE;
DROP TABLE IF EXISTS account_users CASCADE;
DROP TABLE IF EXISTS accounts CASCADE;
DROP TABLE IF EXISTS users CASCADE;
DROP TABLE IF EXISTS push_subscriptions CASCADE;

DROP TYPE IF EXISTS stripe_subscription_status CASCADE;
DROP TYPE IF EXISTS stripe_order_status CASCADE;

DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;
DROP FUNCTION IF EXISTS update_payment_amount_from_transactions() CASCADE;
DROP FUNCTION IF EXISTS handle_new_user() CASCADE;
DROP FUNCTION IF EXISTS sync_user_to_users_table() CASCADE;
DROP FUNCTION IF EXISTS assign_owner_role() CASCADE;
DROP FUNCTION IF EXISTS create_account_for_new_user() CASCADE;
DROP FUNCTION IF EXISTS assign_default_role() CASCADE;

-- Fonction pour mettre à jour updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Fonction pour calculer le montant payé depuis les transactions
CREATE OR REPLACE FUNCTION update_payment_amount_from_transactions()
RETURNS TRIGGER AS $$
BEGIN
  -- Calculer le montant total payé depuis les transactions
  IF NEW.transactions IS NOT NULL THEN
    NEW.payment_amount := (
      SELECT COALESCE(SUM((transaction->>'amount')::numeric), 0)
      FROM jsonb_array_elements(NEW.transactions) AS transaction
      WHERE (transaction->>'status')::text IN ('completed', 'success')
    );
  ELSE
    NEW.payment_amount := 0;
  END IF;
  
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Table des utilisateurs (profils)
CREATE TABLE users (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text UNIQUE NOT NULL,
  full_name text,
  is_super_admin boolean DEFAULT false NOT NULL,
  subscription_status text DEFAULT 'trial' NOT NULL CHECK (subscription_status IN ('trial', 'active', 'expired', 'cancelled')),
  trial_started_at timestamptz DEFAULT now(),
  trial_ends_at timestamptz DEFAULT (now() + interval '7 days'),
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

-- Table des services
CREATE TABLE services (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  price_ht numeric(10,2) DEFAULT 0 NOT NULL,
  price_ttc numeric(10,2) DEFAULT 0 NOT NULL,
  image_url text,
  description text DEFAULT '' NOT NULL,
  duration_minutes integer DEFAULT 60 NOT NULL,
  capacity integer DEFAULT 1 NOT NULL,
  availability_hours jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Table des clients
CREATE TABLE clients (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  firstname text NOT NULL,
  lastname text NOT NULL,
  email text NOT NULL,
  phone text NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id, email)
);

-- Table des réservations
CREATE TABLE bookings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  service_id uuid NOT NULL REFERENCES services(id) ON DELETE CASCADE,
  date date NOT NULL,
  time time NOT NULL,
  duration_minutes integer NOT NULL,
  quantity integer DEFAULT 1 NOT NULL,
  client_name text NOT NULL,
  client_firstname text NOT NULL,
  client_email text NOT NULL,
  client_phone text NOT NULL,
  total_amount numeric(10,2) NOT NULL,
  payment_status text DEFAULT 'pending' NOT NULL CHECK (payment_status IN ('pending', 'partial', 'completed')),
  payment_amount numeric(10,2) DEFAULT 0,
  payment_link text,
  transactions jsonb DEFAULT '[]'::jsonb,
  booking_status text DEFAULT 'pending' CHECK (booking_status IN ('pending', 'confirmed', 'cancelled')),
  assigned_user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  custom_service_data jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Table des paramètres business
CREATE TABLE business_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  business_name text DEFAULT 'BookingPro' NOT NULL,
  primary_color text DEFAULT '#3B82F6' NOT NULL,
  secondary_color text DEFAULT '#8B5CF6' NOT NULL,
  logo_url text,
  opening_hours jsonb DEFAULT '{
    "monday": {"ranges": [{"start": "08:00", "end": "18:00"}], "closed": false},
    "tuesday": {"ranges": [{"start": "08:00", "end": "18:00"}], "closed": false},
    "wednesday": {"ranges": [{"start": "08:00", "end": "18:00"}], "closed": false},
    "thursday": {"ranges": [{"start": "08:00", "end": "18:00"}], "closed": false},
    "friday": {"ranges": [{"start": "08:00", "end": "18:00"}], "closed": false},
    "saturday": {"ranges": [{"start": "09:00", "end": "17:00"}], "closed": false},
    "sunday": {"ranges": [{"start": "10:00", "end": "16:00"}], "closed": true}
  }'::jsonb NOT NULL,
  buffer_minutes integer DEFAULT 15 NOT NULL,
  default_deposit_percentage integer DEFAULT 30 NOT NULL,
  email_notifications boolean DEFAULT true NOT NULL,
  brevo_enabled boolean DEFAULT false,
  brevo_api_key text,
  brevo_sender_email text,
  brevo_sender_name text DEFAULT 'BookingPro',
  deposit_type text DEFAULT 'percentage' CHECK (deposit_type IN ('percentage', 'fixed_amount')),
  deposit_fixed_amount numeric(10,2) DEFAULT 20.00,
  timezone text DEFAULT 'Europe/Paris' NOT NULL CHECK (timezone ~ '^[A-Za-z_]+/[A-Za-z_]+$' OR timezone = 'UTC'),
  minimum_booking_delay_hours integer DEFAULT 24,
  enable_user_assignment boolean DEFAULT false,
  payment_link_expiry_minutes integer DEFAULT 30 CHECK (payment_link_expiry_minutes >= 5 AND payment_link_expiry_minutes <= 1440),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Table des templates email
CREATE TABLE email_templates (
  id text PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text DEFAULT '',
  subject text NOT NULL,
  html_content text DEFAULT '',
  text_content text DEFAULT '',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Table des workflows email
CREATE TABLE email_workflows (
  id text PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text DEFAULT '',
  trigger text NOT NULL,
  template_id text NOT NULL REFERENCES email_templates(id),
  delay integer DEFAULT 0,
  active boolean DEFAULT true,
  conditions jsonb DEFAULT '[]'::jsonb,
  sent_count integer DEFAULT 0,
  success_rate integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Activer RLS sur toutes les tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE services ENABLE ROW LEVEL SECURITY;
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE business_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_workflows ENABLE ROW LEVEL SECURITY;

-- Politiques RLS simples basées sur user_id
CREATE POLICY "Users can manage own profile" ON users
  FOR ALL USING (auth.uid() = id);

CREATE POLICY "Users can manage own services" ON services
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own clients" ON clients
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own bookings" ON bookings
  FOR ALL USING (auth.uid() = user_id OR auth.uid() = assigned_user_id);

CREATE POLICY "Users can manage own settings" ON business_settings
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own templates" ON email_templates
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own workflows" ON email_workflows
  FOR ALL USING (auth.uid() = user_id);

-- Triggers pour updated_at
CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_services_updated_at
  BEFORE UPDATE ON services
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_clients_updated_at
  BEFORE UPDATE ON clients
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_bookings_updated_at
  BEFORE UPDATE ON bookings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_business_settings_updated_at
  BEFORE UPDATE ON business_settings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_email_templates_updated_at
  BEFORE UPDATE ON email_templates
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_email_workflows_updated_at
  BEFORE UPDATE ON email_workflows
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Trigger pour calculer payment_amount depuis transactions
CREATE TRIGGER trigger_update_payment_amount
  BEFORE INSERT OR UPDATE OF transactions ON bookings
  FOR EACH ROW EXECUTE FUNCTION update_payment_amount_from_transactions();

-- Index pour les performances
CREATE INDEX idx_services_user_id ON services(user_id);
CREATE INDEX idx_services_name ON services(name);

CREATE INDEX idx_clients_user_id ON clients(user_id);
CREATE INDEX idx_clients_email ON clients(email);
CREATE INDEX idx_clients_name ON clients(firstname, lastname);

CREATE INDEX idx_bookings_user_id ON bookings(user_id);
CREATE INDEX idx_bookings_service_id ON bookings(service_id);
CREATE INDEX idx_bookings_date_time ON bookings(date, time);
CREATE INDEX idx_bookings_assigned_user_id ON bookings(assigned_user_id);
CREATE INDEX idx_bookings_booking_status ON bookings(booking_status);

CREATE INDEX idx_business_settings_user_id ON business_settings(user_id);

CREATE INDEX idx_email_templates_user_id ON email_templates(user_id);
CREATE INDEX idx_email_workflows_user_id ON email_workflows(user_id);
CREATE INDEX idx_email_workflows_trigger ON email_workflows(trigger);
CREATE INDEX idx_email_workflows_active ON email_workflows(active);

-- Fonction pour créer le profil utilisateur automatiquement
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Créer le profil utilisateur
  INSERT INTO public.users (id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', '')
  );
  
  -- Créer les paramètres business par défaut
  INSERT INTO public.business_settings (user_id)
  VALUES (NEW.id);
  
  RETURN NEW;
END;
$$ language 'plpgsql' security definer;

-- Trigger pour créer automatiquement le profil
CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();
