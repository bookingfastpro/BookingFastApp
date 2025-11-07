/*
  # Correction complète du système d'historique des réservations

  1. Corrections
    - Recréer les triggers avec SECURITY DEFINER
    - Simplifier les politiques RLS
    - Ajouter des logs de debug
    - Corriger la fonction get_booking_history

  2. Sécurité
    - Maintenir l'accès contrôlé
    - Permettre l'insertion système
*/

-- 1. Supprimer les anciens triggers
DROP TRIGGER IF EXISTS trigger_log_booking_creation ON bookings;
DROP TRIGGER IF EXISTS trigger_log_booking_status_change ON bookings;

-- 2. Supprimer les anciennes fonctions
DROP FUNCTION IF EXISTS log_booking_creation();
DROP FUNCTION IF EXISTS log_booking_status_change();
DROP FUNCTION IF EXISTS log_transaction_added();

-- 3. Recréer la fonction de création d'historique
CREATE OR REPLACE FUNCTION log_booking_creation()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  -- Log pour debug
  RAISE NOTICE 'Trigger log_booking_creation appelé pour booking_id: %', NEW.id;
  
  INSERT INTO booking_history (
    booking_id,
    event_type,
    event_data,
    description,
    user_id
  ) VALUES (
    NEW.id,
    'created',
    jsonb_build_object(
      'service_id', NEW.service_id,
      'date', NEW.date,
      'time', NEW.time,
      'client_name', NEW.client_firstname || ' ' || NEW.client_name,
      'total_amount', NEW.total_amount,
      'quantity', NEW.quantity
    ),
    'Réservation créée',
    NEW.user_id
  );
  
  RAISE NOTICE 'Historique créé avec succès pour booking_id: %', NEW.id;
  
  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  RAISE WARNING 'Erreur dans log_booking_creation: %', SQLERRM;
  RETURN NEW;
END;
$$;

-- 4. Recréer la fonction de changement de statut
CREATE OR REPLACE FUNCTION log_booking_status_change()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  -- Log changement de statut
  IF OLD.booking_status IS DISTINCT FROM NEW.booking_status THEN
    RAISE NOTICE 'Changement statut détecté: % -> %', OLD.booking_status, NEW.booking_status;
    
    INSERT INTO booking_history (
      booking_id,
      event_type,
      event_data,
      description,
      user_id
    ) VALUES (
      NEW.id,
      'status_change',
      jsonb_build_object(
        'old_status', OLD.booking_status,
        'new_status', NEW.booking_status
      ),
      CASE 
        WHEN OLD.booking_status = 'pending' AND NEW.booking_status = 'confirmed' THEN
          'Statut changé de en attente à confirmé'
        WHEN OLD.booking_status = 'confirmed' AND NEW.booking_status = 'cancelled' THEN
          'Statut changé de confirmé à annulé'
        WHEN OLD.booking_status = 'cancelled' AND NEW.booking_status = 'confirmed' THEN
          'Statut changé de annulé à confirmé'
        ELSE
          'Statut changé de ' || OLD.booking_status || ' à ' || NEW.booking_status
      END,
      NEW.user_id
    );
  END IF;

  -- Log changement de notes
  IF OLD.notes IS DISTINCT FROM NEW.notes THEN
    RAISE NOTICE 'Changement notes détecté';
    
    INSERT INTO booking_history (
      booking_id,
      event_type,
      event_data,
      description,
      user_id
    ) VALUES (
      NEW.id,
      CASE 
        WHEN OLD.notes IS NULL THEN 'note_added'
        ELSE 'note_updated'
      END,
      jsonb_build_object(
        'old_note', OLD.notes,
        'new_note', NEW.notes
      ),
      CASE 
        WHEN OLD.notes IS NULL THEN 'Note interne ajoutée'
        ELSE 'Note interne modifiée'
      END,
      NEW.user_id
    );
  END IF;

  -- Log changement utilisateur assigné
  IF OLD.assigned_user_id IS DISTINCT FROM NEW.assigned_user_id THEN
    RAISE NOTICE 'Changement utilisateur assigné détecté';
    
    INSERT INTO booking_history (
      booking_id,
      event_type,
      event_data,
      description,
      user_id
    ) VALUES (
      NEW.id,
      'assigned_user_changed',
      jsonb_build_object(
        'old_user_id', OLD.assigned_user_id,
        'new_user_id', NEW.assigned_user_id
      ),
      CASE 
        WHEN OLD.assigned_user_id IS NULL THEN 'Utilisateur assigné'
        WHEN NEW.assigned_user_id IS NULL THEN 'Assignation retirée'
        ELSE 'Utilisateur assigné modifié'
      END,
      NEW.user_id
    );
  END IF;

  -- Log autres changements importants
  IF OLD.date IS DISTINCT FROM NEW.date 
     OR OLD.time IS DISTINCT FROM NEW.time 
     OR OLD.service_id IS DISTINCT FROM NEW.service_id 
     OR OLD.quantity IS DISTINCT FROM NEW.quantity THEN
    
    RAISE NOTICE 'Changements détectés dans la réservation';
    
    INSERT INTO booking_history (
      booking_id,
      event_type,
      event_data,
      description,
      user_id
    ) VALUES (
      NEW.id,
      'booking_updated',
      jsonb_build_object(
        'date', jsonb_build_object('old', OLD.date, 'new', NEW.date),
        'time', jsonb_build_object('old', OLD.time, 'new', NEW.time),
        'service_id', jsonb_build_object('old', OLD.service_id, 'new', NEW.service_id),
        'quantity', jsonb_build_object('old', OLD.quantity, 'new', NEW.quantity)
      ),
      'Réservation modifiée',
      NEW.user_id
    );
  END IF;

  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  RAISE WARNING 'Erreur dans log_booking_status_change: %', SQLERRM;
  RETURN NEW;
