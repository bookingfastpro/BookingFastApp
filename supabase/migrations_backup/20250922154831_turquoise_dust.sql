/*
  # Fix user registration database error

  1. Database Function
    - Create function to automatically create user profile on signup
    - Handle trial period setup (7 days from registration)
    
  2. Trigger
    - Trigger on auth.users insert to create corresponding public.users entry
    
  3. Security
    - Update RLS policies to allow user profile creation during signup
*/

-- Function to create user profile automatically
CREATE OR REPLACE FUNCTION create_user_with_trial()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (
    id,
    email,
    full_name,
    is_super_admin,
    trial_started_at,
    trial_ends_at,
    subscription_status,
    created_at,
    updated_at
  ) VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    false,
    now(),
    now() + interval '7 days',
    'trial',
    now(),
    now()
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to automatically create user profile
DROP TRIGGER IF EXISTS trigger_create_user_profile ON auth.users;
CREATE TRIGGER trigger_create_user_profile
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION create_user_with_trial();

-- Update RLS policies to allow user creation during signup
DROP POLICY IF EXISTS "Allow user creation during signup" ON users;
CREATE POLICY "Allow user creation during signup"
  ON users
  FOR INSERT
  TO service_role
  WITH CHECK (true);

-- Ensure service role can read user data for the trigger
DROP POLICY IF EXISTS "Service role can read users" ON users;
CREATE POLICY "Service role can read users"
  ON users
  FOR SELECT
  TO service_role
  USING (true);
