/*
  # Création des tables accounts et account_users

  1. Nouvelles Tables
    - `accounts`
      - `id` (uuid, primary key)
      - `name` (text, nom du compte/entreprise)
      - `description` (text, description optionnelle)
      - `owner_id` (uuid, référence vers auth.users)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
    
    - `account_users`
      - `id` (uuid, primary key)
      - `account_id` (uuid, référence vers accounts)
      - `user_id` (uuid, référence vers auth.users)
      - `role` (text, rôle de l'utilisateur)
      - `permissions` (jsonb, permissions personnalisées)
      - `is_active` (boolean, statut actif)
      - `invited_by` (uuid, qui a invité)
      - `joined_at` (timestamp)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Sécurité
    - Enable RLS sur les deux tables
    - Politiques pour permettre aux utilisateurs de gérer leurs comptes
    - Politiques pour permettre aux propriétaires de gérer les utilisateurs de leur compte

  3. Fonctions
    - Fonction pour créer automatiquement un compte lors de l'inscription
    - Trigger pour assigner automatiquement le rôle owner
*/

-- Créer la table accounts
CREATE TABLE IF NOT EXISTS accounts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text DEFAULT '',
  owner_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Créer la table account_users
CREATE TABLE IF NOT EXISTS account_users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id uuid NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role text NOT NULL DEFAULT 'member',
  permissions jsonb NOT NULL DEFAULT '[]'::jsonb,
  is_active boolean NOT NULL DEFAULT true,
  invited_by uuid REFERENCES auth.users(id),
  joined_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(account_id, user_id)
);

-- Activer RLS sur les tables
ALTER TABLE accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE account_users ENABLE ROW LEVEL SECURITY;

-- Politiques RLS pour accounts
CREATE POLICY "Users can view accounts they belong to"
  ON accounts
  FOR SELECT
  TO authenticated
  USING (
    id IN (
      SELECT account_id 
      FROM account_users 
      WHERE user_id = auth.uid() AND is_active = true
    )
  );

CREATE POLICY "Users can update accounts they own"
  ON accounts
  FOR UPDATE
  TO authenticated
  USING (owner_id = auth.uid())
  WITH CHECK (owner_id = auth.uid());

CREATE POLICY "Users can insert their own accounts"
  ON accounts
  FOR INSERT
  TO authenticated
  WITH CHECK (owner_id = auth.uid());

-- Politiques RLS pour account_users
CREATE POLICY "Users can view account_users for their accounts"
  ON account_users
  FOR SELECT
  TO authenticated
  USING (
    account_id IN (
      SELECT account_id 
      FROM account_users 
      WHERE user_id = auth.uid() AND is_active = true
    )
  );

CREATE POLICY "Account owners can manage account users"
  ON account_users
  FOR ALL
  TO authenticated
  USING (
    account_id IN (
      SELECT id 
      FROM accounts 
      WHERE owner_id = auth.uid()
    )
  )
  WITH CHECK (
    account_id IN (
      SELECT id 
      FROM accounts 
      WHERE owner_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert themselves into accounts"
  ON account_users
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- Créer des index pour les performances
CREATE INDEX IF NOT EXISTS idx_accounts_owner_id ON accounts(owner_id);
CREATE INDEX IF NOT EXISTS idx_account_users_account_id ON account_users(account_id);
CREATE INDEX IF NOT EXISTS idx_account_users_user_id ON account_users(user_id);
CREATE INDEX IF NOT EXISTS idx_account_users_role ON account_users(role);
CREATE INDEX IF NOT EXISTS idx_account_users_is_active ON account_users(is_active);

-- Fonction pour créer automatiquement un compte lors de l'inscription
CREATE OR REPLACE FUNCTION create_account_for_new_user()
RETURNS TRIGGER AS $$
DECLARE
  new_account_id uuid;
BEGIN
  -- Créer un compte pour le nouvel utilisateur
  INSERT INTO accounts (name, description, owner_id)
  VALUES (
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'Mon Compte'),
    'Compte principal',
    NEW.id
  )
  RETURNING id INTO new_account_id;

  -- Ajouter l'utilisateur comme propriétaire de son compte
  INSERT INTO account_users (account_id, user_id, role, permissions)
  VALUES (
    new_account_id,
    NEW.id,
    'owner',
    '["view_dashboard", "view_revenue", "view_stats", "view_calendar", "create_booking", "edit_booking", "delete_booking", "view_bookings_list", "view_services", "create_service", "edit_service", "delete_service", "view_clients", "manage_clients", "view_emails", "create_workflow", "edit_workflow", "send_manual_email", "view_admin", "edit_business_settings", "manage_account_users", "view_payments", "create_payment_link", "manage_transactions"]'::jsonb
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Créer le trigger pour les nouveaux utilisateurs
DROP TRIGGER IF EXISTS create_account_trigger ON auth.users;
CREATE TRIGGER create_account_trigger
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION create_account_for_new_user();

-- Migrer les utilisateurs existants qui n'ont pas de compte
DO $$
DECLARE
  user_record RECORD;
  new_account_id uuid;
BEGIN
  FOR user_record IN 
    SELECT id, email, raw_user_meta_data
    FROM auth.users 
    WHERE id NOT IN (SELECT owner_id FROM accounts)
  LOOP
    -- Créer un compte pour l'utilisateur existant
    INSERT INTO accounts (name, description, owner_id)
    VALUES (
      COALESCE(user_record.raw_user_meta_data->>'full_name', user_record.email, 'Mon Compte'),
      'Compte principal',
      user_record.id
    )
    RETURNING id INTO new_account_id;

    -- Ajouter l'utilisateur comme propriétaire de son compte
    INSERT INTO account_users (account_id, user_id, role, permissions)
    VALUES (
      new_account_id,
      user_record.id,
      'owner',
      '["view_dashboard", "view_revenue", "view_stats", "view_calendar", "create_booking", "edit_booking", "delete_booking", "view_bookings_list", "view_services", "create_service", "edit_service", "delete_service", "view_clients", "manage_clients", "view_emails", "create_workflow", "edit_workflow", "send_manual_email", "view_admin", "edit_business_settings", "manage_account_users", "view_payments", "create_payment_link", "manage_transactions"]'::jsonb
    );
  END LOOP;
END $$;
