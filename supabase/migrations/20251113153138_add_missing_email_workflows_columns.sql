/*
  # Add missing columns to email_workflows table
  
  ## Column Mapping
  - description (text) - Description of the workflow (NEW)
  - trigger (text) - Alias for trigger_event
  - delay (integer) - Alias for delay_minutes
  - active (boolean) - Alias for is_active
  - conditions (jsonb) - Workflow conditions (NEW)
  
  ## Changes
  - Add description column
  - Add trigger, delay, active as aliases via views or sync
  - Add conditions column
*/

-- Add description column
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'email_workflows' AND column_name = 'description'
  ) THEN
    ALTER TABLE email_workflows ADD COLUMN description text;
  END IF;
END $$;

-- Add trigger column (alias for trigger_event)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'email_workflows' AND column_name = 'trigger'
  ) THEN
    ALTER TABLE email_workflows ADD COLUMN trigger text;
  END IF;
END $$;

-- Add delay column (alias for delay_minutes)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'email_workflows' AND column_name = 'delay'
  ) THEN
    ALTER TABLE email_workflows ADD COLUMN delay integer;
  END IF;
END $$;

-- Add active column (alias for is_active)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'email_workflows' AND column_name = 'active'
  ) THEN
    ALTER TABLE email_workflows ADD COLUMN active boolean DEFAULT true;
  END IF;
END $$;

-- Add conditions column
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'email_workflows' AND column_name = 'conditions'
  ) THEN
    ALTER TABLE email_workflows ADD COLUMN conditions jsonb;
  END IF;
END $$;

-- Sync existing data
UPDATE email_workflows
SET 
  trigger = trigger_event,
  delay = delay_minutes,
  active = is_active
WHERE trigger IS NULL OR delay IS NULL OR active IS NULL;

-- Create trigger to sync columns
DROP TRIGGER IF EXISTS sync_email_workflows_columns ON email_workflows;
DROP FUNCTION IF EXISTS sync_email_workflows_columns();

CREATE FUNCTION sync_email_workflows_columns()
RETURNS TRIGGER AS $$
BEGIN
  -- Sync trigger with trigger_event
  IF NEW.trigger IS NOT NULL THEN
    NEW.trigger_event := NEW.trigger;
  END IF;
  IF NEW.trigger_event IS NOT NULL AND NEW.trigger IS NULL THEN
    NEW.trigger := NEW.trigger_event;
  END IF;
  
  -- Sync delay with delay_minutes
  IF NEW.delay IS NOT NULL THEN
    NEW.delay_minutes := NEW.delay;
  END IF;
  IF NEW.delay_minutes IS NOT NULL AND NEW.delay IS NULL THEN
    NEW.delay := NEW.delay_minutes;
  END IF;
  
  -- Sync active with is_active
  IF NEW.active IS NOT NULL THEN
    NEW.is_active := NEW.active;
  END IF;
  IF NEW.is_active IS NOT NULL AND NEW.active IS NULL THEN
    NEW.active := NEW.is_active;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER sync_email_workflows_columns
  BEFORE INSERT OR UPDATE ON email_workflows
  FOR EACH ROW
  EXECUTE FUNCTION sync_email_workflows_columns();

-- Grant permissions
GRANT EXECUTE ON FUNCTION sync_email_workflows_columns() TO authenticated;
