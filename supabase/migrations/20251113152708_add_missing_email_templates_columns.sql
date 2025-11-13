/*
  # Add missing columns to email_templates table
  
  ## Missing Columns
  - description (text) - Description of the template
  - html_content (text) - HTML version of the email content
  - text_content (text) - Plain text version of the email content
  
  ## Note
  The table has 'body' but the code expects 'html_content' and 'text_content'
  We'll add these columns and create triggers to keep them in sync
*/

-- Add description column
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'email_templates' AND column_name = 'description'
  ) THEN
    ALTER TABLE email_templates ADD COLUMN description text;
  END IF;
END $$;

-- Add html_content column
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'email_templates' AND column_name = 'html_content'
  ) THEN
    ALTER TABLE email_templates ADD COLUMN html_content text;
  END IF;
END $$;

-- Add text_content column
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'email_templates' AND column_name = 'text_content'
  ) THEN
    ALTER TABLE email_templates ADD COLUMN text_content text;
  END IF;
END $$;

-- Copy existing body content to html_content
UPDATE email_templates
SET html_content = body
WHERE html_content IS NULL AND body IS NOT NULL;

-- Create trigger to sync body with html_content
DROP TRIGGER IF EXISTS sync_email_template_content ON email_templates;
DROP FUNCTION IF EXISTS sync_email_template_content();

CREATE FUNCTION sync_email_template_content()
RETURNS TRIGGER AS $$
BEGIN
  -- If html_content is provided, also update body for backward compatibility
  IF NEW.html_content IS NOT NULL THEN
    NEW.body := NEW.html_content;
  END IF;
  
  -- If body is provided, also update html_content
  IF NEW.body IS NOT NULL AND NEW.html_content IS NULL THEN
    NEW.html_content := NEW.body;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER sync_email_template_content
  BEFORE INSERT OR UPDATE ON email_templates
  FOR EACH ROW
  EXECUTE FUNCTION sync_email_template_content();

-- Grant permissions
GRANT EXECUTE ON FUNCTION sync_email_template_content() TO authenticated;
