/*
  # Migration 09: Payment Links and Workflow Automation
  
  ## Overview
  Payment links system and email/SMS workflow automation
  
  ## Tables Created
  1. **payment_links**
     - id, user_id, short_code, amount, description
     - status, expires_at, max_uses, current_uses
     - replaced_by_id
  
  2. **email_workflows**
     - id, user_id, name, trigger_event
     - delay_minutes, is_active, template_id
  
  3. **email_templates**
     - id, user_id, name, subject, body
     - variables (JSONB), is_active
  
  4. **sms_workflows**
     - id, user_id, name, trigger_event
     - delay_minutes, is_active, template_id
  
  5. **sms_templates**
     - id, user_id, name, body
     - variables (JSONB), is_active
  
  6. **sms_logs**
     - id, user_id, recipient_phone, message
     - status, sent_at, error_message
  
  ## Security
  - RLS enabled on all tables
  - Public can view payment links
  - Users can manage their own workflows
*/

-- ============================================================================
-- DROP EXISTING TABLES
-- ============================================================================

DROP TABLE IF EXISTS sms_logs CASCADE;
DROP TABLE IF EXISTS sms_templates CASCADE;
DROP TABLE IF EXISTS sms_workflows CASCADE;
DROP TABLE IF EXISTS email_templates CASCADE;
DROP TABLE IF EXISTS email_workflows CASCADE;
DROP TABLE IF EXISTS payment_links CASCADE;

-- ============================================================================
-- TABLE: payment_links
-- ============================================================================

CREATE TABLE IF NOT EXISTS payment_links (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  short_code text UNIQUE NOT NULL,
  amount numeric(10,2) NOT NULL,
  description text NOT NULL,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'expired', 'used', 'cancelled')),
  expires_at timestamptz,
  max_uses integer DEFAULT 1,
  current_uses integer DEFAULT 0,
  replaced_by_id uuid REFERENCES payment_links(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

COMMENT ON TABLE payment_links IS 'Payment links for easy customer payments';

ALTER TABLE payment_links ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Everyone can view active payment links"
  ON payment_links FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Users can manage their own payment links"
  ON payment_links FOR ALL
  TO authenticated
  USING (user_id = auth.uid() OR user_id IS NULL)
  WITH CHECK (user_id = auth.uid() OR user_id IS NULL);

-- Allow service role for webhook updates
CREATE POLICY "Service role can manage payment links"
  ON payment_links FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- ============================================================================
-- TABLE: email_workflows
-- ============================================================================

CREATE TABLE IF NOT EXISTS email_workflows (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  trigger_event text NOT NULL CHECK (trigger_event IN ('booking_created', 'booking_confirmed', 'booking_cancelled', 'booking_reminder', 'payment_received')),
  delay_minutes integer DEFAULT 0,
  is_active boolean DEFAULT true,
  template_id uuid,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

COMMENT ON TABLE email_workflows IS 'Automated email workflows based on events';

ALTER TABLE email_workflows ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own email workflows"
  ON email_workflows FOR ALL
  TO authenticated
  USING (user_id = auth.uid() OR user_id IS NULL)
  WITH CHECK (user_id = auth.uid() OR user_id IS NULL);

-- ============================================================================
-- TABLE: email_templates
-- ============================================================================

CREATE TABLE IF NOT EXISTS email_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  subject text NOT NULL,
  body text NOT NULL,
  variables jsonb DEFAULT '[]'::jsonb,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

COMMENT ON TABLE email_templates IS 'Email templates for workflows';

ALTER TABLE email_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own email templates"
  ON email_templates FOR ALL
  TO authenticated
  USING (user_id = auth.uid() OR user_id IS NULL)
  WITH CHECK (user_id = auth.uid() OR user_id IS NULL);

-- Add FK constraint after both tables exist
ALTER TABLE email_workflows ADD CONSTRAINT fk_email_workflows_template 
  FOREIGN KEY (template_id) REFERENCES email_templates(id) ON DELETE SET NULL;

-- ============================================================================
-- TABLE: sms_workflows
-- ============================================================================

CREATE TABLE IF NOT EXISTS sms_workflows (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  trigger_event text NOT NULL CHECK (trigger_event IN ('booking_created', 'booking_confirmed', 'booking_cancelled', 'booking_reminder', 'payment_received')),
  delay_minutes integer DEFAULT 0,
  is_active boolean DEFAULT true,
  template_id uuid,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

COMMENT ON TABLE sms_workflows IS 'Automated SMS workflows based on events';

ALTER TABLE sms_workflows ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own SMS workflows"
  ON sms_workflows FOR ALL
  TO authenticated
  USING (user_id = auth.uid() OR user_id IS NULL)
  WITH CHECK (user_id = auth.uid() OR user_id IS NULL);

-- ============================================================================
-- TABLE: sms_templates
-- ============================================================================

CREATE TABLE IF NOT EXISTS sms_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  body text NOT NULL,
  variables jsonb DEFAULT '[]'::jsonb,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

COMMENT ON TABLE sms_templates IS 'SMS templates for workflows';

ALTER TABLE sms_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own SMS templates"
  ON sms_templates FOR ALL
  TO authenticated
  USING (user_id = auth.uid() OR user_id IS NULL)
  WITH CHECK (user_id = auth.uid() OR user_id IS NULL);

-- Add FK constraint after both tables exist
ALTER TABLE sms_workflows ADD CONSTRAINT fk_sms_workflows_template 
  FOREIGN KEY (template_id) REFERENCES sms_templates(id) ON DELETE SET NULL;

-- ============================================================================
-- TABLE: sms_logs
-- ============================================================================

CREATE TABLE IF NOT EXISTS sms_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  recipient_phone text NOT NULL,
  message text NOT NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'failed', 'delivered')),
  sent_at timestamptz,
  error_message text,
  created_at timestamptz DEFAULT now() NOT NULL
);

COMMENT ON TABLE sms_logs IS 'SMS delivery logs';

ALTER TABLE sms_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own SMS logs"
  ON sms_logs FOR SELECT
  TO authenticated
  USING (user_id = auth.uid() OR user_id IS NULL);

CREATE POLICY "Service role can manage SMS logs"
  ON sms_logs FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_payment_links_short_code ON payment_links(short_code);
CREATE INDEX IF NOT EXISTS idx_payment_links_status ON payment_links(status);
CREATE INDEX IF NOT EXISTS idx_payment_links_user_id ON payment_links(user_id);
CREATE INDEX IF NOT EXISTS idx_email_workflows_user_id ON email_workflows(user_id);
CREATE INDEX IF NOT EXISTS idx_email_workflows_trigger ON email_workflows(trigger_event) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_email_templates_user_id ON email_templates(user_id);
CREATE INDEX IF NOT EXISTS idx_sms_workflows_user_id ON sms_workflows(user_id);
CREATE INDEX IF NOT EXISTS idx_sms_workflows_trigger ON sms_workflows(trigger_event) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_sms_templates_user_id ON sms_templates(user_id);
CREATE INDEX IF NOT EXISTS idx_sms_logs_user_id ON sms_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_sms_logs_status ON sms_logs(status);

-- Grants
GRANT ALL ON payment_links TO authenticated, service_role;
GRANT SELECT ON payment_links TO anon;
GRANT ALL ON email_workflows TO authenticated;
GRANT ALL ON email_templates TO authenticated;
GRANT ALL ON sms_workflows TO authenticated;
GRANT ALL ON sms_templates TO authenticated;
GRANT ALL ON sms_logs TO authenticated, service_role;