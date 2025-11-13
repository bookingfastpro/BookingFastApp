/*
  # Tracking des modifications de réservation
  
  1. Modifications
    - Ajouter un trigger pour tracker les changements de champs de réservation
    - Capturer les valeurs avant/après pour date, heure, service, client, montant
    - Descriptions en français avec détails des changements
*/

-- Fonction pour logger les modifications de réservation
CREATE OR REPLACE FUNCTION log_booking_modifications()
RETURNS TRIGGER AS $$
DECLARE
  v_changes jsonb := '{}'::jsonb;
  v_description text := '';
  v_has_changes boolean := false;
BEGIN
  -- Vérifier les changements de date
  IF OLD.date IS DISTINCT FROM NEW.date THEN
    v_changes := v_changes || jsonb_build_object(
      'date', jsonb_build_object(
        'old', OLD.date,
        'new', NEW.date
      )
    );
    v_description := v_description || 'Date modifiée : ' || 
      to_char(OLD.date::date, 'DD/MM/YYYY') || ' → ' || 
      to_char(NEW.date::date, 'DD/MM/YYYY') || '. ';
    v_has_changes := true;
  END IF;

  -- Vérifier les changements d'heure
  IF OLD.time IS DISTINCT FROM NEW.time THEN
    v_changes := v_changes || jsonb_build_object(
      'time', jsonb_build_object(
        'old', OLD.time,
        'new', NEW.time
      )
    );
    v_description := v_description || 'Heure modifiée : ' || 
      substring(OLD.time from 1 for 5) || ' → ' || 
      substring(NEW.time from 1 for 5) || '. ';
    v_has_changes := true;
  END IF;

  -- Vérifier les changements de service
  IF OLD.service_id IS DISTINCT FROM NEW.service_id THEN
    v_changes := v_changes || jsonb_build_object(
      'service', jsonb_build_object(
        'old_id', OLD.service_id,
        'new_id', NEW.service_id,
        'old_name', COALESCE(
          (SELECT name FROM services WHERE id = OLD.service_id),
          (OLD.custom_service_data->>'name')
        ),
        'new_name', COALESCE(
          (SELECT name FROM services WHERE id = NEW.service_id),
          (NEW.custom_service_data->>'name')
        )
      )
    );
    v_description := v_description || 'Service modifié : ' || 
      COALESCE(
        (SELECT name FROM services WHERE id = OLD.service_id),
        (OLD.custom_service_data->>'name'),
        'Service inconnu'
      ) || ' → ' || 
      COALESCE(
        (SELECT name FROM services WHERE id = NEW.service_id),
        (NEW.custom_service_data->>'name'),
        'Service inconnu'
      ) || '. ';
    v_has_changes := true;
  END IF;

  -- Vérifier les changements de service personnalisé
  IF OLD.custom_service_data IS DISTINCT FROM NEW.custom_service_data THEN
    v_changes := v_changes || jsonb_build_object(
      'custom_service', jsonb_build_object(
        'old', OLD.custom_service_data,
        'new', NEW.custom_service_data
      )
    );
    v_description := v_description || 'Détails du service personnalisé modifiés. ';
    v_has_changes := true;
  END IF;

  -- Vérifier les changements de quantité
  IF OLD.quantity IS DISTINCT FROM NEW.quantity THEN
    v_changes := v_changes || jsonb_build_object(
      'quantity', jsonb_build_object(
        'old', OLD.quantity,
        'new', NEW.quantity
      )
    );
    v_description := v_description || 'Quantité modifiée : ' || 
      OLD.quantity || ' → ' || NEW.quantity || '. ';
    v_has_changes := true;
  END IF;

  -- Vérifier les changements de durée
  IF OLD.duration_minutes IS DISTINCT FROM NEW.duration_minutes THEN
    v_changes := v_changes || jsonb_build_object(
      'duration', jsonb_build_object(
        'old', OLD.duration_minutes,
        'new', NEW.duration_minutes
      )
    );
    v_description := v_description || 'Durée modifiée : ' || 
      OLD.duration_minutes || 'min → ' || NEW.duration_minutes || 'min. ';
    v_has_changes := true;
  END IF;

  -- Vérifier les changements de montant total
  IF OLD.total_amount IS DISTINCT FROM NEW.total_amount THEN
    v_changes := v_changes || jsonb_build_object(
      'total_amount', jsonb_build_object(
        'old', OLD.total_amount,
        'new', NEW.total_amount
      )
    );
    v_description := v_description || 'Montant total modifié : ' || 
      OLD.total_amount || '€ → ' || NEW.total_amount || '€. ';
    v_has_changes := true;
  END IF;

  -- Vérifier les changements d'informations client
  IF OLD.client_firstname IS DISTINCT FROM NEW.client_firstname OR
     OLD.client_name IS DISTINCT FROM NEW.client_name THEN
    v_changes := v_changes || jsonb_build_object(
      'client_name', jsonb_build_object(
        'old', OLD.client_firstname || ' ' || OLD.client_name,
        'new', NEW.client_firstname || ' ' || NEW.client_name
      )
    );
    v_description := v_description || 'Nom du client modifié : ' || 
      OLD.client_firstname || ' ' || OLD.client_name || ' → ' || 
      NEW.client_firstname || ' ' || NEW.client_name || '. ';
    v_has_changes := true;
  END IF;

  IF OLD.client_email IS DISTINCT FROM NEW.client_email THEN
    v_changes := v_changes || jsonb_build_object(
      'client_email', jsonb_build_object(
        'old', OLD.client_email,
        'new', NEW.client_email
      )
    );
    v_description := v_description || 'Email du client modifié. ';
    v_has_changes := true;
  END IF;

  IF OLD.client_phone IS DISTINCT FROM NEW.client_phone THEN
    v_changes := v_changes || jsonb_build_object(
      'client_phone', jsonb_build_object(
        'old', OLD.client_phone,
        'new', NEW.client_phone
      )
    );
    v_description := v_description || 'Téléphone du client modifié. ';
    v_has_changes := true;
  END IF;

  -- Vérifier les changements de transactions
  IF OLD.transactions IS DISTINCT FROM NEW.transactions THEN
    v_changes := v_changes || jsonb_build_object(
      'transactions', jsonb_build_object(
        'old', OLD.transactions,
        'new', NEW.transactions
      )
    );
    v_description := v_description || 'Transactions modifiées. ';
    v_has_changes := true;
  END IF;

  -- Si des changements ont été détectés, créer une entrée d'historique
  IF v_has_changes THEN
    INSERT INTO booking_history (
      booking_id,
      event_type,
      event_data,
      description,
      user_id
    ) VALUES (
      NEW.id,
      'booking_updated',
      v_changes,
      TRIM(v_description),
      NEW.user_id
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Créer le trigger pour les modifications
DROP TRIGGER IF EXISTS trigger_log_booking_modifications ON bookings;
CREATE TRIGGER trigger_log_booking_modifications
  AFTER UPDATE ON bookings
  FOR EACH ROW
  EXECUTE FUNCTION log_booking_modifications();
