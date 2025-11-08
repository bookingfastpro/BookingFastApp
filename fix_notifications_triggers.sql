-- ============================================
-- FIX NOTIFICATIONS - À exécuter dans SQL Editor
-- ============================================

-- 1. Supprimer les anciens triggers
DROP TRIGGER IF EXISTS trigger_notify_booking_created ON bookings;
DROP TRIGGER IF EXISTS trigger_notify_booking_updated ON bookings;
DROP TRIGGER IF EXISTS trigger_notify_booking_cancelled ON bookings;

-- 2. Recréer la fonction de création de notification
CREATE OR REPLACE FUNCTION notify_booking_created()
RETURNS trigger AS $$
DECLARE
  v_client_name text;
  v_service_name text;
  v_booking_datetime timestamptz;
BEGIN
  BEGIN
    -- Construire le nom complet du client
    v_client_name := CONCAT(NEW.client_firstname, ' ', NEW.client_name);

    -- Récupérer le nom du service
    SELECT name INTO v_service_name
    FROM services
    WHERE id = NEW.service_id;

    -- Calculer la date/heure de la réservation
    v_booking_datetime := (NEW.date + NEW.time)::timestamptz;

    -- Insérer la notification
    INSERT INTO notifications (user_id, type, title, message, booking_id)
    VALUES (
      NEW.user_id,
      'booking_created',
      'Nouvelle réservation',
      format('Réservation créée pour %s - %s le %s',
        COALESCE(v_client_name, 'Client inconnu'),
        COALESCE(v_service_name, 'Service inconnu'),
        to_char(v_booking_datetime, 'DD/MM/YYYY à HH24:MI')
      ),
      NEW.id
    );

  EXCEPTION WHEN OTHERS THEN
    -- Log l'erreur mais ne bloque pas l'insertion
    RAISE WARNING 'Erreur lors de la création de notification: %', SQLERRM;
  END;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 3. Recréer la fonction de modification
CREATE OR REPLACE FUNCTION notify_booking_updated()
RETURNS trigger AS $$
DECLARE
  v_client_name text;
  v_service_name text;
  v_booking_datetime timestamptz;
BEGIN
  BEGIN
    -- Ne notifier que si des champs importants ont changé
    IF (OLD.date IS DISTINCT FROM NEW.date) OR
       (OLD.time IS DISTINCT FROM NEW.time) OR
       (OLD.booking_status IS DISTINCT FROM NEW.booking_status) THEN

      v_client_name := CONCAT(NEW.client_firstname, ' ', NEW.client_name);

      SELECT name INTO v_service_name
      FROM services
      WHERE id = NEW.service_id;

      v_booking_datetime := (NEW.date + NEW.time)::timestamptz;

      INSERT INTO notifications (user_id, type, title, message, booking_id)
      VALUES (
        NEW.user_id,
        'booking_updated',
        'Réservation modifiée',
        format('Réservation modifiée pour %s - %s le %s',
          COALESCE(v_client_name, 'Client inconnu'),
          COALESCE(v_service_name, 'Service inconnu'),
          to_char(v_booking_datetime, 'DD/MM/YYYY à HH24:MI')
        ),
        NEW.id
      );
    END IF;

  EXCEPTION WHEN OTHERS THEN
    RAISE WARNING 'Erreur lors de la création de notification: %', SQLERRM;
  END;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 4. Recréer la fonction d'annulation
CREATE OR REPLACE FUNCTION notify_booking_cancelled()
RETURNS trigger AS $$
DECLARE
  v_client_name text;
  v_service_name text;
  v_booking_datetime timestamptz;
BEGIN
  BEGIN
    IF OLD.booking_status != 'cancelled' AND NEW.booking_status = 'cancelled' THEN

      v_client_name := CONCAT(NEW.client_firstname, ' ', NEW.client_name);

      SELECT name INTO v_service_name
      FROM services
      WHERE id = NEW.service_id;

      v_booking_datetime := (NEW.date + NEW.time)::timestamptz;

      INSERT INTO notifications (user_id, type, title, message, booking_id)
      VALUES (
        NEW.user_id,
        'booking_cancelled',
        'Réservation annulée',
        format('Réservation annulée pour %s - %s le %s',
          COALESCE(v_client_name, 'Client inconnu'),
          COALESCE(v_service_name, 'Service inconnu'),
          to_char(v_booking_datetime, 'DD/MM/YYYY à HH24:MI')
        ),
        NEW.id
      );
    END IF;

  EXCEPTION WHEN OTHERS THEN
    RAISE WARNING 'Erreur lors de la création de notification: %', SQLERRM;
  END;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 5. Recréer les triggers
CREATE TRIGGER trigger_notify_booking_created
  AFTER INSERT ON bookings
  FOR EACH ROW
  EXECUTE FUNCTION notify_booking_created();

CREATE TRIGGER trigger_notify_booking_updated
  AFTER UPDATE ON bookings
  FOR EACH ROW
  EXECUTE FUNCTION notify_booking_updated();

CREATE TRIGGER trigger_notify_booking_cancelled
  AFTER UPDATE ON bookings
  FOR EACH ROW
  EXECUTE FUNCTION notify_booking_cancelled();

-- 6. Vérifier que tout fonctionne
SELECT 'Triggers créés avec succès!' as status;
