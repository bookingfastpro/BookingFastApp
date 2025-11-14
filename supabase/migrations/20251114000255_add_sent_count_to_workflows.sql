/*
  # Add sent_count column to workflow tables

  1. Changes
    - Add `sent_count` column to `email_workflows` table with default 0
    - Add `sent_count` column to `sms_workflows` table with default 0
*/

-- Add sent_count to email_workflows
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'email_workflows' AND column_name = 'sent_count'
  ) THEN
    ALTER TABLE email_workflows ADD COLUMN sent_count integer DEFAULT 0 NOT NULL;
  END IF;
END $$;

-- Add sent_count to sms_workflows
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'sms_workflows' AND column_name = 'sent_count'
  ) THEN
    ALTER TABLE sms_workflows ADD COLUMN sent_count integer DEFAULT 0 NOT NULL;
  END IF;
END $$;
