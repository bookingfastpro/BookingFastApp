-- ============================================
-- Fix SMS Workflows Missing Columns
-- ============================================
-- Run this SQL in your Supabase Dashboard SQL Editor
-- Dashboard URL: https://supabase.com/dashboard/project/anvbllcskmauqyewizug/editor

-- Add description column
ALTER TABLE sms_workflows ADD COLUMN IF NOT EXISTS description text;

-- Add trigger column (alias for trigger_event)
ALTER TABLE sms_workflows ADD COLUMN IF NOT EXISTS trigger text;

-- Add delay column (alias for delay_minutes)
ALTER TABLE sms_workflows ADD COLUMN IF NOT EXISTS delay integer;

-- Add active column (alias for is_active)
ALTER TABLE sms_workflows ADD COLUMN IF NOT EXISTS active boolean DEFAULT true;

-- Add conditions column
ALTER TABLE sms_workflows ADD COLUMN IF NOT EXISTS conditions jsonb;

-- Sync existing data from old columns to new columns
UPDATE sms_workflows
SET
  trigger = trigger_event,
  delay = delay_minutes,
  active = is_active
WHERE trigger IS NULL OR delay IS NULL OR active IS NULL;

-- Create trigger function to keep columns in sync
CREATE OR REPLACE FUNCTION sync_sms_workflows_columns()
RETURNS TRIGGER AS $$
BEGIN
  -- Sync trigger with trigger_event
  IF NEW.trigger IS NOT NULL THEN
    NEW.trigger_event := NEW.trigger;
  ELSIF NEW.trigger_event IS NOT NULL THEN
    NEW.trigger := NEW.trigger_event;
  END IF;

  -- Sync delay with delay_minutes
  IF NEW.delay IS NOT NULL THEN
    NEW.delay_minutes := NEW.delay;
  ELSIF NEW.delay_minutes IS NOT NULL THEN
    NEW.delay := NEW.delay_minutes;
  END IF;

  -- Sync active with is_active
  IF NEW.active IS NOT NULL THEN
    NEW.is_active := NEW.active;
  ELSIF NEW.is_active IS NOT NULL THEN
    NEW.active := NEW.is_active;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS sync_sms_workflows_columns ON sms_workflows;

-- Create trigger
CREATE TRIGGER sync_sms_workflows_columns
  BEFORE INSERT OR UPDATE ON sms_workflows
  FOR EACH ROW
  EXECUTE FUNCTION sync_sms_workflows_columns();

-- Grant permissions
GRANT EXECUTE ON FUNCTION sync_sms_workflows_columns() TO authenticated;
GRANT EXECUTE ON FUNCTION sync_sms_workflows_columns() TO anon;
GRANT EXECUTE ON FUNCTION sync_sms_workflows_columns() TO service_role;

-- ============================================
-- Fix Booking History Foreign Key Constraint
-- ============================================

-- Drop existing foreign key constraint
ALTER TABLE booking_history
DROP CONSTRAINT IF EXISTS booking_history_booking_id_fkey;

-- Re-add with CASCADE on delete so bookings can be deleted
ALTER TABLE booking_history
ADD CONSTRAINT booking_history_booking_id_fkey
FOREIGN KEY (booking_id)
REFERENCES bookings(id)
ON DELETE CASCADE;

-- Verify the changes
SELECT 'SMS Workflows columns added successfully' as status;
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'sms_workflows'
  AND column_name IN ('description', 'trigger', 'delay', 'active', 'conditions')
ORDER BY column_name;
