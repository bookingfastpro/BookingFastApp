/*
  # Fix user_subscriptions foreign key relationship

  1. Foreign Keys
    - Add missing foreign key constraint from user_subscriptions.user_id to users.id
    - Add missing foreign key constraint from user_subscriptions.plan_id to subscription_plans.id

  2. Indexes
    - Add performance indexes for foreign key relationships

  3. Security
    - Ensure RLS policies work correctly with the relationships
*/

-- Add foreign key constraint for user_subscriptions.user_id -> users.id if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'user_subscriptions_user_id_fkey' 
    AND table_name = 'user_subscriptions'
  ) THEN
    ALTER TABLE user_subscriptions 
    ADD CONSTRAINT user_subscriptions_user_id_fkey 
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
  END IF;
END $$;

-- Add foreign key constraint for user_subscriptions.plan_id -> subscription_plans.id if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'user_subscriptions_plan_id_fkey' 
    AND table_name = 'user_subscriptions'
  ) THEN
    ALTER TABLE user_subscriptions 
    ADD CONSTRAINT user_subscriptions_plan_id_fkey 
    FOREIGN KEY (plan_id) REFERENCES subscription_plans(id) ON DELETE CASCADE;
  END IF;
END $$;

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_user_id_fkey 
ON user_subscriptions(user_id);

CREATE INDEX IF NOT EXISTS idx_user_subscriptions_plan_id_fkey 
ON user_subscriptions(plan_id);
