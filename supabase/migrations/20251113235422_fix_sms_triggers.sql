/*
  # Fix SMS templates and workflows triggers

  1. Changes
    - Drop obsolete trigger `sync_sms_template_content` that references non-existent `body` column
    - Drop the associated function
*/

-- Drop the trigger on sms_templates
DROP TRIGGER IF EXISTS sync_sms_template_content ON sms_templates;

-- Drop the function
DROP FUNCTION IF EXISTS sync_sms_template_content();
