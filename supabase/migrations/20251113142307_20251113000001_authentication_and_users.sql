/*
  # Migration 01: Authentication and User Management
  
  ## Overview
  Creates the foundational user management system for BookingFast
  
  ## Tables Created
  1. **profiles**
     - id (uuid, primary key, references auth.users)
     - email (text, unique, required)
     - full_name (text)
     - avatar_url (text)
     - created_at (timestamptz)
     - updated_at (timestamptz)
  
  ## Security
  - RLS enabled on profiles table
  - Public can view all profiles
  - Users can update their own profile only
  
  ## Notes
  - Profiles are automatically created when a user signs up
  - Profile data is synced with auth.users table
*/

-- ============================================================================
-- DROP EXISTING TABLES (Clean Slate)
-- ============================================================================

DROP TABLE IF EXISTS profiles CASCADE;

-- ============================================================================
-- TABLE: profiles
-- ============================================================================

CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text UNIQUE NOT NULL,
  full_name text,
  avatar_url text,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

-- Add comment
COMMENT ON TABLE profiles IS 'User profiles linked to authentication system';

-- Enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Profiles are viewable by everyone"
  ON profiles FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_profiles_email ON profiles(email);
CREATE INDEX IF NOT EXISTS idx_profiles_created_at ON profiles(created_at DESC);

-- Grant permissions
GRANT ALL ON profiles TO authenticated;
GRANT SELECT ON profiles TO anon;