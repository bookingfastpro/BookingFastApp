/*
  # Fix user roles foreign key relationship

  1. Foreign Key Constraints
    - Add missing foreign key constraint between user_roles and users tables
    - Add missing foreign key constraint between user_roles and roles tables
    - This will allow Supabase PostgREST to understand the relationships for joins

  2. Security
    - Ensure RLS policies are properly set up for the relationships
*/

-- Add foreign key constraint from user_roles to users table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'user_roles_user_id_fkey' 
    AND table_name = 'user_roles'
  ) THEN
    ALTER TABLE public.user_roles 
    ADD CONSTRAINT user_roles_user_id_fkey 
    FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;
  END IF;
END $$;

-- Add foreign key constraint from user_roles to roles table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'user_roles_role_id_fkey' 
    AND table_name = 'user_roles'
  ) THEN
    ALTER TABLE public.user_roles 
    ADD CONSTRAINT user_roles_role_id_fkey 
    FOREIGN KEY (role_id) REFERENCES public.roles(id) ON DELETE CASCADE;
  END IF;
END $$;

-- Refresh the schema cache to ensure PostgREST recognizes the relationships
NOTIFY pgrst, 'reload schema';
