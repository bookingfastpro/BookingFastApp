/*
  # Add OneSignal Notification Triggers

  1. Functions
    - Create function to call OneSignal Edge Function when notifications are created
    - Handle all notification types (booking_created, booking_updated, booking_cancelled)
    
  2. Triggers
    - Trigger after notification insert to send OneSignal push notification
    - Only send if user has OneSignal player ID registered
    
  3. Notes
    - The trigger calls the send-onesignal-notification Edge Function
    - Edge Function handles the actual OneSignal API call
    - Failures are logged in the onesignal_error column
*/

-- Function to send OneSignal notification via Edge Function
CREATE OR REPLACE FUNCTION send_onesignal_notification_trigger()
RETURNS trigger AS $$
DECLARE
  v_player_id text;
  v_response jsonb;
BEGIN
  -- Check if user has OneSignal player ID
  SELECT onesignal_player_id INTO v_player_id
  FROM profiles
  WHERE id = NEW.user_id;

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

-- Trigger to send OneSignal notification after insert
DROP TRIGGER IF EXISTS trigger_send_onesignal_notification ON notifications;

CREATE TRIGGER trigger_send_onesignal_notification
  AFTER INSERT ON notifications
  FOR EACH ROW
  EXECUTE FUNCTION send_onesignal_notification_trigger();

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION send_onesignal_notification_trigger() TO authenticated;
GRANT EXECUTE ON FUNCTION send_onesignal_notification_trigger() TO service_role;
