/*
  # Fix email_workflows trigger

  1. Changes
    - Drop obsolete trigger `sync_email_workflows_columns` that references non-existent columns
    - Drop the associated function
*/

-- Drop the trigger
DROP TRIGGER IF EXISTS sync_email_workflows_columns ON email_workflows;

-- Drop the function
DROP FUNCTION IF EXISTS sync_email_workflows_columns();
