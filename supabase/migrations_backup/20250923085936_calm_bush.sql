/*
  # Grant super admin permissions to jetservice2a@gmail.com

  1. Updates
    - Set is_super_admin = true for jetservice2a@gmail.com
    - Update subscription status to active
    - Extend trial period

  2. Security
    - Only affects the specific user email
    - Maintains data integrity
*/

-- Update user to super admin status
DO $$
BEGIN
  -- Check if user exists and update
  UPDATE users 
  SET 
    is_super_admin = true,
    subscription_status = 'active',
    trial_ends_at = now() + interval '365 days',
    updated_at = now()
  WHERE email = 'jetservice2a@gmail.com';
  
  -- If user doesn't exist in users table but exists in auth.users, create the profile
  IF NOT FOUND THEN
    INSERT INTO users (
      id,
      email,
      is_super_admin,
      subscription_status,
      trial_ends_at,
      created_at,
      updated_at
    )
    SELECT 
      au.id,
      au.email,
      true,
      'active',
      now() + interval '365 days',
      now(),
      now()
    FROM auth.users au
    WHERE au.email = 'jetservice2a@gmail.com'
    AND NOT EXISTS (
      SELECT 1 FROM users u WHERE u.id = au.id
    );
  END IF;
END $$;
