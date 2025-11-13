/*
  # Fix Bookings RLS - Remove ALL substring operations
  
  1. Changes
    - Drop ALL existing RLS policies on bookings table
    - Recreate simple policies WITHOUT any time field operations
    - Remove ANY substring, casting, or time manipulation
  
  2. Security
    - Maintain proper access control
    - Simplify policies to avoid PostgreSQL type issues
*/

-- Drop ALL existing policies
DROP POLICY IF EXISTS "Bookings are viewable by everyone" ON bookings;
DROP POLICY IF EXISTS "Anyone can create bookings" ON bookings;
DROP POLICY IF EXISTS "Authenticated users can manage bookings" ON bookings;
DROP POLICY IF EXISTS "Authenticated users can update bookings" ON bookings;
DROP POLICY IF EXISTS "Authenticated users can delete bookings" ON bookings;
DROP POLICY IF EXISTS "Users can view their own bookings" ON bookings;
DROP POLICY IF EXISTS "Users can create bookings" ON bookings;
DROP POLICY IF EXISTS "Users can update their own bookings" ON bookings;
DROP POLICY IF EXISTS "Users can delete their own bookings" ON bookings;
DROP POLICY IF EXISTS "Enable read access for all users" ON bookings;
DROP POLICY IF EXISTS "Enable insert for all users" ON bookings;
DROP POLICY IF EXISTS "Enable update for authenticated users" ON bookings;
DROP POLICY IF EXISTS "Enable delete for authenticated users" ON bookings;
DROP POLICY IF EXISTS "Authenticated users can manage own bookings" ON bookings;
DROP POLICY IF EXISTS "Authenticated users can manage own bookings - SELECT" ON bookings;
DROP POLICY IF EXISTS "Authenticated users can manage own bookings - INSERT" ON bookings;
DROP POLICY IF EXISTS "Authenticated users can manage own bookings - UPDATE" ON bookings;
DROP POLICY IF EXISTS "Authenticated users can manage own bookings - DELETE" ON bookings;

-- Recreate SIMPLE policies without ANY operations on time/date fields
CREATE POLICY "bookings_select_policy"
  ON bookings FOR SELECT
  TO authenticated
  USING (
    user_id = auth.uid() OR 
    EXISTS (
      SELECT 1 FROM team_members 
      WHERE team_members.user_id = auth.uid() 
        AND team_members.owner_id = bookings.user_id 
        AND team_members.is_active = true
    )
  );

CREATE POLICY "bookings_insert_policy"
  ON bookings FOR INSERT
  TO authenticated
  WITH CHECK (
    user_id = auth.uid() OR 
    EXISTS (
      SELECT 1 FROM team_members 
      WHERE team_members.user_id = auth.uid() 
        AND team_members.owner_id = bookings.user_id 
        AND team_members.is_active = true
    )
  );

CREATE POLICY "bookings_update_policy"
  ON bookings FOR UPDATE
  TO authenticated
  USING (
    user_id = auth.uid() OR 
    EXISTS (
      SELECT 1 FROM team_members 
      WHERE team_members.user_id = auth.uid() 
        AND team_members.owner_id = bookings.user_id 
        AND team_members.is_active = true
    )
  )
  WITH CHECK (
    user_id = auth.uid() OR 
    EXISTS (
      SELECT 1 FROM team_members 
      WHERE team_members.user_id = auth.uid() 
        AND team_members.owner_id = bookings.user_id 
        AND team_members.is_active = true
    )
  );

CREATE POLICY "bookings_delete_policy"
  ON bookings FOR DELETE
  TO authenticated
  USING (
    user_id = auth.uid() OR 
    EXISTS (
      SELECT 1 FROM team_members 
      WHERE team_members.user_id = auth.uid() 
        AND team_members.owner_id = bookings.user_id 
        AND team_members.is_active = true
    )
  );

-- Verify no triggers are using substring
DO $$
DECLARE
  trigger_record RECORD;
  function_def TEXT;
BEGIN
  FOR trigger_record IN 
    SELECT 
      t.tgname,
      t.tgrelid::regclass as table_name,
      p.proname as function_name,
      pg_get_functiondef(p.oid) as function_def
    FROM pg_trigger t
    JOIN pg_proc p ON t.tgfoid = p.oid
    WHERE t.tgrelid = 'bookings'::regclass
      AND NOT t.tgisinternal
  LOOP
    function_def := trigger_record.function_def;
    
    IF function_def LIKE '%substring%' THEN
      RAISE WARNING 'FOUND SUBSTRING in trigger % (function %): %', 
        trigger_record.tgname, 
        trigger_record.function_name,
        function_def;
    END IF;
  END LOOP;
END $$;
