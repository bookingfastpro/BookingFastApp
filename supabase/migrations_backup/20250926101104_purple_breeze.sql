/*
  # Fix code_redemptions relationship with users table

  1. Foreign Keys
    - Add foreign key relationship between code_redemptions.user_id and users.id
    - This will allow Supabase to recognize the relationship for joins

  2. Security
    - Maintain existing RLS policies
    - Ensure data integrity with proper constraints
*/

-- Add foreign key constraint if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'code_redemptions_user_id_fkey'
    AND table_name = 'code_redemptions'
  ) THEN
    ALTER TABLE code_redemptions 
    ADD CONSTRAINT code_redemptions_user_id_fkey 
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
  END IF;
END $$;

-- Add index for better performance
CREATE INDEX IF NOT EXISTS idx_code_redemptions_user_id_fkey 
ON code_redemptions(user_id);
