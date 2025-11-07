/*
  # Fix RLS policies for shared organization data

  1. Security Updates
    - Update RLS policies to allow data sharing between authenticated users
    - Remove user_id restrictions for organization-wide data sharing
    - Maintain security while enabling collaboration

  2. Tables Updated
    - `bookings` - Allow all authenticated users to access all bookings
    - `clients` - Shared client database for all users
    - `services` - Shared service catalog
    - `business_settings` - Shared business configuration
    - `email_workflows` - Shared email automation
    - `email_templates` - Shared email templates

  3. Changes Made
    - Replace user-specific policies with organization-wide policies
    - Keep authentication requirement for security
    - Allow full CRUD operations for authenticated users
*/

-- Update bookings policies for shared access
DROP POLICY IF EXISTS "Users can view their own bookings" ON bookings;
DROP POLICY IF EXISTS "Users can insert their own bookings" ON bookings;
DROP POLICY IF EXISTS "Users can update their own bookings" ON bookings;
DROP POLICY IF EXISTS "Users can delete their own bookings" ON bookings;

CREATE POLICY "Authenticated users can view all bookings"
  ON bookings
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert bookings"
  ON bookings
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update all bookings"
  ON bookings
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete all bookings"
  ON bookings
  FOR DELETE
  TO authenticated
  USING (true);

-- Update clients policies for shared access
DROP POLICY IF EXISTS "Insertion publique des clients" ON clients;
DROP POLICY IF EXISTS "Lecture publique des clients" ON clients;
DROP POLICY IF EXISTS "Mise à jour publique des clients" ON clients;
DROP POLICY IF EXISTS "Suppression par les authentifiés" ON clients;

CREATE POLICY "Authenticated users can view all clients"
  ON clients
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert clients"
  ON clients
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update all clients"
  ON clients
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete all clients"
  ON clients
  FOR DELETE
  TO authenticated
  USING (true);

-- Update services policies for shared access
DROP POLICY IF EXISTS "Allow public read services" ON services;
DROP POLICY IF EXISTS "Allow public insert services" ON services;
DROP POLICY IF EXISTS "Allow public update services" ON services;
DROP POLICY IF EXISTS "Allow public delete services" ON services;

CREATE POLICY "Authenticated users can view all services"
  ON services
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert services"
  ON services
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update all services"
  ON services
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete all services"
  ON services
  FOR DELETE
  TO authenticated
  USING (true);

-- Update email_workflows policies for shared access
DROP POLICY IF EXISTS "Users can view their own workflows" ON email_workflows;
DROP POLICY IF EXISTS "Users can insert their own workflows" ON email_workflows;
DROP POLICY IF EXISTS "Users can update their own workflows" ON email_workflows;
DROP POLICY IF EXISTS "Users can delete their own workflows" ON email_workflows;

CREATE POLICY "Authenticated users can view all workflows"
  ON email_workflows
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert workflows"
  ON email_workflows
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update all workflows"
  ON email_workflows
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete all workflows"
  ON email_workflows
  FOR DELETE
  TO authenticated
  USING (true);

-- Update email_templates policies for shared access
DROP POLICY IF EXISTS "Users can view their own templates" ON email_templates;
DROP POLICY IF EXISTS "Users can insert their own templates" ON email_templates;
DROP POLICY IF EXISTS "Users can update their own templates" ON email_templates;
DROP POLICY IF EXISTS "Users can delete their own templates" ON email_templates;

CREATE POLICY "Authenticated users can view all templates"
  ON email_templates
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert templates"
  ON email_templates
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update all templates"
  ON email_templates
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete all templates"
  ON email_templates
  FOR DELETE
  TO authenticated
  USING (true);

-- Update business_settings policies (already shared but ensure consistency)
DROP POLICY IF EXISTS "Lecture publique des paramètres" ON business_settings;
DROP POLICY IF EXISTS "Modification des paramètres" ON business_settings;

CREATE POLICY "Authenticated users can view business settings"
  ON business_settings
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can update business settings"
  ON business_settings
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);
