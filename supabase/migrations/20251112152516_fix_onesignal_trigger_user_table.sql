/*
  # Fix OneSignal Trigger to use user_onesignal table

  1. Changes
    - Update send_onesignal_notification_trigger function to query user_onesignal instead of profiles
    - No other changes needed
    
  2. Notes
    - This fixes the trigger to work with the new user_onesignal table
    - The trigger still fires after notification insert
*/

-- Update function to use user_onesignal table
CREATE OR REPLACE FUNCTION send_onesignal_notification_trigger()
RETURNS trigger AS $$
DECLARE
  v_player_id text;
  v_response jsonb;
BEGIN
  -- Check if user has OneSignal player ID in user_onesignal table
  SELECT player_id INTO v_player_id
  FROM user_onesignal
  WHERE user_id = NEW.user_id
  AND subscription_status = 'active';

  -- Only send if user has OneSignal configured
  IF v_player_id IS NOT NULL AND v_player_id != '' THEN
    -- Call the Edge Function asynchronously
    -- Note: This is a fire-and-forget call, errors will be logged in the Edge Function
    BEGIN
      PERFORM net.http_post(
        url := current_setting('app.settings.supabase_url') || '/functions/v1/send-onesignal-notification',
        headers := jsonb_build_object(
          'Content-Type', 'application/json',
          'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key')
        ),
        body := jsonb_build_object(
          'userId', NEW.user_id,
          'type', NEW.type,
          'title', NEW.title,
          'message', NEW.message,
          'bookingId', NEW.booking_id
        )
      );
    EXCEPTION WHEN OTHERS THEN
      -- Log error but don't fail the transaction
      RAISE WARNING 'Failed to send OneSignal notification: %', SQLERRM;
      
      UPDATE notifications
      SET 
        onesignal_sent = false,
        onesignal_error = SQLERRM
      WHERE id = NEW.id;
    END;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- No need to recreate the trigger, it will use the updated function
