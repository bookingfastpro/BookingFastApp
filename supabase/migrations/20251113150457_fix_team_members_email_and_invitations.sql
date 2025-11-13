/*
  # Fix team_members email column and team_invitations policies
  
  ## Problems
  1. team_members table missing email column
  2. team_invitations policies trying to access auth.users causing permission errors
  
  ## Changes
  1. Add email and full_name columns to team_members
  2. Populate these columns from profiles table
  3. Fix team_invitations policies to use profiles instead of auth.users
  4. Add trigger to keep email/full_name in sync when profiles change
*/

-- ============================================================================
-- STEP 1: Add missing columns to team_members
-- ============================================================================

-- Add email column if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'team_members' AND column_name = 'email'
  ) THEN
    ALTER TABLE team_members ADD COLUMN email text;
  END IF;
END $$;

-- Add full_name column if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'team_members' AND column_name = 'full_name'
  ) THEN
    ALTER TABLE team_members ADD COLUMN full_name text;
  END IF;
END $$;

-- Populate email and full_name from profiles
UPDATE team_members tm
SET 
  email = p.email,
  full_name = p.full_name
FROM profiles p
WHERE tm.user_id = p.id
  AND (tm.email IS NULL OR tm.full_name IS NULL);

-- Create index on email for ordering
CREATE INDEX IF NOT EXISTS idx_team_members_email ON team_members(email);

-- ============================================================================
-- STEP 2: Fix team_invitations policies to avoid auth.users access
-- ============================================================================

-- Drop existing policies that access auth.users
DROP POLICY IF EXISTS "Users can view their own invitations" ON team_invitations;
DROP POLICY IF EXISTS "Users can update their invitation status" ON team_invitations;

-- Create new policies using profiles table instead
CREATE POLICY "Users can view their own invitations"
  ON team_invitations
  FOR SELECT
  TO authenticated
  USING (
    email IN (
      SELECT email FROM profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "Users can update their invitation status"
  ON team_invitations
  FOR UPDATE
  TO authenticated
  USING (
    email IN (
      SELECT email FROM profiles WHERE id = auth.uid()
    )
  )
  WITH CHECK (
    email IN (
      SELECT email FROM profiles WHERE id = auth.uid()
    )
  );

-- ============================================================================
-- STEP 3: Create trigger to sync email/full_name with profiles
-- ============================================================================

-- Drop existing trigger if exists
DROP TRIGGER IF EXISTS sync_team_member_profile ON team_members;
DROP FUNCTION IF EXISTS sync_team_member_profile();

-- Create function to sync profile data
CREATE OR REPLACE FUNCTION sync_team_member_profile()
RETURNS TRIGGER AS $$
BEGIN
  -- Set email and full_name from profiles on INSERT
  IF TG_OP = 'INSERT' THEN
    SELECT email, full_name INTO NEW.email, NEW.full_name
    FROM profiles
    WHERE id = NEW.user_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger
CREATE TRIGGER sync_team_member_profile
  BEFORE INSERT ON team_members
  FOR EACH ROW
  EXECUTE FUNCTION sync_team_member_profile();

-- ============================================================================
-- STEP 4: Create function to update team_members when profile changes
-- ============================================================================

-- Drop existing trigger if exists
DROP TRIGGER IF EXISTS update_team_members_on_profile_change ON profiles;
DROP FUNCTION IF EXISTS update_team_members_on_profile_change();

-- Create function to update team_members when profile email/name changes
CREATE OR REPLACE FUNCTION update_team_members_on_profile_change()
RETURNS TRIGGER AS $$
BEGIN
  -- Update team_members email and full_name when profile changes
  IF NEW.email != OLD.email OR NEW.full_name != OLD.full_name THEN
    UPDATE team_members
    SET 
      email = NEW.email,
      full_name = NEW.full_name
    WHERE user_id = NEW.id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger
CREATE TRIGGER update_team_members_on_profile_change
  AFTER UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_team_members_on_profile_change();

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION sync_team_member_profile() TO authenticated;
GRANT EXECUTE ON FUNCTION update_team_members_on_profile_change() TO authenticated;
