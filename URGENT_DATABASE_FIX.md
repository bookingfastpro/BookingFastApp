# URGENT: Database Schema Fixes Required

## Issue
The application cannot create SMS workflows or delete bookings due to missing database columns and a foreign key constraint issue.

## Errors
1. **SMS Workflows**: `Could not find the 'active' column of 'sms_workflows' in the schema cache`
2. **Booking Deletion**: `insert or update on table "booking_history" violates foreign key constraint "booking_history_booking_id_fkey"`

## Solution

### Option 1: Apply SQL via Supabase Dashboard (RECOMMENDED)

1. **Go to Supabase Dashboard:**
   - URL: https://supabase.com/dashboard/project/anvbllcskmauqyewizug/editor

2. **Open SQL Editor:**
   - Click on "SQL Editor" in the left sidebar
   - Click "New Query"

3. **Copy and paste the entire contents of `fix_sms_workflows_and_bookings.sql`**

4. **Run the query** (Click "Run" or press Ctrl+Enter)

5. **Verify success:**
   - You should see "SMS Workflows columns added successfully"
   - The query results will show the 5 new columns added

### Option 2: Quick Fix (Copy-Paste)

If you prefer, copy and paste this SQL directly:

```sql
-- Add missing columns to sms_workflows
ALTER TABLE sms_workflows ADD COLUMN IF NOT EXISTS description text;
ALTER TABLE sms_workflows ADD COLUMN IF NOT EXISTS trigger text;
ALTER TABLE sms_workflows ADD COLUMN IF NOT EXISTS delay integer;
ALTER TABLE sms_workflows ADD COLUMN IF NOT EXISTS active boolean DEFAULT true;
ALTER TABLE sms_workflows ADD COLUMN IF NOT EXISTS conditions jsonb;

-- Sync existing data
UPDATE sms_workflows
SET trigger = trigger_event, delay = delay_minutes, active = is_active
WHERE trigger IS NULL OR delay IS NULL OR active IS NULL;

-- Fix booking deletion issue
ALTER TABLE booking_history DROP CONSTRAINT IF EXISTS booking_history_booking_id_fkey;
ALTER TABLE booking_history ADD CONSTRAINT booking_history_booking_id_fkey
  FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE CASCADE;
```

## What This Fixes

### SMS Workflows Table
- Adds 5 missing columns that the application expects:
  - `description` - Description of the SMS workflow
  - `trigger` - Event that triggers the workflow (synced with `trigger_event`)
  - `delay` - Minutes to wait before sending (synced with `delay_minutes`)
  - `active` - Whether workflow is active (synced with `is_active`)
  - `conditions` - JSON conditions for workflow execution

### Booking History Constraint
- Changes the foreign key relationship to allow bookings to be deleted
- Previously: Bookings could not be deleted if they had history entries
- Now: Deleting a booking automatically deletes its history (CASCADE)

## After Applying

1. Refresh your application
2. Try creating an SMS workflow - it should work
3. Try deleting a booking - it should work without errors

## Technical Details

The application code expects certain column names that differ from the database schema. Rather than changing all the application code, we:
1. Added the expected columns
2. Created database triggers to keep both sets of columns in sync
3. This maintains backward compatibility while fixing the errors

---

**Status**: ❌ NOT APPLIED (requires manual action)
**Priority**: HIGH - Application features are broken without this fix
**Estimated Time**: 2 minutes to apply