END;
$$;

-- 5. Recréer les triggers
CREATE TRIGGER trigger_log_booking_creation
  AFTER INSERT ON bookings
  FOR EACH ROW
  EXECUTE FUNCTION log_booking_creation();

CREATE TRIGGER trigger_log_booking_status_change
  AFTER UPDATE ON bookings
  FOR EACH ROW
  EXECUTE FUNCTION log_booking_status_change();

-- 6. Simplifier les politiques RLS sur booking_history
DROP POLICY IF EXISTS "Users can read their booking history" ON booking_history;
DROP POLICY IF EXISTS "Authenticated users can insert booking history" ON booking_history;

-- Politique de lecture simplifiée
CREATE POLICY "Enable read for booking owners"
  ON booking_history
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM bookings b
      WHERE b.id = booking_history.booking_id
      AND (
        b.user_id = auth.uid()
        OR EXISTS (
          SELECT 1 FROM team_members tm
          WHERE tm.owner_id = b.user_id
          AND tm.user_id = auth.uid()
          AND tm.is_active = true
        )
      )
    )
  );

-- Politique d'insertion pour le système (SECURITY DEFINER)
CREATE POLICY "Enable insert for system"
  ON booking_history
  FOR INSERT
  WITH CHECK (true);

-- 7. Corriger la fonction RPC get_booking_history
CREATE OR REPLACE FUNCTION get_booking_history(booking_id_param uuid)
RETURNS TABLE (
  id uuid,
  event_type text,
  event_data jsonb,
  description text,
  created_at timestamptz,
  user_email text
)
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  -- Log pour debug
  RAISE NOTICE 'get_booking_history appelé pour booking_id: %', booking_id_param;
  
  RETURN QUERY
  SELECT 
    bh.id,
    bh.event_type,
    bh.event_data,
    bh.description,
    bh.created_at,
    COALESCE(u.email, 'Système') as user_email
  FROM booking_history bh
  LEFT JOIN auth.users u ON u.id = bh.user_id
  WHERE bh.booking_id = booking_id_param
  ORDER BY bh.created_at DESC;
  
  RAISE NOTICE 'Nombre de lignes retournées: %', (SELECT COUNT(*) FROM booking_history WHERE booking_id = booking_id_param);
END;
$$;

-- 8. Créer des entrées d'historique pour les réservations existantes sans historique
INSERT INTO booking_history (booking_id, event_type, event_data, description, created_at, user_id)
SELECT 
  b.id,
  'created',
  jsonb_build_object(
    'service_id', b.service_id,
    'date', b.date,
    'time', b.time,
    'client_name', b.client_firstname || ' ' || b.client_name,
    'total_amount', b.total_amount,
    'quantity', b.quantity
  ),
  'Réservation créée',
  b.created_at,
  b.user_id
FROM bookings b
WHERE NOT EXISTS (
  SELECT 1 FROM booking_history bh
  WHERE bh.booking_id = b.id
  AND bh.event_type = 'created'
)
ON CONFLICT DO NOTHING;

-- 9. Ajouter des commentaires
COMMENT ON FUNCTION log_booking_creation() IS 'Crée une entrée d''historique lors de la création d''une réservation';
COMMENT ON FUNCTION log_booking_status_change() IS 'Crée des entrées d''historique lors des modifications d''une réservation';
COMMENT ON FUNCTION get_booking_history(uuid) IS 'Récupère l''historique complet d''une réservation';
