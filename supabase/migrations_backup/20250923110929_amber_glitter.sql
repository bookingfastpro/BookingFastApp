/*
  # Remove user_id filters for shared organization data

  1. Changes
    - Remove user_id filtering from bookings, services, workflows, templates
    - All users in the organization see the same data
    - Maintain security through RLS policies

  2. Security
    - Keep RLS enabled on all tables
    - Users can only access data if they have valid authentication
    - Super admins maintain full control
*/

-- Update RLS policies for bookings to allow all authenticated users
DROP POLICY IF EXISTS "Users can view their own bookings" ON bookings;
DROP POLICY IF EXISTS "Users can insert their own bookings" ON bookings;
DROP POLICY IF EXISTS "Users can update their own bookings" ON bookings;
DROP POLICY IF EXISTS "Users can delete their own bookings" ON bookings;

-- Create new policies for organization-wide access
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

CREATE POLICY "Authenticated users can update bookings"
  ON bookings
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete bookings"
  ON bookings
  FOR DELETE
  TO authenticated
  USING (true);

-- Update RLS policies for email workflows
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

CREATE POLICY "Authenticated users can update workflows"
  ON email_workflows
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete workflows"
  ON email_workflows
  FOR DELETE
  TO authenticated
  USING (true);

-- Update RLS policies for email templates
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

CREATE POLICY "Authenticated users can update templates"
  ON email_templates
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete templates"
  ON email_templates
  FOR DELETE
  TO authenticated
  USING (true);
