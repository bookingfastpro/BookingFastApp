/*
  # Create roles and permissions system

  1. New Tables
    - `roles`
      - `id` (text, primary key)
      - `name` (text)
      - `description` (text)
      - `permissions` (jsonb array)
      - `is_default` (boolean)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
    - `user_roles`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key to auth.users)
      - `role_id` (text, foreign key to roles)
      - `granted_by` (uuid, foreign key to auth.users)
      - `created_at` (timestamp)

  2. Security
    - Enable RLS on both tables
    - Add policies for authenticated users

  3. Default Data
    - Insert default roles (owner, admin, manager, employee, viewer)
    - Each role has predefined permissions
*/

-- Create roles table
CREATE TABLE IF NOT EXISTS roles (
  id text PRIMARY KEY,
  name text NOT NULL,
  description text DEFAULT '',
  permissions jsonb DEFAULT '[]'::jsonb,
  is_default boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create user_roles table
CREATE TABLE IF NOT EXISTS user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role_id text NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
  granted_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, role_id)
);

-- Enable RLS
ALTER TABLE roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;

-- Create policies for roles
CREATE POLICY "Anyone can view roles"
  ON roles
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Super admins can manage roles"
  ON roles
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.is_super_admin = true
    )
  );

-- Create policies for user_roles
CREATE POLICY "Users can view their own roles"
  ON user_roles
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Super admins can manage all user roles"
  ON user_roles
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.is_super_admin = true
    )
  );

-- Create updated_at trigger for roles
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_roles_updated_at
  BEFORE UPDATE ON roles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Insert default roles
INSERT INTO roles (id, name, description, permissions, is_default) VALUES
(
  'owner',
  'Propriétaire',
  'Accès complet à toutes les fonctionnalités',
  '[
    "view_dashboard", "view_revenue", "view_stats",
    "view_calendar", "create_booking", "edit_booking", "delete_booking", "view_bookings_list", "view_all_bookings",
    "view_services", "create_service", "edit_service", "delete_service",
    "view_clients", "manage_clients",
    "view_emails", "create_workflow", "edit_workflow", "send_manual_email",
    "view_admin", "edit_business_settings", "manage_account_users",
    "view_payments", "create_payment_link", "manage_transactions"
  ]'::jsonb,
  false
),
(
  'admin',
  'Administrateur',
  'Gestion complète sauf gestion des utilisateurs',
  '[
    "view_dashboard", "view_revenue", "view_stats",
    "view_calendar", "create_booking", "edit_booking", "delete_booking", "view_bookings_list", "view_all_bookings",
    "view_services", "create_service", "edit_service", "delete_service",
    "view_clients", "manage_clients",
    "view_emails", "create_workflow", "edit_workflow", "send_manual_email",
    "view_admin", "edit_business_settings",
    "view_payments", "create_payment_link", "manage_transactions"
  ]'::jsonb,
  false
),
(
  'manager',
  'Manager',
  'Gestion des réservations et services',
  '[
    "view_dashboard", "view_revenue", "view_stats",
    "view_calendar", "create_booking", "edit_booking", "delete_booking", "view_bookings_list", "view_all_bookings",
    "view_services", "create_service", "edit_service", "delete_service",
    "view_clients", "manage_clients",
    "view_emails", "create_workflow", "edit_workflow", "send_manual_email",
    "view_admin", "edit_business_settings",
    "view_payments", "create_payment_link", "manage_transactions"
  ]'::jsonb,
  false
),
(
  'employee',
  'Employé',
  'Consultation et gestion limitée des réservations',
  '[
    "view_dashboard", "view_stats",
    "view_calendar", "view_bookings_list", "view_all_bookings",
    "view_services",
    "view_clients",
    "view_payments"
  ]'::jsonb,
  true
),
(
  'viewer',
  'Consultation',
  'Accès en lecture seule',
  '[
    "view_dashboard",
    "view_calendar", "view_bookings_list",
    "view_services",
    "view_clients"
  ]'::jsonb,
  false
)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  permissions = EXCLUDED.permissions,
  is_default = EXCLUDED.is_default,
  updated_at = now();

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON user_roles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_role_id ON user_roles(role_id);
CREATE INDEX IF NOT EXISTS idx_roles_is_default ON roles(is_default);
