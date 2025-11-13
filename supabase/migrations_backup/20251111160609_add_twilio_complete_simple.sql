/*
  # Add Twilio SMS Configuration - Complete and Simple

  This migration adds Twilio SMS functionality without complex team dependencies.

  ## New Columns in business_settings
  - `twilio_enabled` (boolean) - Enable/disable Twilio SMS
  - `twilio_account_sid` (text) - Twilio Account SID
  - `twilio_auth_token` (text) - Twilio Auth Token
  - `twilio_phone_number` (text) - Twilio phone number

  ## New Tables
  - `sms_templates` - SMS message templates
  - `sms_workflows` - SMS workflow configurations
  - `sms_logs` - SMS sending history

  ## Security
  - RLS enabled on all tables
  - Simple user-based access control
*/

-- Add Twilio columns to business_settings
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

-- Create sms_templates table if not exists
CREATE TABLE IF NOT EXISTS sms_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  content text NOT NULL CHECK (char_length(content) <= 160),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create sms_workflows table if not exists
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

-- Create sms_logs table if not exists
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

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_sms_templates_user_id ON sms_templates(user_id);
CREATE INDEX IF NOT EXISTS idx_sms_workflows_user_id ON sms_workflows(user_id);
CREATE INDEX IF NOT EXISTS idx_sms_workflows_trigger ON sms_workflows(trigger);
CREATE INDEX IF NOT EXISTS idx_sms_workflows_active ON sms_workflows(active);
CREATE INDEX IF NOT EXISTS idx_sms_logs_user_id ON sms_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_sms_logs_workflow_id ON sms_logs(workflow_id);
CREATE INDEX IF NOT EXISTS idx_sms_logs_booking_id ON sms_logs(booking_id);
CREATE INDEX IF NOT EXISTS idx_sms_logs_status ON sms_logs(status);
CREATE INDEX IF NOT EXISTS idx_sms_logs_sent_at ON sms_logs(sent_at DESC);

-- Enable RLS
ALTER TABLE sms_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE sms_workflows ENABLE ROW LEVEL SECURITY;
ALTER TABLE sms_logs ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any
DROP POLICY IF EXISTS "Users can view own SMS templates" ON sms_templates;
DROP POLICY IF EXISTS "Users can insert own SMS templates" ON sms_templates;
DROP POLICY IF EXISTS "Users can update own SMS templates" ON sms_templates;
DROP POLICY IF EXISTS "Users can delete own SMS templates" ON sms_templates;
DROP POLICY IF EXISTS "Users can view own SMS workflows" ON sms_workflows;
DROP POLICY IF EXISTS "Users can insert own SMS workflows" ON sms_workflows;
DROP POLICY IF EXISTS "Users can update own SMS workflows" ON sms_workflows;
DROP POLICY IF EXISTS "Users can delete own SMS workflows" ON sms_workflows;
DROP POLICY IF EXISTS "Users can view own SMS logs" ON sms_logs;
DROP POLICY IF EXISTS "Service role can insert SMS logs" ON sms_logs;

-- RLS Policies for sms_templates
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

-- RLS Policies for sms_workflows
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

-- RLS Policies for sms_logs
CREATE POLICY "Users can view own SMS logs"
  ON sms_logs FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Service role can insert SMS logs"
  ON sms_logs FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Grant permissions
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

-- Create trigger
DROP TRIGGER IF EXISTS trigger_update_sms_workflow_stats ON sms_logs;
CREATE TRIGGER trigger_update_sms_workflow_stats
  AFTER INSERT ON sms_logs
  FOR EACH ROW
  EXECUTE FUNCTION update_sms_workflow_stats();
