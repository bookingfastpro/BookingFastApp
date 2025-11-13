/*
  # Fix email_templates trigger

  1. Changes
    - Drop obsolete trigger `sync_email_template_content` that references non-existent `body` column
    - Drop the associated function
*/

-- Drop the trigger
DROP TRIGGER IF EXISTS sync_email_template_content ON email_templates;

-- Drop the function
DROP FUNCTION IF EXISTS sync_email_template_content();
