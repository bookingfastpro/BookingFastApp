/*
  # Create roles and user_roles tables

  1. New Tables
    - `roles`
      - `id` (text, primary key)
      - `name` (text, unique)
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
    - Add policies for authenticated users to manage roles
*/

-- Create roles table
CREATE TABLE IF NOT EXISTS roles (
  id text PRIMARY KEY,
  name text UNIQUE NOT NULL,
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

-- Create policies for roles table
CREATE POLICY "Users can read all roles"
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

-- Create policies for user_roles table
CREATE POLICY "Users can read own roles"
  ON user_roles
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Super admins can manage user roles"
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

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON user_roles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_role_id ON user_roles(role_id);
CREATE INDEX IF NOT EXISTS idx_roles_is_default ON roles(is_default);

-- Insert default roles
INSERT INTO roles (id, name, description, permissions, is_default) VALUES
  ('admin', 'Administrateur', 'Accès complet à toutes les fonctionnalités', 
   '["view_dashboard", "view_calendar", "create_booking", "edit_booking", "delete_booking", "view_services", "create_service", "edit_service", "delete_service", "view_clients", "create_client", "edit_client", "delete_client", "view_emails", "create_email_template", "edit_email_template", "delete_email_template", "create_email_workflow", "edit_email_workflow", "delete_email_workflow", "send_manual_email", "view_admin", "edit_business_settings", "manage_account_users", "view_financial", "manage_transactions", "create_payment_link", "super_admin"]'::jsonb, 
   false),
  ('manager', 'Manager', 'Gestion des réservations et des clients', 
   '["view_dashboard", "view_calendar", "create_booking", "edit_booking", "delete_booking", "view_services", "edit_service", "view_clients", "create_client", "edit_client", "view_emails", "send_manual_email", "view_financial", "manage_transactions", "create_payment_link"]'::jsonb, 
   false),
  ('employee', 'Employé', 'Consultation et gestion basique des réservations', 
   '["view_dashboard", "view_calendar", "create_booking", "edit_booking", "view_services", "view_clients", "create_client"]'::jsonb, 
   true)
ON CONFLICT (id) DO NOTHING;

-- Create trigger for updated_at
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
