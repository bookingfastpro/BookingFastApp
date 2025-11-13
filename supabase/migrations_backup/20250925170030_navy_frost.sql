/*
  # Add name and email columns to account_users table

  1. New Columns
    - `email` (text) - Email address of the account user
    - `full_name` (text) - Full name of the account user

  2. Changes
    - Add email column to store user email directly
    - Add full_name column to store user name directly
    - This avoids complex joins and improves performance for user lists

  3. Notes
    - These columns will be populated when creating new account users
    - Existing records will need to be migrated separately if needed
*/

-- Add email column to account_users
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'account_users' AND column_name = 'email'
  ) THEN
    ALTER TABLE account_users ADD COLUMN email text;
  END IF;
END $$;

-- Add full_name column to account_users
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'account_users' AND column_name = 'full_name'
  ) THEN
    ALTER TABLE account_users ADD COLUMN full_name text;
  END IF;
END $$;

-- Add index on email for faster searches
CREATE INDEX IF NOT EXISTS idx_account_users_email ON account_users(email);

-- Add index on full_name for faster searches
CREATE INDEX IF NOT EXISTS idx_account_users_full_name ON account_users(full_name);
