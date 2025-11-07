/*
  # Fix team_member_plugin_permissions table schema

  1. Changes
    - Verify and document actual column structure
    - Ensure correct foreign key relationships
    - Add missing columns if needed

  2. Security
    - Maintain RLS policies
*/

-- First, let's check what columns actually exist
DO $$
DECLARE
  col_record RECORD;
BEGIN
  RAISE NOTICE '=== CURRENT COLUMNS IN team_member_plugin_permissions ===';
  FOR col_record IN 
    SELECT column_name, data_type, is_nullable
    FROM information_schema.columns
    WHERE table_name = 'team_member_plugin_permissions'
    ORDER BY ordinal_position
  LOOP
    RAISE NOTICE 'Column: % | Type: % | Nullable: %', 
      col_record.column_name, 
      col_record.data_type, 
      col_record.is_nullable;
  END LOOP;
END $$;

-- Check foreign key constraints
DO $$
DECLARE
  fk_record RECORD;
BEGIN
  RAISE NOTICE '=== FOREIGN KEY CONSTRAINTS ===';
  FOR fk_record IN
    SELECT
      tc.constraint_name,
      kcu.column_name,
      ccu.table_name AS foreign_table_name,
      ccu.column_name AS foreign_column_name
    FROM information_schema.table_constraints AS tc
    JOIN information_schema.key_column_usage AS kcu
      ON tc.constraint_name = kcu.constraint_name
    JOIN information_schema.constraint_column_usage AS ccu
      ON ccu.constraint_name = tc.constraint_name
    WHERE tc.table_name = 'team_member_plugin_permissions'
      AND tc.constraint_type = 'FOREIGN KEY'
  LOOP
    RAISE NOTICE 'FK: % | Column: % -> %.%',
      fk_record.constraint_name,
      fk_record.column_name,
      fk_record.foreign_table_name,
      fk_record.foreign_column_name;
  END LOOP;
END $$;

-- If the table uses user_id for member, let's verify the structure is correct
DO $$
BEGIN
  -- Check if user_id column exists
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'team_member_plugin_permissions'
    AND column_name = 'user_id'
  ) THEN
    RAISE NOTICE '✅ Column user_id exists - this is the member reference';
  END IF;

  -- Check if member_id column exists
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'team_member_plugin_permissions'
    AND column_name = 'member_id'
  ) THEN
    RAISE NOTICE '✅ Column member_id exists';
  END IF;

  -- Check if owner_id column exists
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'team_member_plugin_permissions'
    AND column_name = 'owner_id'
  ) THEN
    RAISE NOTICE '✅ Column owner_id exists - this is the owner reference';
  END IF;
END $$;

-- Show sample data to understand the structure
DO $$
DECLARE
  sample_count integer;
BEGIN
  SELECT COUNT(*) INTO sample_count FROM team_member_plugin_permissions;
  RAISE NOTICE '=== SAMPLE DATA (Total rows: %) ===', sample_count;
  
  IF sample_count > 0 THEN
    RAISE NOTICE 'First 3 rows:';
    FOR sample_record IN
      SELECT * FROM team_member_plugin_permissions LIMIT 3
    LOOP
      RAISE NOTICE 'Row: %', sample_record;
    END LOOP;
  ELSE
    RAISE NOTICE 'No data in table yet';
  END IF;
END $$;
