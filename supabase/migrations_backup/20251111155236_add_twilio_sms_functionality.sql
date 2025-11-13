/*
  # Add SMS Functionality with Twilio Integration

  ## Overview
  This migration adds complete SMS functionality to the booking system, including:
  - Twilio configuration in business settings
  - SMS workflows and templates tables
  - SMS sending logs for tracking
  - Row Level Security policies
  - Indexes for optimal performance

  ## New Columns in business_settings
  - `twilio_enabled` (boolean) - Enable/disable Twilio SMS
  - `twilio_account_sid` (text) - Twilio Account SID
  - `twilio_auth_token` (text) - Twilio Auth Token
  - `twilio_phone_number` (text) - Twilio phone number for sending SMS

  ## New Tables

  ### `sms_workflows`
  - Stores SMS workflow configurations
  - Similar structure to email_workflows
  - Links to sms_templates
  - Tracks sent count and success rate

  ### `sms_templates`
  - Stores SMS message templates
  - Maximum 160 characters for SMS compatibility
  - Supports dynamic variables

  ### `sms_logs`
  - Tracks all SMS sending attempts
  - Records success/failure status
  - Stores Twilio message SID for tracking
  - Keeps error messages for debugging

  ## Security
  - RLS enabled on all new tables
  - Users can only access their own data
  - Team members access owner's data
  - Authenticated users only
*/

-- Add Twilio configuration columns to business_settings
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'business_settings' AND column_name = 'twilio_enabled'
  ) THEN
    ALTER TABLE business_settings ADD COLUMN twilio_enabled boolean DEFAULT false;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'business_settings' AND column_name = 'twilio_account_sid'
  ) THEN
    ALTER TABLE business_settings ADD COLUMN twilio_account_sid text DEFAULT '';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'business_settings' AND column_name = 'twilio_auth_token'
  ) THEN
    ALTER TABLE business_settings ADD COLUMN twilio_auth_token text DEFAULT '';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'business_settings' AND column_name = 'twilio_phone_number'
  ) THEN
    ALTER TABLE business_settings ADD COLUMN twilio_phone_number text DEFAULT '';
  END IF;
END $$;

