/*
  # Supprimer complètement tout ce qui concerne OneSignal
  
  1. Actions
    - Supprimer tous les triggers OneSignal
    - Supprimer toutes les fonctions OneSignal
    - Supprimer la table user_onesignal
    - Supprimer les colonnes OneSignal de la table notifications
    
  2. Impact
    - Plus aucune référence à OneSignal dans la base
    - Suppression des bookings fonctionnera normalement
*/

-- Supprimer tous les triggers OneSignal
DROP TRIGGER IF EXISTS trigger_send_onesignal_notification ON notifications;
DROP TRIGGER IF EXISTS trigger_update_user_onesignal_updated_at ON user_onesignal;

-- Supprimer toutes les fonctions OneSignal
DROP FUNCTION IF EXISTS send_onesignal_notification_trigger() CASCADE;
DROP FUNCTION IF EXISTS update_user_onesignal_updated_at() CASCADE;

-- Supprimer les colonnes OneSignal de la table notifications
ALTER TABLE notifications 
  DROP COLUMN IF EXISTS onesignal_notification_id,
  DROP COLUMN IF EXISTS onesignal_sent,
  DROP COLUMN IF EXISTS onesignal_sent_at,
  DROP COLUMN IF EXISTS onesignal_error;

-- Supprimer la table user_onesignal
DROP TABLE IF EXISTS user_onesignal CASCADE;

-- Supprimer la colonne onesignal_player_id de profiles si elle existe
DO $$ 
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'profiles' 
    AND column_name = 'onesignal_player_id'
  ) THEN
    ALTER TABLE profiles DROP COLUMN onesignal_player_id;
  END IF;
END $$;
