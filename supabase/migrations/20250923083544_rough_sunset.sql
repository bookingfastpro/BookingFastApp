/*
  # Système de rôles et permissions

  1. Nouvelles Tables
    - `roles` - Définition des rôles avec leurs permissions
    - `user_roles` - Association utilisateurs <-> rôles
  
  2. Sécurité
    - Enable RLS sur toutes les tables
    - Politiques pour la gestion des rôles et permissions
    - Fonction pour vérifier les permissions
  
  3. Données par défaut
    - Rôles prédéfinis (Propriétaire, Manager, Employé, etc.)
    - Attribution automatique du rôle par défaut
*/

-- Table des rôles
CREATE TABLE IF NOT EXISTS roles (
  id text PRIMARY KEY,
  name text NOT NULL,
  description text DEFAULT '',
  permissions jsonb DEFAULT '[]'::jsonb,
  is_default boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Table d'association utilisateurs-rôles
CREATE TABLE IF NOT EXISTS user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role_id text NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
  granted_by uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, role_id)
);

-- Activer RLS
ALTER TABLE roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;

-- Fonction pour vérifier les permissions d'un utilisateur
CREATE OR REPLACE FUNCTION user_has_permission(user_id uuid, permission_name text)
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 
    FROM user_roles ur
    JOIN roles r ON ur.role_id = r.id
    WHERE ur.user_id = user_has_permission.user_id
    AND r.permissions ? permission_name
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fonction pour vérifier si un utilisateur peut gérer les utilisateurs
CREATE OR REPLACE FUNCTION can_manage_users()
RETURNS boolean AS $$
BEGIN
  RETURN user_has_permission(auth.uid(), 'manage_users') OR is_super_admin();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Politiques RLS pour roles
CREATE POLICY "Users can read roles"
  ON roles
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can manage roles"
  ON roles
  FOR ALL
  TO authenticated
  USING (can_manage_users())
  WITH CHECK (can_manage_users());

-- Politiques RLS pour user_roles
CREATE POLICY "Users can read their own roles"
  ON user_roles
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid() OR can_manage_users());

CREATE POLICY "Admins can manage user roles"
  ON user_roles
  FOR ALL
  TO authenticated
  USING (can_manage_users())
  WITH CHECK (can_manage_users());

-- Insérer les rôles par défaut
INSERT INTO roles (id, name, description, permissions, is_default) VALUES
(
  'owner',
  'Propriétaire',
  'Accès complet à toutes les fonctionnalités',
  '["view_dashboard", "view_revenue", "view_stats", "view_calendar", "create_booking", "edit_booking", "delete_booking", "view_client_info", "view_services", "create_service", "edit_service", "delete_service", "view_emails", "create_workflow", "edit_workflow", "send_manual_email", "view_admin", "edit_business_settings", "manage_users", "manage_roles", "view_payments", "create_payment_link", "manage_transactions"]'::jsonb,
  false
),
(
  'manager',
  'Manager',
  'Gestion complète sauf administration des utilisateurs',
  '["view_dashboard", "view_revenue", "view_stats", "view_calendar", "create_booking", "edit_booking", "delete_booking", "view_client_info", "view_services", "create_service", "edit_service", "delete_service", "view_emails", "create_workflow", "edit_workflow", "send_manual_email", "view_admin", "edit_business_settings", "view_payments", "create_payment_link", "manage_transactions"]'::jsonb,
  false
),
(
  'employee',
  'Employé',
  'Gestion des réservations et consultation',
  '["view_dashboard", "view_stats", "view_calendar", "create_booking", "edit_booking", "view_client_info", "view_services", "view_payments"]'::jsonb,
  true
),
(
  'receptionist',
  'Réceptionniste',
  'Gestion des réservations et paiements',
  '["view_dashboard", "view_stats", "view_calendar", "create_booking", "edit_booking", "view_client_info", "view_services", "view_payments", "create_payment_link", "manage_transactions"]'::jsonb,
  false
),
(
  'viewer',
  'Consultation',
  'Accès en lecture seule',
  '["view_dashboard", "view_calendar", "view_client_info", "view_services"]'::jsonb,
  false
)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  permissions = EXCLUDED.permissions,
  is_default = EXCLUDED.is_default,
  updated_at = now();

-- Trigger pour assigner automatiquement le rôle par défaut aux nouveaux utilisateurs
CREATE OR REPLACE FUNCTION assign_default_role()
RETURNS trigger AS $$
DECLARE
  default_role_id text;
BEGIN
  -- Trouver le rôle par défaut
  SELECT id INTO default_role_id
  FROM roles
  WHERE is_default = true
  LIMIT 1;
  
  -- Assigner le rôle par défaut si trouvé
  IF default_role_id IS NOT NULL THEN
    INSERT INTO user_roles (user_id, role_id)
    VALUES (NEW.id, default_role_id)
    ON CONFLICT (user_id, role_id) DO NOTHING;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger sur la table users pour assigner le rôle par défaut
DROP TRIGGER IF EXISTS assign_default_role_trigger ON users;
CREATE TRIGGER assign_default_role_trigger
  AFTER INSERT ON users
  FOR EACH ROW
  EXECUTE FUNCTION assign_default_role();

-- Index pour les performances
CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON user_roles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_role_id ON user_roles(role_id);
CREATE INDEX IF NOT EXISTS idx_roles_permissions ON roles USING gin(permissions);
CREATE INDEX IF NOT EXISTS idx_roles_is_default ON roles(is_default);
