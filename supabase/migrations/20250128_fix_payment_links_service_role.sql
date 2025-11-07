/*
  # Fix Payment Links Service Role Permissions

  1. Problem
    - Webhook fails with 403 error: permission denied for table payment_links
    - service_role cannot access payment_links table
    
  2. Solution
    - Grant ALL permissions to service_role on payment_links
    - Grant usage on sequences
    - Bypass RLS for service_role (already default behavior)
*/

-- 🔥 GRANT ALL permissions to service_role
GRANT ALL ON payment_links TO service_role;

-- Grant usage on sequences
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO service_role;

-- Verify grants
SELECT 
  grantee,
  privilege_type
FROM information_schema.table_privileges
WHERE table_name = 'payment_links'
  AND table_schema = 'public'
  AND grantee IN ('service_role', 'authenticated', 'anon')
ORDER BY grantee, privilege_type;
