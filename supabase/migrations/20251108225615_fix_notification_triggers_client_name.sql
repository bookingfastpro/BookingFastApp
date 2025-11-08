/*
  # Fix notification triggers - client name

  1. Changes
    - Fix `notify_booking_created` function to use `firstname` and `lastname` instead of `name`
    - Fix `notify_booking_updated` function to use `firstname` and `lastname` instead of `name`
    - Fix `notify_booking_cancelled` function to use `firstname` and `lastname` instead of `name`
  
  2. Notes
    - The `clients` table has `firstname` and `lastname` columns, not a `name` column
    - This was causing a SQL error: "column c.name does not exist"
*/

-- Fix notify_booking_created function
CREATE OR REPLACE FUNCTION notify_booking_created()
RETURNS trigger AS $$
DECLARE
  v_client_name text;
  v_service_name text;
BEGIN
  -- Récupérer les informations du client et du service
  SELECT CONCAT(c.firstname, ' ', c.lastname), s.name
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

-- Fix notify_booking_updated function
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
    SELECT CONCAT(c.firstname, ' ', c.lastname), s.name
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

-- Fix notify_booking_cancelled function
CREATE OR REPLACE FUNCTION notify_booking_cancelled()
RETURNS trigger AS $$
DECLARE
  v_client_name text;
  v_service_name text;
BEGIN
  -- Notifier uniquement si le statut passe à cancelled
  IF OLD.status != 'cancelled' AND NEW.status = 'cancelled' THEN

    -- Récupérer les informations du client et du service
    SELECT CONCAT(c.firstname, ' ', c.lastname), s.name
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
