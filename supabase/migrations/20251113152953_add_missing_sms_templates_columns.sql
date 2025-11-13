/*
  # Add missing columns to sms_templates table
  
  ## Missing Columns
  - description (text) - Description of the SMS template
  - content (text) - SMS message content (alias for body)
  
  ## Note
  The table has 'body' but the code expects 'content'
  We'll add the content column and create triggers to keep them in sync
*/

-- Add description column
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'sms_templates' AND column_name = 'description'
  ) THEN
    ALTER TABLE sms_templates ADD COLUMN description text;
  END IF;
END $$;

-- Add content column
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'sms_templates' AND column_name = 'content'
  ) THEN
    ALTER TABLE sms_templates ADD COLUMN content text;
  END IF;
END $$;

-- Copy existing body content to content column
UPDATE sms_templates
SET content = body
WHERE content IS NULL AND body IS NOT NULL;

-- Create trigger to sync body with content
DROP TRIGGER IF EXISTS sync_sms_template_content ON sms_templates;
DROP FUNCTION IF EXISTS sync_sms_template_content();

CREATE FUNCTION sync_sms_template_content()
RETURNS TRIGGER AS $$
BEGIN
  -- If content is provided, also update body for backward compatibility
  IF NEW.content IS NOT NULL THEN
    NEW.body := NEW.content;
  END IF;
  
  -- If body is provided, also update content
  IF NEW.body IS NOT NULL AND NEW.content IS NULL THEN
    NEW.content := NEW.body;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER sync_sms_template_content
  BEFORE INSERT OR UPDATE ON sms_templates
  FOR EACH ROW
  EXECUTE FUNCTION sync_sms_template_content();

-- Grant permissions
GRANT EXECUTE ON FUNCTION sync_sms_template_content() TO authenticated;
