/*
  # Relax RLS policies for team member access

  1. Security Changes
    - Simplify booking access policy to allow team members
    - Relax service access for team members
    - Allow team members to access business settings
    - Simplify client access policies
    - Allow team members to access email workflows and templates

  2. Changes Made
    - Updated booking access policy to be more permissive
    - Updated service access policy for team members
    - Updated business settings access policy
    - Updated client access policy
    - Updated email workflow and template policies
*/

-- Drop existing restrictive policies and create more permissive ones

-- Bookings: Allow team members to access owner's bookings
DROP POLICY IF EXISTS "Booking access policy" ON bookings;
CREATE POLICY "Relaxed booking access policy"
  ON bookings
  FOR ALL
  TO authenticated
  USING (
    user_id = auth.uid() OR 
    assigned_user_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM team_members tm 
      WHERE tm.user_id = auth.uid() 
      AND tm.owner_id = bookings.user_id 
      AND tm.is_active = true
    )
  )
  WITH CHECK (
    user_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM team_members tm 
      WHERE tm.user_id = auth.uid() 
      AND tm.owner_id = bookings.user_id 
      AND tm.is_active = true
    )
  );

-- Services: Allow team members to access owner's services
DROP POLICY IF EXISTS "Users and team members can access services" ON services;
CREATE POLICY "Relaxed service access policy"
  ON services
  FOR ALL
  TO authenticated
  USING (
    user_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM team_members tm 
      WHERE tm.user_id = auth.uid() 
      AND tm.owner_id = services.user_id 
      AND tm.is_active = true
    )
  )
  WITH CHECK (
    user_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM team_members tm 
      WHERE tm.user_id = auth.uid() 
      AND tm.owner_id = services.user_id 
      AND tm.is_active = true
    )
  );

-- Business Settings: Allow team members to access owner's settings
DROP POLICY IF EXISTS "Business settings access policy" ON business_settings;
CREATE POLICY "Relaxed business settings access policy"
  ON business_settings
  FOR ALL
  TO authenticated
  USING (
    user_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM team_members tm 
      WHERE tm.user_id = auth.uid() 
      AND tm.owner_id = business_settings.user_id 
      AND tm.is_active = true
    )
  )
  WITH CHECK (
    user_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM team_members tm 
      WHERE tm.user_id = auth.uid() 
      AND tm.owner_id = business_settings.user_id 
      AND tm.is_active = true
    )
  );

-- Clients: Allow team members to access owner's clients
DROP POLICY IF EXISTS "Users can manage own clients" ON clients;
CREATE POLICY "Relaxed client access policy"
  ON clients
  FOR ALL
  TO authenticated
  USING (
    user_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM team_members tm 
      WHERE tm.user_id = auth.uid() 
      AND tm.owner_id = clients.user_id 
      AND tm.is_active = true
    )
  )
  WITH CHECK (
    user_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM team_members tm 
      WHERE tm.user_id = auth.uid() 
      AND tm.owner_id = clients.user_id 
      AND tm.is_active = true
    )
  );

-- Email Workflows: Allow team members to access owner's workflows
DROP POLICY IF EXISTS "Email workflows access policy" ON email_workflows;
CREATE POLICY "Relaxed email workflows access policy"
  ON email_workflows
  FOR ALL
  TO authenticated
  USING (
    user_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM team_members tm 
      WHERE tm.user_id = auth.uid() 
      AND tm.owner_id = email_workflows.user_id 
      AND tm.is_active = true
    )
  )
  WITH CHECK (
    user_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM team_members tm 
      WHERE tm.user_id = auth.uid() 
      AND tm.owner_id = email_workflows.user_id 
      AND tm.is_active = true
    )
  );

-- Email Templates: Allow team members to access owner's templates
DROP POLICY IF EXISTS "Email templates access policy" ON email_templates;
CREATE POLICY "Relaxed email templates access policy"
  ON email_templates
  FOR ALL
  TO authenticated
  USING (
    user_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM team_members tm 
      WHERE tm.user_id = auth.uid() 
      AND tm.owner_id = email_templates.user_id 
      AND tm.is_active = true
    )
  )
  WITH CHECK (
    user_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM team_members tm 
      WHERE tm.user_id = auth.uid() 
      AND tm.owner_id = email_templates.user_id 
      AND tm.is_active = true
    )
  );
