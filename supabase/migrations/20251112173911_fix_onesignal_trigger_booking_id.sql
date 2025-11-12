/*
  # Fix OneSignal Notification Trigger

  1. Changes
    - Fix the trigger function to use correct column names
    - Extract booking_id from the data jsonb column instead of direct column reference
    - Add proper error handling

  2. Security
    - Maintains SECURITY DEFINER for edge function calls
*/

CREATE OR REPLACE FUNCTION public.send_onesignal_notification_trigger()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
  v_player_id text;
  v_booking_id text;
BEGIN
  -- Check if user has OneSignal player ID in user_onesignal table
  SELECT player_id INTO v_player_id
  FROM user_onesignal
  WHERE user_id = NEW.user_id
  AND subscription_status = 'active';

  -- Extract booking_id from data jsonb if present
  v_booking_id := NEW.data->>'bookingId';

  -- Only send if user has OneSignal configured
  IF v_player_id IS NOT NULL AND v_player_id != '' THEN
    -- Call the Edge Function asynchronously
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
          'bookingId', v_booking_id
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
$function$;
