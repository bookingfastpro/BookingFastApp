/*
  # Fix OneSignal Integration - Create dedicated user table

  1. New Table
    - Create `user_onesignal` table to store OneSignal player IDs
    - Links to auth.users via user_id
    - Stores player_id, subscription status, and metadata
  
  2. Security
    - Enable RLS on `user_onesignal`
    - Users can read and update their own OneSignal data
    
  3. Notes
    - This replaces the profiles approach since profiles table doesn't exist
    - Each user can have one OneSignal subscription record
*/

-- Drop the previous migration's changes if they exist
DO $$ 
BEGIN
  -- Remove profile column if it was added (it will fail, but that's ok)
  BEGIN
    ALTER TABLE profiles DROP COLUMN IF EXISTS onesignal_player_id;
  EXCEPTION WHEN undefined_table THEN
    -- Table doesn't exist, nothing to do
    NULL;
  END;
END $$;

-- Create user_onesignal table
CREATE TABLE IF NOT EXISTS user_onesignal (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  player_id text NOT NULL,
  subscription_status text DEFAULT 'active' CHECK (subscription_status IN ('active', 'inactive', 'unsubscribed')),
  device_type text,
  browser text,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL,
  last_seen_at timestamptz
);

-- Enable RLS
ALTER TABLE user_onesignal ENABLE ROW LEVEL SECURITY;

-- Policy for users to read their own OneSignal data
CREATE POLICY "Users can read own onesignal data"
  ON user_onesignal
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Policy for users to insert their own OneSignal data
CREATE POLICY "Users can insert own onesignal data"
  ON user_onesignal
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Policy for users to update their own OneSignal data
CREATE POLICY "Users can update own onesignal data"
  ON user_onesignal
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Policy for users to delete their own OneSignal data
CREATE POLICY "Users can delete own onesignal data"
  ON user_onesignal
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create index for fast user lookup
CREATE INDEX IF NOT EXISTS idx_user_onesignal_user_id 
  ON user_onesignal(user_id);

-- Create index for player_id lookup
CREATE INDEX IF NOT EXISTS idx_user_onesignal_player_id 
  ON user_onesignal(player_id);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_user_onesignal_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update updated_at on changes
CREATE TRIGGER trigger_update_user_onesignal_updated_at
  BEFORE UPDATE ON user_onesignal
  FOR EACH ROW
  EXECUTE FUNCTION update_user_onesignal_updated_at();

-- Grant permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON user_onesignal TO authenticated;
