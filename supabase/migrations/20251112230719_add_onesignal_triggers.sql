/*
  # Mise à jour des triggers pour envoyer les notifications OneSignal

  1. Modifications
    - Mise à jour de la fonction create_booking_notification pour appeler l'Edge Function OneSignal
    - Ajout de la fonction send_onesignal_push pour envoyer les notifications push
    - Modification des triggers existants pour inclure l'envoi de notifications push avec actions

  2. Actions des notifications
    - Nouvelle réservation: "Voir" et "Appeler client"
    - Modification: "Voir changements" et "Confirmer"
    - Annulation: "Voir détails" et "Contacter client"

  3. Notes
    - Les notifications push sont envoyées de manière asynchrone
    - L'échec d'envoi de la notification push ne bloque pas la création de la notification dans la base
    - Les actions redirigent vers l'application avec les paramètres appropriés
*/

-- Fonction pour envoyer une notification push via OneSignal
CREATE OR REPLACE FUNCTION send_onesignal_push(
  p_user_id uuid,
  p_title text,
  p_message text,
  p_booking_id uuid,
  p_action_type text,
  p_client_phone text DEFAULT NULL
)
RETURNS void AS $$
DECLARE
  v_player_id text;
  v_app_url text;
  v_buttons jsonb;
BEGIN
  -- Récupérer le player ID de l'utilisateur
  SELECT onesignal_player_id INTO v_player_id
  FROM profiles
  WHERE id = p_user_id
    AND push_notifications_enabled = true
    AND onesignal_player_id IS NOT NULL;

  -- Si pas de player ID, ne rien faire
  IF v_player_id IS NULL THEN
    RETURN;
  END IF;

  -- URL de base de l'application
  v_app_url := current_setting('app.settings.base_url', true);
  IF v_app_url IS NULL THEN
    v_app_url := '';
  END IF;

  -- Définir les boutons d'action selon le type
  CASE p_action_type
    WHEN 'booking_created' THEN
      v_buttons := jsonb_build_array(
        jsonb_build_object(
          'id', 'view',
          'text', 'Voir',
          'url', v_app_url || '/calendar?bookingId=' || p_booking_id::text
        ),
        jsonb_build_object(
          'id', 'call',
          'text', 'Appeler',
          'url', 'tel:' || COALESCE(p_client_phone, '')
        )
      );
    WHEN 'booking_updated' THEN
      v_buttons := jsonb_build_array(
        jsonb_build_object(
          'id', 'view',
          'text', 'Voir changements',
          'url', v_app_url || '/calendar?bookingId=' || p_booking_id::text
        ),
        jsonb_build_object(
          'id', 'confirm',
          'text', 'Confirmer',
          'url', v_app_url || '/calendar?bookingId=' || p_booking_id::text || '&action=confirm'
        )
      );
    WHEN 'booking_cancelled' THEN
      v_buttons := jsonb_build_array(
        jsonb_build_object(
          'id', 'view',
          'text', 'Voir détails',
          'url', v_app_url || '/calendar?bookingId=' || p_booking_id::text
        ),
        jsonb_build_object(
          'id', 'contact',
          'text', 'Contacter',
          'url', v_app_url || '/calendar?bookingId=' || p_booking_id::text || '&action=contact'
        )
      );
    ELSE
      v_buttons := jsonb_build_array(
        jsonb_build_object(
          'id', 'view',
          'text', 'Voir',
          'url', v_app_url || '/calendar?bookingId=' || p_booking_id::text
        )
      );
  END CASE;

  -- Appeler l'Edge Function de manière asynchrone (ne pas attendre la réponse)
  PERFORM net.http_post(
    url := current_setting('app.settings.supabase_url', true) || '/functions/v1/send-onesignal-notification',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key', true)
    ),
    body := jsonb_build_object(
      'playerId', v_player_id,
      'title', p_title,
      'message', p_message,
      'data', jsonb_build_object(
        'bookingId', p_booking_id::text,
        'type', p_action_type,
        'clientPhone', COALESCE(p_client_phone, '')
      ),
      'buttons', v_buttons
    )
  );

EXCEPTION
  WHEN OTHERS THEN
    -- Logger l'erreur mais ne pas bloquer
    RAISE WARNING 'Failed to send OneSignal notification: %', SQLERRM;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Mettre à jour la fonction notify_booking_created pour inclure OneSignal
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

  -- Envoyer la notification push OneSignal
  PERFORM send_onesignal_push(
    NEW.user_id,
    'Nouvelle réservation',
    format('Réservation créée pour %s - %s le %s',
      COALESCE(v_client_name, 'Client inconnu'),
      COALESCE(v_service_name, 'Service inconnu'),
      to_char(NEW.start_time, 'DD/MM/YYYY à HH24:MI')
    ),
    NEW.id,
    'booking_created',
    v_client_phone
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Mettre à jour la fonction notify_booking_updated pour inclure OneSignal
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

    -- Envoyer la notification push OneSignal
    PERFORM send_onesignal_push(
      NEW.user_id,
      'Réservation modifiée',
      format('Réservation modifiée pour %s - %s le %s',
        COALESCE(v_client_name, 'Client inconnu'),
        COALESCE(v_service_name, 'Service inconnu'),
        to_char(NEW.start_time, 'DD/MM/YYYY à HH24:MI')
      ),
      NEW.id,
      'booking_updated',
      v_client_phone
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Mettre à jour la fonction notify_booking_cancelled pour inclure OneSignal
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

    -- Envoyer la notification push OneSignal
    PERFORM send_onesignal_push(
      NEW.user_id,
      'Réservation annulée',
      format('Réservation annulée pour %s - %s le %s',
        COALESCE(v_client_name, 'Client inconnu'),
        COALESCE(v_service_name, 'Service inconnu'),
        to_char(NEW.start_time, 'DD/MM/YYYY à HH24:MI')
      ),
      NEW.id,
      'booking_cancelled',
      v_client_phone
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
