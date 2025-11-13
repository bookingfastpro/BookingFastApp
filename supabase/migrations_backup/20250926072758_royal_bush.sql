/*
  # Fix RLS policies for email and settings access by team members

  1. Email Templates
    - Allow team members with 'view_emails' permission to view owner's templates
    - Allow team members with 'create_workflow' or 'edit_workflow' permissions to modify templates

  2. Email Workflows  
    - Allow team members with 'view_emails' permission to view owner's workflows
    - Allow team members with workflow permissions to manage workflows

  3. Business Settings
    - Allow team members with 'view_admin' permission to view owner's settings
    - Allow team members with 'edit_business_settings' permission to modify settings
*/

-- Fix email_templates RLS policy
DROP POLICY IF EXISTS "Users can manage own templates" ON email_templates;

CREATE POLICY "Email templates access policy"
  ON email_templates
  FOR ALL
  TO authenticated
  USING (
    (user_id = auth.uid()) OR 
    (EXISTS (
      SELECT 1 FROM team_members tm 
      WHERE tm.user_id = auth.uid() 
        AND tm.owner_id = email_templates.user_id 
        AND tm.is_active = true 
        AND tm.permissions ? 'view_emails'
    ))
  )
  WITH CHECK (
    (user_id = auth.uid()) OR 
    (EXISTS (
      SELECT 1 FROM team_members tm 
      WHERE tm.user_id = auth.uid() 
        AND tm.owner_id = email_templates.user_id 
        AND tm.is_active = true 
        AND (
          tm.permissions ? 'create_workflow' OR 
          tm.permissions ? 'edit_workflow'
        )
    ))
  );

-- Fix email_workflows RLS policy
DROP POLICY IF EXISTS "Users can manage own workflows" ON email_workflows;

CREATE POLICY "Email workflows access policy"
  ON email_workflows
  FOR ALL
  TO authenticated
  USING (
    (user_id = auth.uid()) OR 
    (EXISTS (
      SELECT 1 FROM team_members tm 
      WHERE tm.user_id = auth.uid() 
        AND tm.owner_id = email_workflows.user_id 
        AND tm.is_active = true 
        AND tm.permissions ? 'view_emails'
    ))
  )
  WITH CHECK (
    (user_id = auth.uid()) OR 
    (EXISTS (
      SELECT 1 FROM team_members tm 
      WHERE tm.user_id = auth.uid() 
        AND tm.owner_id = email_workflows.user_id 
        AND tm.is_active = true 
        AND (
          tm.permissions ? 'create_workflow' OR 
          tm.permissions ? 'edit_workflow'
        )
    ))
  );

-- Fix business_settings RLS policy
DROP POLICY IF EXISTS "Users can manage own settings" ON business_settings;

CREATE POLICY "Business settings access policy"
  ON business_settings
  FOR ALL
  TO public
  USING (
    (user_id = auth.uid()) OR 
    (EXISTS (
      SELECT 1 FROM team_members tm 
      WHERE tm.user_id = auth.uid() 
        AND tm.owner_id = business_settings.user_id 
        AND tm.is_active = true 
        AND tm.permissions ? 'view_admin'
    ))
  )
  WITH CHECK (
    (user_id = auth.uid()) OR 
    (EXISTS (
      SELECT 1 FROM team_members tm 
      WHERE tm.user_id = auth.uid() 
        AND tm.owner_id = business_settings.user_id 
        AND tm.is_active = true 
        AND tm.permissions ? 'edit_business_settings'
    ))
  );
