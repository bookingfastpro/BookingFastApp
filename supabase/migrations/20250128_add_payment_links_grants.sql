/*
  # Add GRANT permissions for payment_links table
  
  1. Problem
    - RLS policies are correct but table-level GRANT permissions are missing
    - Error 42501: permission denied for table payment_links
    
  2. Solution
    - Add GRANT permissions for authenticated role
    - Allow INSERT, UPDATE, DELETE, SELECT operations
*/

-- Grant all necessary permissions to authenticated users
GRANT SELECT, INSERT, UPDATE, DELETE ON payment_links TO authenticated;

-- Grant usage on the sequence (for auto-increment IDs if any)
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- Verify grants
SELECT 
  grantee,
  privilege_type
FROM information_schema.table_privileges
WHERE table_name = 'payment_links'
  AND table_schema = 'public'
ORDER BY grantee, privilege_type;
