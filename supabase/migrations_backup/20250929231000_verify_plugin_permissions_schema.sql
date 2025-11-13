/*
  # Verify team_member_plugin_permissions table schema

  1. Changes
    - Check actual column structure
    - Verify foreign key relationships
    - Show sample data

  2. Security
    - Maintain RLS policies
*/

-- Check what columns actually exist
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

-- Check if specific columns exist
DO $$
BEGIN
  RAISE NOTICE '=== COLUMN EXISTENCE CHECK ===';
  
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'team_member_plugin_permissions'
    AND column_name = 'user_id'
  ) THEN
    RAISE NOTICE '✅ Column user_id exists';
  ELSE
    RAISE NOTICE '❌ Column user_id does NOT exist';
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'team_member_plugin_permissions'
    AND column_name = 'member_id'
  ) THEN
    RAISE NOTICE '✅ Column member_id exists';
  ELSE
    RAISE NOTICE '❌ Column member_id does NOT exist';
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'team_member_plugin_permissions'
    AND column_name = 'owner_id'
  ) THEN
    RAISE NOTICE '✅ Column owner_id exists';
  ELSE
    RAISE NOTICE '❌ Column owner_id does NOT exist';
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'team_member_plugin_permissions'
    AND column_name = 'team_member_id'
  ) THEN
    RAISE NOTICE '✅ Column team_member_id exists';
  ELSE
    RAISE NOTICE '❌ Column team_member_id does NOT exist';
  END IF;
END $$;
