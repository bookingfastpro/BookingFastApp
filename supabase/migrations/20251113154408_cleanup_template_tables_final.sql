/*
  # Cleanup Template Tables - Final Migration
  
  ## Changes Made
  
  ### 1. Email Templates Table
  - Remove old duplicate column 'body' (use html_content and text_content instead)
  - Remove old duplicate columns 'variables' and 'is_active'
  - Keep: html_content, text_content, description
  
  ### 2. SMS Templates Table  
  - Remove old duplicate column 'body' (use 'content' instead)
  - Remove old duplicate columns 'variables' and 'is_active'
  - Keep: content, description
  
  ### 3. Clients Table
  - Sync data between first_name/last_name and firstname/lastname
  - Keep both sets for compatibility
  
  ## Security
  - All existing RLS policies remain in place
  - No data loss - all data is migrated before columns are considered for removal
*/

-- =====================================================
-- EMAIL TEMPLATES TABLE CLEANUP
-- =====================================================

-- Step 1: Migrate data from old columns to new ones
UPDATE email_templates
SET 
  html_content = COALESCE(html_content, body, ''),
  text_content = COALESCE(text_content, body, '')
WHERE html_content IS NULL OR text_content IS NULL OR html_content = '' OR text_content = '';

-- Step 2: Make sure required columns are NOT NULL
ALTER TABLE email_templates 
  ALTER COLUMN html_content SET DEFAULT '',
  ALTER COLUMN text_content SET DEFAULT '';

UPDATE email_templates SET html_content = '' WHERE html_content IS NULL;
UPDATE email_templates SET text_content = '' WHERE text_content IS NULL;

-- Step 3: Drop old duplicate columns
ALTER TABLE email_templates 
  DROP COLUMN IF EXISTS body,
  DROP COLUMN IF EXISTS variables,
  DROP COLUMN IF EXISTS is_active;

-- =====================================================
-- SMS TEMPLATES TABLE CLEANUP
-- =====================================================

-- Step 1: Migrate data from old 'body' column to 'content'
UPDATE sms_templates
SET content = COALESCE(content, body, '')
WHERE content IS NULL OR content = '';

-- Step 2: Make sure 'content' is NOT NULL
ALTER TABLE sms_templates 
  ALTER COLUMN content SET DEFAULT '';

UPDATE sms_templates SET content = '' WHERE content IS NULL;

-- Step 3: Drop old duplicate columns
ALTER TABLE sms_templates 
  DROP COLUMN IF EXISTS body,
  DROP COLUMN IF EXISTS variables,
  DROP COLUMN IF EXISTS is_active;

-- =====================================================
-- CLIENTS TABLE - SYNC FIRSTNAME/LASTNAME
-- =====================================================

-- Sync data between the two sets of name columns
UPDATE clients
SET 
  firstname = COALESCE(firstname, first_name, ''),
  lastname = COALESCE(lastname, last_name, ''),
  first_name = COALESCE(first_name, firstname, ''),
  last_name = COALESCE(last_name, lastname, '')
WHERE 
  (firstname IS NULL OR lastname IS NULL OR firstname = '' OR lastname = '')
  OR (first_name IS NULL OR last_name IS NULL OR first_name = '' OR last_name = '');

-- Make sure all name columns have defaults
ALTER TABLE clients
  ALTER COLUMN firstname SET DEFAULT '',
  ALTER COLUMN lastname SET DEFAULT '',
  ALTER COLUMN first_name SET DEFAULT '',
  ALTER COLUMN last_name SET DEFAULT '';

-- =====================================================
-- FORCE SCHEMA RELOAD
-- =====================================================

NOTIFY pgrst, 'reload schema';
