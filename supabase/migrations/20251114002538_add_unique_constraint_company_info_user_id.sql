/*
  # Add unique constraint on user_id for company_info

  1. Changes
    - Add UNIQUE constraint on user_id column to allow upsert operations
    - This ensures one company_info record per user
*/

-- Add unique constraint on user_id if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'company_info_user_id_key'
  ) THEN
    ALTER TABLE company_info 
    ADD CONSTRAINT company_info_user_id_key UNIQUE (user_id);
  END IF;
END $$;

-- Reload schema cache
NOTIFY pgrst, 'reload schema';
