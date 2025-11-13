/*
  # Create account_users table

  1. New Tables
    - `account_users`
      - `id` (uuid, primary key)
      - `account_id` (uuid, references users table)
      - `user_id` (uuid, references users table)
      - `role` (text, default 'member')
      - `permissions` (text array)
      - `is_active` (boolean, default true)
      - `invited_by` (uuid, references users table)
      - `joined_at` (timestamp)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on `account_users` table
    - Add policies for account members to read their data
    - Add policies for account owners to manage users
    - Add unique constraint on account_id and user_id

  3. Indexes
    - Add indexes for performance on frequently queried columns
*/

CREATE TABLE IF NOT EXISTS public.account_users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  role text NOT NULL DEFAULT 'member',
  permissions text[] DEFAULT '{}',
  is_active boolean NOT NULL DEFAULT true,
  invited_by uuid REFERENCES public.users(id) ON DELETE SET NULL,
  joined_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (account_id, user_id)
);

-- Enable Row Level Security
ALTER TABLE public.account_users ENABLE ROW LEVEL SECURITY;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_account_users_account_id ON public.account_users(account_id);
CREATE INDEX IF NOT EXISTS idx_account_users_user_id ON public.account_users(user_id);
CREATE INDEX IF NOT EXISTS idx_account_users_is_active ON public.account_users(is_active);

-- RLS Policies
CREATE POLICY "Enable read access for account members"
ON public.account_users
FOR SELECT
USING (
  (auth.uid() = user_id) OR
  (auth.uid() = account_id) OR
  (EXISTS (SELECT 1 FROM public.account_users WHERE account_id = account_users.account_id AND user_id = auth.uid() AND is_active = true))
);

CREATE POLICY "Enable insert for account owner"
ON public.account_users
FOR INSERT
WITH CHECK (auth.uid() = account_id);

CREATE POLICY "Enable update for account owner"
ON public.account_users
FOR UPDATE
USING (auth.uid() = account_id);

CREATE POLICY "Enable delete for account owner"
ON public.account_users
FOR DELETE
USING (auth.uid() = account_id);

-- Add trigger for updated_at
CREATE TRIGGER update_account_users_updated_at
  BEFORE UPDATE ON public.account_users
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
