/*
  # Système de notifications

  1. Nouvelle table
    - `notifications`
      - `id` (uuid, primary key)
      - `user_id` (uuid, référence vers auth.users)
      - `type` (text) - Type de notification (booking_created, booking_updated, booking_cancelled)
      - `title` (text) - Titre de la notification
      - `message` (text) - Message de la notification
      - `booking_id` (uuid, référence vers bookings)
      - `is_read` (boolean) - Statut de lecture
      - `created_at` (timestamptz)
      - `read_at` (timestamptz, nullable)

  2. Sécurité
    - Enable RLS sur `notifications`
    - Politique pour lire ses propres notifications
    - Fonction pour nettoyer automatiquement les vieilles notifications (garder 20 max)
    - Triggers pour créer automatiquement les notifications lors des événements

  3. Index
    - Index sur user_id et is_read pour optimiser les requêtes
    - Index sur created_at pour le tri
*/

-- Créer la table notifications
CREATE TABLE IF NOT EXISTS notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  type text NOT NULL CHECK (type IN ('booking_created', 'booking_updated', 'booking_cancelled')),
  title text NOT NULL,
  message text NOT NULL,
  booking_id uuid REFERENCES bookings(id) ON DELETE CASCADE,
  is_read boolean DEFAULT false NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  read_at timestamptz
);

-- Activer RLS
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Politique pour lire ses propres notifications
CREATE POLICY "Users can read own notifications"
  ON notifications
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Politique pour marquer ses notifications comme lues
CREATE POLICY "Users can update own notifications"
  ON notifications
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Politique pour supprimer ses propres notifications
CREATE POLICY "Users can delete own notifications"
  ON notifications
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Index pour optimiser les requêtes
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_user_read ON notifications(user_id, is_read);

-- Fonction pour nettoyer les vieilles notifications (garder 20 max par utilisateur)
CREATE OR REPLACE FUNCTION cleanup_old_notifications()
RETURNS trigger AS $$
BEGIN
  DELETE FROM notifications
  WHERE id IN (
    SELECT id
    FROM notifications
    WHERE user_id = NEW.user_id
    ORDER BY created_at DESC
    OFFSET 20
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger pour nettoyer automatiquement après chaque insertion
CREATE TRIGGER trigger_cleanup_notifications
  AFTER INSERT ON notifications
  FOR EACH ROW
  EXECUTE FUNCTION cleanup_old_notifications();

-- Fonction pour créer une notification de réservation
CREATE OR REPLACE FUNCTION create_booking_notification(
  p_user_id uuid,
  p_type text,
  p_booking_id uuid,
  p_client_name text,
  p_service_name text,
  p_booking_date timestamptz
)
RETURNS void AS $$
DECLARE
  v_title text;
  v_message text;
BEGIN
  -- Générer le titre et message selon le type
  CASE p_type
    WHEN 'booking_created' THEN
      v_title := 'Nouvelle réservation';
      v_message := format('Réservation créée pour %s - %s le %s',
        p_client_name,
        p_service_name,
        to_char(p_booking_date, 'DD/MM/YYYY à HH24:MI')
      );
    WHEN 'booking_updated' THEN
      v_title := 'Réservation modifiée';
      v_message := format('Réservation modifiée pour %s - %s le %s',
        p_client_name,
        p_service_name,
        to_char(p_booking_date, 'DD/MM/YYYY à HH24:MI')
      );
    WHEN 'booking_cancelled' THEN
      v_title := 'Réservation annulée';
      v_message := format('Réservation annulée pour %s - %s le %s',
        p_client_name,
        p_service_name,
        to_char(p_booking_date, 'DD/MM/YYYY à HH24:MI')
      );
  END CASE;

  -- Insérer la notification
  INSERT INTO notifications (user_id, type, title, message, booking_id)
  VALUES (p_user_id, p_type, v_title, v_message, p_booking_id);
END;
$$ LANGUAGE plpgsql;

-- Trigger pour notifier lors de la création d'une réservation
CREATE OR REPLACE FUNCTION notify_booking_created()
RETURNS trigger AS $$
DECLARE
  v_client_name text;
  v_service_name text;
BEGIN
  -- Récupérer les informations du client et du service
  SELECT c.name, s.name
  INTO v_client_name, v_service_name
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

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_notify_booking_created
  AFTER INSERT ON bookings
  FOR EACH ROW
  EXECUTE FUNCTION notify_booking_created();

-- Trigger pour notifier lors de la modification d'une réservation
CREATE OR REPLACE FUNCTION notify_booking_updated()
RETURNS trigger AS $$
DECLARE
  v_client_name text;
  v_service_name text;
BEGIN
  -- Ne notifier que si des champs importants ont changé
  IF (OLD.start_time IS DISTINCT FROM NEW.start_time) OR
     (OLD.end_time IS DISTINCT FROM NEW.end_time) OR
     (OLD.status IS DISTINCT FROM NEW.status) THEN

    -- Récupérer les informations du client et du service
    SELECT c.name, s.name
    INTO v_client_name, v_service_name
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

CREATE TRIGGER trigger_notify_booking_updated
  AFTER UPDATE ON bookings
  FOR EACH ROW
  EXECUTE FUNCTION notify_booking_updated();

-- Trigger pour notifier lors de l'annulation d'une réservation
CREATE OR REPLACE FUNCTION notify_booking_cancelled()
RETURNS trigger AS $$
DECLARE
  v_client_name text;
  v_service_name text;
BEGIN
  -- Notifier uniquement si le statut passe à cancelled
  IF OLD.status != 'cancelled' AND NEW.status = 'cancelled' THEN

    -- Récupérer les informations du client et du service
    SELECT c.name, s.name
    INTO v_client_name, v_service_name
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

CREATE TRIGGER trigger_notify_booking_cancelled
  AFTER UPDATE ON bookings
  FOR EACH ROW
  EXECUTE FUNCTION notify_booking_cancelled();
