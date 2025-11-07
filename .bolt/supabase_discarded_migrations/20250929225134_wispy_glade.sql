-- Disable RLS on app_versions table and remove all policies

-- 1. Disable Row Level Security
ALTER TABLE public.app_versions DISABLE ROW LEVEL SECURITY;

-- 2. Drop all existing RLS policies for app_versions
DROP POLICY IF EXISTS "Enable read access for all users" ON public.app_versions;
DROP POLICY IF EXISTS "Allow super admins to manage app versions" ON public.app_versions;
DROP POLICY IF EXISTS "Allow public read access to current version" ON public.app_versions;
DROP POLICY IF EXISTS "Allow super admins to insert app versions" ON public.app_versions;
DROP POLICY IF EXISTS "Allow super admins to update app versions" ON public.app_versions;
DROP POLICY IF EXISTS "Allow super admins to delete app versions" ON public.app_versions;

-- 3. Verify RLS status
SELECT relrowsecurity FROM pg_class WHERE relname = 'app_versions';

-- 4. Confirmation message
-- This is a standard SQL comment, not a RAISE NOTICE, to avoid syntax errors
-- RLS has been disabled on the app_versions table. It is now publicly accessible.
