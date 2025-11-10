/*
  # Fix Admin Impersonation System

  1. Drop existing table if exists
  2. Recreate with proper configuration
  
  This migration fixes the issue where the profiles table reference was not found.
*/

-- Drop existing table and policies
DROP TABLE IF EXISTS admin_sessions CASCADE;

-- Create admin_sessions table
CREATE TABLE admin_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  target_user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  started_at timestamptz NOT NULL DEFAULT now(),
  ended_at timestamptz,
  reason text,
  ip_address text,
  created_at timestamptz DEFAULT now()
);

-- Create indexes for performance
CREATE INDEX idx_admin_sessions_admin_user ON admin_sessions(admin_user_id);
CREATE INDEX idx_admin_sessions_target_user ON admin_sessions(target_user_id);
CREATE INDEX idx_admin_sessions_started_at ON admin_sessions(started_at DESC);
CREATE INDEX idx_admin_sessions_active ON admin_sessions(admin_user_id, ended_at) WHERE ended_at IS NULL;

-- Enable RLS
ALTER TABLE admin_sessions ENABLE ROW LEVEL SECURITY;

-- Policy: Super admins can view all impersonation sessions
CREATE POLICY "Super admins can view all admin sessions"
  ON admin_sessions
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.is_super_admin = true
    )
  );

-- Policy: Super admins can create impersonation sessions
CREATE POLICY "Super admins can create admin sessions"
  ON admin_sessions
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.is_super_admin = true
    )
    AND admin_user_id = auth.uid()
  );

-- Policy: Super admins can update their own sessions (to end them)
CREATE POLICY "Super admins can update own admin sessions"
  ON admin_sessions
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.is_super_admin = true
    )
    AND admin_user_id = auth.uid()
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.is_super_admin = true
    )
    AND admin_user_id = auth.uid()
  );

-- Grant permissions
GRANT SELECT, INSERT, UPDATE ON admin_sessions TO authenticated;
GRANT SELECT, INSERT, UPDATE ON admin_sessions TO service_role;