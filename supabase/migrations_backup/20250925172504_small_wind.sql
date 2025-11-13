/*
  # Reconstruction complète du système de sous-comptes

  1. Suppression des anciennes tables
    - Supprime les tables roles, user_roles, account_users existantes
    
  2. Nouvelles tables
    - `team_members` : Membres d'équipe avec permissions directes
    - Stockage simple des permissions par utilisateur
    
  3. Sécurité
    - RLS activé sur toutes les tables
    - Politiques pour propriétaires et membres d'équipe
    
  4. Fonctionnalités
    - Invitation d'utilisateurs par email
    - Attribution de permissions directes
    - Assignation de réservations aux membres
*/

-- Supprimer les anciennes tables si elles existent
DROP TABLE IF EXISTS user_roles CASCADE;
DROP TABLE IF EXISTS roles CASCADE;
DROP TABLE IF EXISTS account_users CASCADE;

-- Table des membres d'équipe (remplace account_users)
CREATE TABLE IF NOT EXISTS team_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  email text NOT NULL,
  full_name text,
  role_name text NOT NULL DEFAULT 'employee',
  permissions jsonb NOT NULL DEFAULT '[]'::jsonb,
  is_active boolean NOT NULL DEFAULT true,
  invited_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  invited_at timestamptz NOT NULL DEFAULT now(),
  joined_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  
  -- Contraintes
  UNIQUE(owner_id, user_id),
  UNIQUE(owner_id, email)
);

-- Index pour les performances
CREATE INDEX IF NOT EXISTS idx_team_members_owner_id ON team_members(owner_id);
CREATE INDEX IF NOT EXISTS idx_team_members_user_id ON team_members(user_id);
CREATE INDEX IF NOT EXISTS idx_team_members_email ON team_members(email);
CREATE INDEX IF NOT EXISTS idx_team_members_is_active ON team_members(is_active);

-- RLS pour team_members
ALTER TABLE team_members ENABLE ROW LEVEL SECURITY;

-- Politique pour les propriétaires (peuvent tout gérer)
CREATE POLICY "Owners can manage their team members"
  ON team_members
  FOR ALL
  TO authenticated
  USING (owner_id = auth.uid())
  WITH CHECK (owner_id = auth.uid());

-- Politique pour les membres (peuvent voir leurs propres infos)
CREATE POLICY "Team members can view their own info"
  ON team_members
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Mettre à jour la table bookings pour supporter l'assignation
DO $$
BEGIN
  -- Ajouter la colonne assigned_user_id si elle n'existe pas
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'bookings' AND column_name = 'assigned_user_id'
  ) THEN
    ALTER TABLE bookings ADD COLUMN assigned_user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL;
    CREATE INDEX IF NOT EXISTS idx_bookings_assigned_user_id ON bookings(assigned_user_id);
  END IF;
END $$;

-- Mettre à jour les politiques RLS pour bookings
DROP POLICY IF EXISTS "Users can manage own bookings" ON bookings;

-- Nouvelle politique pour les réservations
CREATE POLICY "Booking access policy"
  ON bookings
  FOR ALL
  TO authenticated
  USING (
    -- Propriétaire du compte peut tout voir
    user_id = auth.uid() 
    OR 
    -- Membre d'équipe peut voir selon ses permissions
    (
      assigned_user_id = auth.uid()
      OR
      EXISTS (
        SELECT 1 FROM team_members tm
        WHERE tm.user_id = auth.uid() 
        AND tm.owner_id = bookings.user_id
        AND tm.is_active = true
        AND (
          tm.permissions ? 'view_all_bookings'
          OR 
          (tm.permissions ? 'edit_own_bookings' AND bookings.assigned_user_id = auth.uid())
        )
      )
    )
  )
  WITH CHECK (
    -- Propriétaire peut tout créer/modifier
    user_id = auth.uid()
    OR
    -- Membre d'équipe peut créer/modifier selon permissions
    EXISTS (
      SELECT 1 FROM team_members tm
      WHERE tm.user_id = auth.uid() 
      AND tm.owner_id = bookings.user_id
      AND tm.is_active = true
      AND (
        tm.permissions ? 'create_booking'
        OR 
        tm.permissions ? 'edit_booking'
        OR
        (tm.permissions ? 'edit_own_bookings' AND bookings.assigned_user_id = auth.uid())
      )
    )
  );

-- Fonction pour mettre à jour updated_at
CREATE OR REPLACE FUNCTION update_team_members_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger pour team_members
DROP TRIGGER IF EXISTS update_team_members_updated_at ON team_members;
CREATE TRIGGER update_team_members_updated_at
  BEFORE UPDATE ON team_members
  FOR EACH ROW
  EXECUTE FUNCTION update_team_members_updated_at();

-- Insérer les rôles prédéfinis comme données de référence
INSERT INTO team_members (owner_id, user_id, email, full_name, role_name, permissions, is_active, invited_by, joined_at)
SELECT 
  u.id as owner_id,
  u.id as user_id,
  u.email,
  u.full_name,
  'owner' as role_name,
  '["view_dashboard", "view_revenue", "view_stats", "view_calendar", "create_booking", "edit_booking", "edit_own_bookings", "delete_booking", "view_bookings_list", "view_services", "create_service", "edit_service", "delete_service", "view_clients", "manage_clients", "view_emails", "create_workflow", "edit_workflow", "send_manual_email", "view_admin", "edit_business_settings", "manage_account_users", "view_payments", "create_payment_link", "manage_transactions"]'::jsonb as permissions,
  true as is_active,
  u.id as invited_by,
  now() as joined_at
FROM users u
WHERE NOT EXISTS (
  SELECT 1 FROM team_members tm 
  WHERE tm.owner_id = u.id AND tm.user_id = u.id
)
ON CONFLICT (owner_id, user_id) DO NOTHING;
