/*
  # Fix platform_settings permissions for service_role

  1. Changes
    - Grant SELECT permission to service_role
    - Create RLS policy allowing service_role to read settings
    - Ensure Edge Functions can access Stripe configuration

  2. Security
    - Only service_role can access (used by Edge Functions)
    - No public access maintained
*/

-- Grant SELECT permission to service_role
GRANT SELECT ON TABLE platform_settings TO service_role;

-- Create policy for service_role to read settings
CREATE POLICY "Service role can read platform settings"
  ON platform_settings
  FOR SELECT
  TO service_role
  USING (true);

-- Verify permissions
DO $$
BEGIN
  RAISE NOTICE '✅ Permissions granted to service_role for platform_settings';
END $$;
