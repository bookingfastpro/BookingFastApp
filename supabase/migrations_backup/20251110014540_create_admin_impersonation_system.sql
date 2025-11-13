/*
  # Admin Impersonation System

  1. New Tables
    - `admin_sessions`
      - `id` (uuid, primary key)
      - `admin_user_id` (uuid, not null) - The super admin who is impersonating
      - `target_user_id` (uuid, not null) - The user being impersonated
      - `started_at` (timestamptz, not null) - When impersonation started
      - `ended_at` (timestamptz) - When impersonation ended (null if active)
      - `reason` (text) - Optional reason for impersonation
      - `ip_address` (text) - IP address for audit trail

  2. Security
    - Enable RLS on `admin_sessions` table
    - Add policy for super admins to read/write their own impersonation sessions
    - Add audit logging for security compliance

  3. Indexes
    - Index on admin_user_id for quick lookups
    - Index on target_user_id for audit purposes
    - Index on started_at for time-based queries
*/

-- Create admin_sessions table
CREATE TABLE IF NOT EXISTS admin_sessions (
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
CREATE INDEX IF NOT EXISTS idx_admin_sessions_admin_user ON admin_sessions(admin_user_id);
CREATE INDEX IF NOT EXISTS idx_admin_sessions_target_user ON admin_sessions(target_user_id);
CREATE INDEX IF NOT EXISTS idx_admin_sessions_started_at ON admin_sessions(started_at DESC);
CREATE INDEX IF NOT EXISTS idx_admin_sessions_active ON admin_sessions(admin_user_id, ended_at) WHERE ended_at IS NULL;

-- Enable RLS
ALTER TABLE admin_sessions ENABLE ROW LEVEL SECURITY;

-- Policy: Super admins can view all impersonation sessions
CREATE POLICY "Super admins can view all admin sessions"
  ON admin_sessions
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
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
      SELECT 1 FROM profiles
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
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.is_super_admin = true
    )
    AND admin_user_id = auth.uid()
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.is_super_admin = true
    )
    AND admin_user_id = auth.uid()
  );

-- Grant permissions
GRANT SELECT, INSERT, UPDATE ON admin_sessions TO authenticated;
GRANT SELECT, INSERT, UPDATE ON admin_sessions TO service_role;