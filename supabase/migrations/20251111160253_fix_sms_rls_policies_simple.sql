/*
  # Fix SMS RLS Policies - Simplified Version

  This migration fixes the RLS policies for SMS tables by removing the complex team member checks
  and using simpler authentication-based policies.

  ## Changes
  - Recreate RLS policies for sms_templates without team dependencies
  - Recreate RLS policies for sms_workflows without team dependencies
  - Recreate RLS policies for sms_logs without team dependencies
*/

-- Drop existing policies for sms_templates
DROP POLICY IF EXISTS "Users can view own SMS templates" ON sms_templates;
DROP POLICY IF EXISTS "Users can insert own SMS templates" ON sms_templates;
DROP POLICY IF EXISTS "Users can update own SMS templates" ON sms_templates;
DROP POLICY IF EXISTS "Users can delete own SMS templates" ON sms_templates;

-- Create simple policies for sms_templates
CREATE POLICY "Users can view own SMS templates"
  ON sms_templates FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own SMS templates"
  ON sms_templates FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own SMS templates"
  ON sms_templates FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own SMS templates"
  ON sms_templates FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Drop existing policies for sms_workflows
DROP POLICY IF EXISTS "Users can view own SMS workflows" ON sms_workflows;
DROP POLICY IF EXISTS "Users can insert own SMS workflows" ON sms_workflows;
DROP POLICY IF EXISTS "Users can update own SMS workflows" ON sms_workflows;
DROP POLICY IF EXISTS "Users can delete own SMS workflows" ON sms_workflows;

-- Create simple policies for sms_workflows
CREATE POLICY "Users can view own SMS workflows"
  ON sms_workflows FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own SMS workflows"
  ON sms_workflows FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own SMS workflows"
  ON sms_workflows FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own SMS workflows"
  ON sms_workflows FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Drop existing policies for sms_logs
DROP POLICY IF EXISTS "Users can view own SMS logs" ON sms_logs;
DROP POLICY IF EXISTS "Service role can insert SMS logs" ON sms_logs;

-- Create simple policies for sms_logs
CREATE POLICY "Users can view own SMS logs"
  ON sms_logs FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Service role can insert SMS logs"
  ON sms_logs FOR INSERT
  TO authenticated
  WITH CHECK (true);
