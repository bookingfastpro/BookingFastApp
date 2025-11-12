-- Migration complète OneSignal pour base self-hosted
-- À exécuter sur bookingfast.hevolife.fr

-- 1. Ajouter les colonnes OneSignal à la table notifications
ALTER TABLE notifications
ADD COLUMN IF NOT EXISTS onesignal_notification_id text,
ADD COLUMN IF NOT EXISTS onesignal_sent boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS onesignal_sent_at timestamptz,
ADD COLUMN IF NOT EXISTS onesignal_error text;

-- 2. Créer la table user_onesignal
CREATE TABLE IF NOT EXISTS user_onesignal (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  player_id text NOT NULL,
  subscription_status text DEFAULT 'active' CHECK (subscription_status IN ('active', 'inactive')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id)
);

-- 3. Activer RLS
ALTER TABLE user_onesignal ENABLE ROW LEVEL SECURITY;

-- 4. Politiques RLS pour user_onesignal
DROP POLICY IF EXISTS "Users can view own OneSignal data" ON user_onesignal;
CREATE POLICY "Users can view own OneSignal data"
  ON user_onesignal FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own OneSignal data" ON user_onesignal;
CREATE POLICY "Users can insert own OneSignal data"
  ON user_onesignal FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own OneSignal data" ON user_onesignal;
CREATE POLICY "Users can update own OneSignal data"
  ON user_onesignal FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own OneSignal data" ON user_onesignal;
CREATE POLICY "Users can delete own OneSignal data"
  ON user_onesignal FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- 5. Accorder les permissions
GRANT ALL ON user_onesignal TO authenticated;
GRANT ALL ON user_onesignal TO service_role;
GRANT ALL ON user_onesignal TO anon;

-- 6. Index pour performance
CREATE INDEX IF NOT EXISTS idx_user_onesignal_user_id ON user_onesignal(user_id);
CREATE INDEX IF NOT EXISTS idx_user_onesignal_player_id ON user_onesignal(player_id);

-- 7. Recréer le trigger de notification OneSignal (corrigé)
DROP TRIGGER IF EXISTS trigger_send_onesignal_notification ON notifications;
DROP FUNCTION IF EXISTS send_onesignal_notification_trigger();

CREATE OR REPLACE FUNCTION send_onesignal_notification_trigger()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_player_id text;
  v_booking_id text;
BEGIN
  -- Check if user has OneSignal player ID
  SELECT player_id INTO v_player_id
  FROM user_onesignal
  WHERE user_id = NEW.user_id
  AND subscription_status = 'active';

  -- Extract booking_id from data jsonb if present
  v_booking_id := NEW.data->>'bookingId';

  -- Only send if user has OneSignal configured
  IF v_player_id IS NOT NULL AND v_player_id != '' THEN
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
$$;

CREATE TRIGGER trigger_send_onesignal_notification
  AFTER INSERT ON notifications
  FOR EACH ROW
  EXECUTE FUNCTION send_onesignal_notification_trigger();

-- Terminé!
SELECT 'Migration OneSignal complétée avec succès!' as status;