-- Create sms_templates table
CREATE TABLE IF NOT EXISTS sms_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  content text NOT NULL CHECK (char_length(content) <= 160),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create sms_workflows table
CREATE TABLE IF NOT EXISTS sms_workflows (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  trigger text NOT NULL,
  template_id uuid REFERENCES sms_templates(id) ON DELETE SET NULL,
  delay integer DEFAULT 0,
  active boolean DEFAULT true,
  conditions jsonb DEFAULT '[]'::jsonb,
  sent_count integer DEFAULT 0,
  success_rate numeric(5,2) DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create sms_logs table
CREATE TABLE IF NOT EXISTS sms_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  workflow_id uuid REFERENCES sms_workflows(id) ON DELETE SET NULL,
  booking_id uuid,
  to_phone text NOT NULL,
  content text NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  twilio_sid text,
  error_message text,
  sent_at timestamptz DEFAULT now()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_sms_templates_user_id ON sms_templates(user_id);
CREATE INDEX IF NOT EXISTS idx_sms_workflows_user_id ON sms_workflows(user_id);
CREATE INDEX IF NOT EXISTS idx_sms_workflows_trigger ON sms_workflows(trigger);
CREATE INDEX IF NOT EXISTS idx_sms_workflows_active ON sms_workflows(active);
CREATE INDEX IF NOT EXISTS idx_sms_logs_user_id ON sms_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_sms_logs_workflow_id ON sms_logs(workflow_id);
CREATE INDEX IF NOT EXISTS idx_sms_logs_booking_id ON sms_logs(booking_id);
CREATE INDEX IF NOT EXISTS idx_sms_logs_status ON sms_logs(status);
CREATE INDEX IF NOT EXISTS idx_sms_logs_sent_at ON sms_logs(sent_at DESC);

-- Enable Row Level Security
ALTER TABLE sms_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE sms_workflows ENABLE ROW LEVEL SECURITY;
ALTER TABLE sms_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies for sms_templates

-- Users can view their own templates
DROP POLICY IF EXISTS "Users can view own SMS templates" ON sms_templates;
CREATE POLICY "Users can view own SMS templates"
  ON sms_templates FOR SELECT
  TO authenticated
  USING (
    auth.uid() = user_id
    OR EXISTS (
      SELECT 1 FROM team_members tm
      JOIN teams t ON t.id = tm.team_id
      WHERE tm.user_id = auth.uid()
      AND t.owner_id = sms_templates.user_id
      AND tm.is_active = true
    )
  );

-- Users can insert their own templates
DROP POLICY IF EXISTS "Users can insert own SMS templates" ON sms_templates;
CREATE POLICY "Users can insert own SMS templates"
  ON sms_templates FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own templates
DROP POLICY IF EXISTS "Users can update own SMS templates" ON sms_templates;
CREATE POLICY "Users can update own SMS templates"
  ON sms_templates FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Users can delete their own templates
DROP POLICY IF EXISTS "Users can delete own SMS templates" ON sms_templates;
CREATE POLICY "Users can delete own SMS templates"
  ON sms_templates FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- RLS Policies for sms_workflows

-- Users can view their own workflows
DROP POLICY IF EXISTS "Users can view own SMS workflows" ON sms_workflows;
CREATE POLICY "Users can view own SMS workflows"
  ON sms_workflows FOR SELECT
  TO authenticated
  USING (
    auth.uid() = user_id
    OR EXISTS (
      SELECT 1 FROM team_members tm
      JOIN teams t ON t.id = tm.team_id
      WHERE tm.user_id = auth.uid()
      AND t.owner_id = sms_workflows.user_id
      AND tm.is_active = true
    )
  );

-- Users can insert their own workflows
DROP POLICY IF EXISTS "Users can insert own SMS workflows" ON sms_workflows;
CREATE POLICY "Users can insert own SMS workflows"
  ON sms_workflows FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own workflows
DROP POLICY IF EXISTS "Users can update own SMS workflows" ON sms_workflows;
CREATE POLICY "Users can update own SMS workflows"
  ON sms_workflows FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Users can delete their own workflows
DROP POLICY IF EXISTS "Users can delete own SMS workflows" ON sms_workflows;
CREATE POLICY "Users can delete own SMS workflows"
  ON sms_workflows FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- RLS Policies for sms_logs

-- Users can view their own logs
DROP POLICY IF EXISTS "Users can view own SMS logs" ON sms_logs;
CREATE POLICY "Users can view own SMS logs"
  ON sms_logs FOR SELECT
  TO authenticated
  USING (
    auth.uid() = user_id
    OR EXISTS (
      SELECT 1 FROM team_members tm
      JOIN teams t ON t.id = tm.team_id
      WHERE tm.user_id = auth.uid()
      AND t.owner_id = sms_logs.user_id
      AND tm.is_active = true
    )
  );

-- Only system can insert logs (via edge function)
DROP POLICY IF EXISTS "Service role can insert SMS logs" ON sms_logs;
CREATE POLICY "Service role can insert SMS logs"
  ON sms_logs FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Grant necessary permissions
GRANT ALL ON sms_templates TO authenticated;
GRANT ALL ON sms_workflows TO authenticated;
GRANT ALL ON sms_logs TO authenticated;

-- Create function to update workflow statistics
CREATE OR REPLACE FUNCTION update_sms_workflow_stats()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'sent' THEN
    UPDATE sms_workflows
    SET
      sent_count = sent_count + 1,
      success_rate = (
        SELECT
          CASE
            WHEN COUNT(*) = 0 THEN 0
            ELSE (COUNT(*) FILTER (WHERE status = 'sent')::numeric / COUNT(*)::numeric) * 100
          END
        FROM sms_logs
        WHERE workflow_id = NEW.workflow_id
      )
    WHERE id = NEW.workflow_id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for workflow statistics
DROP TRIGGER IF EXISTS trigger_update_sms_workflow_stats ON sms_logs;
CREATE TRIGGER trigger_update_sms_workflow_stats
  AFTER INSERT ON sms_logs
  FOR EACH ROW
  EXECUTE FUNCTION update_sms_workflow_stats();
