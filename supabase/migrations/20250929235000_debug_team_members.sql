/*
  # Debug team_members table structure

  1. Purpose
    - Verify actual column names in team_members table
    - Check sample data to understand the structure
    - Identify correct columns for querying

  2. Actions
    - Display all columns and their types
    - Show sample records
    - Verify foreign key relationships
*/

-- Display all columns in team_members table
DO $$
DECLARE
  col_record RECORD;
BEGIN
  RAISE NOTICE '=== COLUMNS IN team_members TABLE ===';
  FOR col_record IN 
    SELECT column_name, data_type, is_nullable, column_default
    FROM information_schema.columns
    WHERE table_name = 'team_members'
    ORDER BY ordinal_position
  LOOP
    RAISE NOTICE 'Column: % | Type: % | Nullable: % | Default: %', 
      col_record.column_name, 
      col_record.data_type, 
      col_record.is_nullable,
      col_record.column_default;
  END LOOP;
END $$;

-- Display foreign key constraints
DO $$
DECLARE
  fk_record RECORD;
BEGIN
  RAISE NOTICE '=== FOREIGN KEYS IN team_members ===';
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
    WHERE tc.table_name = 'team_members'
      AND tc.constraint_type = 'FOREIGN KEY'
  LOOP
    RAISE NOTICE 'FK: % | Column: % -> %.%',
      fk_record.constraint_name,
      fk_record.column_name,
      fk_record.foreign_table_name,
      fk_record.foreign_column_name;
  END LOOP;
END $$;

-- Display sample data (first 3 rows)
DO $$
DECLARE
  sample_count integer;
  sample_record RECORD;
BEGIN
  SELECT COUNT(*) INTO sample_count FROM team_members;
  RAISE NOTICE '=== SAMPLE DATA (Total: % rows) ===', sample_count;
  
  IF sample_count > 0 THEN
    FOR sample_record IN
      SELECT * FROM team_members LIMIT 3
    LOOP
      RAISE NOTICE 'Record: %', sample_record;
    END LOOP;
  ELSE
    RAISE NOTICE 'No data in team_members table';
  END IF;
END $$;
