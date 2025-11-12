/*
  # Fix notification triggers - Client name

  This migration fixes the notification trigger functions that were trying to access
  a non-existent 'name' column in the clients table. The clients table uses 
  'firstname' and 'lastname' instead.

  ## Changes
  1. Update notify_booking_created() to use firstname and lastname
  2. Update notify_booking_updated() to use firstname and lastname
*/

-- Fix notify_booking_created function
CREATE OR REPLACE FUNCTION public.notify_booking_created()
RETURNS trigger
LANGUAGE plpgsql
AS $function$
DECLARE
  v_client_name text;
  v_client_phone text;
  v_service_name text;
BEGIN
  -- Récupérer les informations du client et du service
  SELECT 
    COALESCE(c.firstname || ' ' || c.lastname, c.firstname, c.lastname, c.email),
    c.phone,
    s.name
  INTO v_client_name, v_client_phone, v_service_name
  FROM clients c
  CROSS JOIN services s
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
$function$;

-- Fix notify_booking_updated function
CREATE OR REPLACE FUNCTION public.notify_booking_updated()
RETURNS trigger
LANGUAGE plpgsql
AS $function$
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
    SELECT 
      COALESCE(c.firstname || ' ' || c.lastname, c.firstname, c.lastname, c.email),
      c.phone,
      s.name
    INTO v_client_name, v_client_phone, v_service_name
    FROM clients c
    CROSS JOIN services s
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
$function$;
