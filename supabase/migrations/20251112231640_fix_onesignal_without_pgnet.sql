/*
  # Fix OneSignal Integration - Sans pg_net

  1. Modifications
    - Suppression de la fonction send_onesignal_push qui utilise pg_net
    - Mise à jour des triggers pour logger uniquement dans la table notifications
    - Les notifications push seront envoyées via un service externe (webhook ou polling)

  2. Approche alternative
    - Les triggers créent seulement les notifications dans la base de données
    - Un service externe (Edge Function appelée par le frontend ou un cron) lit les nouvelles notifications
    - Le service externe envoie les notifications push via OneSignal

  3. Notes
    - Cette approche fonctionne sans pg_net
    - Plus simple pour Supabase auto-hébergé
    - Les notifications push seront envoyées avec un léger délai
*/

-- Supprimer la fonction send_onesignal_push si elle existe (elle utilise pg_net)
DROP FUNCTION IF EXISTS send_onesignal_push(uuid, text, text, uuid, text, text);

-- Recréer les fonctions de notification sans appel OneSignal direct
CREATE OR REPLACE FUNCTION notify_booking_created()
RETURNS trigger AS $$
DECLARE
  v_client_name text;
  v_client_phone text;
  v_service_name text;
BEGIN
  -- Récupérer les informations du client et du service
  SELECT c.name, c.phone, s.name
  INTO v_client_name, v_client_phone, v_service_name
  FROM clients c, services s
  WHERE c.id = NEW.client_id AND s.id = NEW.service_id;

  -- Créer la notification pour le propriétaire
  PERFORM create_booking_notification(
    NEW.user_id,
    'booking_created',
    NEW.id,
    COALESCE(v_client_name, 'Client inconnu'),
    COALESCE(v_service_name, 'Service inconnu'),
    NEW.start_time
  );

  -- Note: Les notifications push seront envoyées par le frontend ou un service externe
  -- qui lira la table notifications et appellera l'Edge Function send-onesignal-notification

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION notify_booking_updated()
RETURNS trigger AS $$
DECLARE
  v_client_name text;
  v_client_phone text;
  v_service_name text;
BEGIN
  -- Ne notifier que si des champs importants ont changé
  IF (OLD.start_time IS DISTINCT FROM NEW.start_time) OR
     (OLD.end_time IS DISTINCT FROM NEW.end_time) OR
     (OLD.status IS DISTINCT FROM NEW.status) THEN

    -- Récupérer les informations du client et du service
    SELECT c.name, c.phone, s.name
    INTO v_client_name, v_client_phone, v_service_name
    FROM clients c, services s
    WHERE c.id = NEW.client_id AND s.id = NEW.service_id;

    -- Créer la notification pour le propriétaire
    PERFORM create_booking_notification(
      NEW.user_id,
      'booking_updated',
      NEW.id,
      COALESCE(v_client_name, 'Client inconnu'),
      COALESCE(v_service_name, 'Service inconnu'),
      NEW.start_time
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION notify_booking_cancelled()
RETURNS trigger AS $$
DECLARE
  v_client_name text;
  v_client_phone text;
  v_service_name text;
BEGIN
  -- Notifier uniquement si le statut passe à cancelled
  IF OLD.status != 'cancelled' AND NEW.status = 'cancelled' THEN

    -- Récupérer les informations du client et du service
    SELECT c.name, c.phone, s.name
    INTO v_client_name, v_client_phone, v_service_name
    FROM clients c, services s
    WHERE c.id = NEW.client_id AND s.id = NEW.service_id;

    -- Créer la notification pour le propriétaire
    PERFORM create_booking_notification(
      NEW.user_id,
      'booking_cancelled',
      NEW.id,
      COALESCE(v_client_name, 'Client inconnu'),
      COALESCE(v_service_name, 'Service inconnu'),
      NEW.start_time
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Ajouter une colonne pour tracker si une notification push a été envoyée
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'notifications' AND column_name = 'push_sent'
  ) THEN
    ALTER TABLE notifications ADD COLUMN push_sent boolean DEFAULT false;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'notifications' AND column_name = 'push_sent_at'
  ) THEN
    ALTER TABLE notifications ADD COLUMN push_sent_at timestamptz;
  END IF;
END $$;

-- Index pour retrouver rapidement les notifications non envoyées
CREATE INDEX IF NOT EXISTS idx_notifications_push_sent 
  ON notifications(push_sent, created_at) 
  WHERE push_sent = false;

-- Fonction pour marquer une notification comme envoyée
CREATE OR REPLACE FUNCTION mark_notification_push_sent(p_notification_id uuid)
RETURNS void AS $$
BEGIN
  UPDATE notifications
  SET push_sent = true,
      push_sent_at = now()
  WHERE id = p_notification_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Accorder les permissions nécessaires
GRANT EXECUTE ON FUNCTION mark_notification_push_sent(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION mark_notification_push_sent(uuid) TO service_role;
