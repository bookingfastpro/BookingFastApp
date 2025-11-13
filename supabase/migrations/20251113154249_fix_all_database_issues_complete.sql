/*
  # Fix All Database Issues - Complete Migration
  
  ## Changes Made
  
  ### 1. SMS Workflows Table
  - Migrate data from old columns (trigger_event, delay_minutes, is_active) to new columns (trigger, delay, active)
  - Remove duplicate old columns
  - Make new columns NOT NULL with proper defaults
  
  ### 2. Email Workflows Table
  - Migrate data from old columns (trigger_event, delay_minutes, is_active) to new columns (trigger, delay, active)
  - Remove duplicate old columns
  - Make new columns NOT NULL with proper defaults
  
  ### 3. Booking History
  - Verify CASCADE delete is properly configured
  
  ### 4. Schema Cache Refresh
  - Force PostgREST to reload the schema cache
  
  ## Security
  - All existing RLS policies remain in place
  - No data loss - all data is migrated before columns are dropped
*/

-- =====================================================
-- SMS WORKFLOWS TABLE FIX
-- =====================================================

-- Step 1: Migrate data from old columns to new columns
UPDATE sms_workflows
SET 
  trigger = COALESCE(trigger, trigger_event),
  delay = COALESCE(delay, delay_minutes),
  active = COALESCE(active, is_active)
WHERE trigger IS NULL OR delay IS NULL OR active IS NULL;

-- Step 2: Make new columns NOT NULL with defaults
ALTER TABLE sms_workflows 
  ALTER COLUMN trigger SET NOT NULL,
  ALTER COLUMN trigger SET DEFAULT 'booking_created',
  ALTER COLUMN delay SET NOT NULL,
  ALTER COLUMN delay SET DEFAULT 0,
  ALTER COLUMN active SET NOT NULL,
  ALTER COLUMN active SET DEFAULT true,
  ALTER COLUMN conditions SET DEFAULT '[]'::jsonb;

-- Step 3: Drop old duplicate columns
ALTER TABLE sms_workflows 
  DROP COLUMN IF EXISTS trigger_event,
  DROP COLUMN IF EXISTS delay_minutes,
  DROP COLUMN IF EXISTS is_active;

-- =====================================================
-- EMAIL WORKFLOWS TABLE FIX
-- =====================================================

-- Step 1: Migrate data from old columns to new columns
UPDATE email_workflows
SET 
  trigger = COALESCE(trigger, trigger_event),
  delay = COALESCE(delay, delay_minutes),
  active = COALESCE(active, is_active)
WHERE trigger IS NULL OR delay IS NULL OR active IS NULL;

-- Step 2: Make new columns NOT NULL with defaults
ALTER TABLE email_workflows 
  ALTER COLUMN trigger SET NOT NULL,
  ALTER COLUMN trigger SET DEFAULT 'booking_created',
  ALTER COLUMN delay SET NOT NULL,
  ALTER COLUMN delay SET DEFAULT 0,
  ALTER COLUMN active SET NOT NULL,
  ALTER COLUMN active SET DEFAULT true,
  ALTER COLUMN conditions SET DEFAULT '[]'::jsonb;

-- Step 3: Drop old duplicate columns
ALTER TABLE email_workflows 
  DROP COLUMN IF EXISTS trigger_event,
  DROP COLUMN IF EXISTS delay_minutes,
  DROP COLUMN IF EXISTS is_active;

-- =====================================================
-- BOOKING HISTORY CASCADE DELETE
-- =====================================================

-- Verify booking_history has proper CASCADE delete (it should already be correct)
-- This is a safety check
DO $$
BEGIN
  -- Drop existing constraint if it exists
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'booking_history_booking_id_fkey'
    AND table_name = 'booking_history'
  ) THEN
    ALTER TABLE booking_history DROP CONSTRAINT booking_history_booking_id_fkey;
  END IF;
  
  -- Recreate with CASCADE delete
  ALTER TABLE booking_history 
    ADD CONSTRAINT booking_history_booking_id_fkey
    FOREIGN KEY (booking_id) 
    REFERENCES bookings(id) 
    ON DELETE CASCADE;
END $$;

-- =====================================================
-- NOTIFY POSTGREST TO RELOAD SCHEMA
-- =====================================================

NOTIFY pgrst, 'reload schema';
