/*
  # Add OneSignal Integration Support

  1. Changes to profiles table
    - Add `onesignal_player_id` column to store OneSignal subscription ID
    - Add index for faster lookups
  
  2. Changes to notifications table
    - Add `onesignal_notification_id` to track OneSignal notification ID
    - Add `onesignal_sent` boolean to track if notification was sent via OneSignal
    - Add `onesignal_sent_at` timestamp for when it was sent
    - Add `onesignal_error` text field to store any error messages
    - Add indexes for better query performance

  3. Security
    - Update RLS policies to allow users to update their own OneSignal player ID
    
  Notes:
    - OneSignal player ID is the unique identifier for each user's device/browser subscription
    - Notifications can be sent via both the in-app system and OneSignal push notifications
    - The onesignal_sent flag helps avoid duplicate sends and enables retry logic
*/

-- Add OneSignal player ID to profiles table
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'profiles' AND column_name = 'onesignal_player_id'
  ) THEN
    ALTER TABLE profiles ADD COLUMN onesignal_player_id text;
  END IF;
END $$;

-- Create index on onesignal_player_id for faster lookups
CREATE INDEX IF NOT EXISTS idx_profiles_onesignal_player_id 
  ON profiles(onesignal_player_id) 
  WHERE onesignal_player_id IS NOT NULL;

-- Add OneSignal tracking fields to notifications table
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'notifications' AND column_name = 'onesignal_notification_id'
  ) THEN
    ALTER TABLE notifications ADD COLUMN onesignal_notification_id text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'notifications' AND column_name = 'onesignal_sent'
  ) THEN
    ALTER TABLE notifications ADD COLUMN onesignal_sent boolean DEFAULT false;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'notifications' AND column_name = 'onesignal_sent_at'
  ) THEN
    ALTER TABLE notifications ADD COLUMN onesignal_sent_at timestamptz;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'notifications' AND column_name = 'onesignal_error'
  ) THEN
    ALTER TABLE notifications ADD COLUMN onesignal_error text;
  END IF;
END $$;

-- Create indexes for OneSignal tracking
CREATE INDEX IF NOT EXISTS idx_notifications_onesignal_sent 
  ON notifications(onesignal_sent, created_at) 
  WHERE onesignal_sent = false;

CREATE INDEX IF NOT EXISTS idx_notifications_onesignal_id 
  ON notifications(onesignal_notification_id) 
  WHERE onesignal_notification_id IS NOT NULL;

-- Update RLS policy to allow users to update their OneSignal player ID
DROP POLICY IF EXISTS "Users can update own profile onesignal" ON profiles;

CREATE POLICY "Users can update own profile onesignal"
  ON profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Grant necessary permissions
GRANT SELECT, UPDATE ON profiles TO authenticated;
GRANT SELECT, UPDATE ON notifications TO authenticated;
