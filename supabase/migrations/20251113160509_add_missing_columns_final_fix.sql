/*
  # Final Missing Columns Fix - Complete Database Schema Alignment
  
  ## Problem
  Several columns used by the TypeScript code don't exist in the database:
  - clients.country
  
  ## Solution
  Add all missing columns to align database with code expectations.
  
  ## Changes
  1. Add 'country' column to clients table
  2. Force PostgREST reload
*/

-- =====================================================
-- CLIENTS TABLE - ADD COUNTRY
-- =====================================================

DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'clients' 
    AND column_name = 'country'
  ) THEN
    ALTER TABLE clients ADD COLUMN country text;
  END IF;
END $$;

-- =====================================================
-- FORCE POSTGREST RELOAD
-- =====================================================

NOTIFY pgrst, 'reload schema';
NOTIFY pgrst, 'reload config';
