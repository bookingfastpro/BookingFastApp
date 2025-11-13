/*
  # Add owner_id to team_members table

  1. Changes
    - Add `owner_id` column to `team_members` table
    - This column stores the user who owns the team (for RLS policies)
  
  2. Notes
    - Column is nullable as existing rows may not have this set
    - Will reference the user who created/owns the team
*/

DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'team_members' AND column_name = 'owner_id'
  ) THEN
    ALTER TABLE team_members ADD COLUMN owner_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;
    CREATE INDEX IF NOT EXISTS idx_team_members_owner_id ON team_members(owner_id);
  END IF;
END $$;
