/*
  # Fix code_redemptions relationship with users table

  1. Changes
    - Add foreign key constraint between code_redemptions.user_id and users.id
    - This enables Supabase to recognize the relationship for queries with joins

  2. Security
    - Maintains existing RLS policies
    - Ensures data integrity with CASCADE delete
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
