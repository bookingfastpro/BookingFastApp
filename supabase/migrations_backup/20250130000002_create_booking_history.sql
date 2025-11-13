/*
  # Système d'historique des réservations

  1. Nouvelle table
    - `booking_history` : Stocke tous les événements liés aux réservations
      - `id` (uuid, primary key)
      - `booking_id` (uuid, foreign key vers bookings)
      - `event_type` (text) : Type d'événement (status_change, payment_added, online_confirmation, etc.)
      - `event_data` (jsonb) : Données détaillées de l'événement
      - `description` (text) : Description en français de l'événement
      - `created_at` (timestamptz) : Horodatage précis
      - `user_id` (uuid) : Utilisateur qui a effectué l'action (nullable pour actions système)

  2. Triggers
    - Trigger sur UPDATE de bookings pour capturer les changements de statut
    - Trigger sur INSERT de transactions pour capturer les paiements

  3. Fonction RPC
    - `get_booking_history` : Récupère l'historique complet d'une réservation

  4. Sécurité
    - RLS activé sur booking_history
    - Politiques pour lecture par le propriétaire
*/

-- Créer la table booking_history
CREATE TABLE IF NOT EXISTS booking_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id uuid NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  event_type text NOT NULL,
  event_data jsonb DEFAULT '{}'::jsonb,
  description text NOT NULL,
  created_at timestamptz DEFAULT now(),
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  CONSTRAINT valid_event_type CHECK (event_type IN (
    'created',
    'status_change',
    'payment_added',
    'payment_updated',
    'online_confirmation',
    'booking_updated',
    'note_added',
    'note_updated',
    'assigned_user_changed'
  ))
);

-- Index pour améliorer les performances
CREATE INDEX IF NOT EXISTS idx_booking_history_booking_id ON booking_history(booking_id);
CREATE INDEX IF NOT EXISTS idx_booking_history_created_at ON booking_history(created_at DESC);

-- Activer RLS
ALTER TABLE booking_history ENABLE ROW LEVEL SECURITY;

-- Politique de lecture : propriétaire ou membre de l'équipe
CREATE POLICY "Users can read their booking history"
  ON booking_history
  FOR SELECT
  TO authenticated
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

-- Politique d'insertion : système ou utilisateur authentifié
CREATE POLICY "Authenticated users can insert booking history"
  ON booking_history
  FOR INSERT
  TO authenticated
  WITH CHECK (
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

-- Fonction pour créer une entrée d'historique lors de la création d'une réservation
CREATE OR REPLACE FUNCTION log_booking_creation()
RETURNS TRIGGER AS $$
BEGIN
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
      'service_name', (SELECT name FROM services WHERE id = NEW.service_id),
      'date', NEW.date,
      'time', NEW.time,
      'client_name', NEW.client_firstname || ' ' || NEW.client_name,
      'total_amount', NEW.total_amount
    ),
    'Réservation créée',
    NEW.user_id
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fonction pour logger les changements de statut
CREATE OR REPLACE FUNCTION log_booking_status_change()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.booking_status IS DISTINCT FROM NEW.booking_status THEN
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
          'Le statut a été changé de en attente à confirmé'
        WHEN OLD.booking_status = 'confirmed' AND NEW.booking_status = 'cancelled' THEN
          'Le statut a été changé de confirmé à annulé'
        WHEN OLD.booking_status = 'cancelled' AND NEW.booking_status = 'confirmed' THEN
          'Le statut a été changé de annulé à confirmé'
        WHEN OLD.booking_status = 'pending' AND NEW.booking_status = 'cancelled' THEN
          'Le statut a été changé de en attente à annulé'
        WHEN OLD.booking_status = 'cancelled' AND NEW.booking_status = 'pending' THEN
          'Le statut a été changé de annulé à en attente'
        WHEN OLD.booking_status = 'confirmed' AND NEW.booking_status = 'pending' THEN
          'Le statut a été changé de confirmé à en attente'
        ELSE
          'Le statut a été changé de ' || OLD.booking_status || ' à ' || NEW.booking_status
      END,
      NEW.user_id
    );
  END IF;

  -- Logger les changements de notes
  IF OLD.notes IS DISTINCT FROM NEW.notes THEN
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

  -- Logger les changements d'utilisateur assigné
  IF OLD.assigned_user_id IS DISTINCT FROM NEW.assigned_user_id THEN
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

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fonction pour logger les ajouts de transactions
CREATE OR REPLACE FUNCTION log_transaction_added()
RETURNS TRIGGER AS $$
DECLARE
  v_method_text text;
BEGIN
  -- Convertir le type de paiement en texte français
  v_method_text := CASE NEW.method
    WHEN 'cash' THEN 'espèces'
    WHEN 'card' THEN 'carte bancaire'
    WHEN 'check' THEN 'chèque'
    WHEN 'transfer' THEN 'virement'
    WHEN 'stripe' THEN 'Stripe'
    ELSE NEW.method
  END;

  INSERT INTO booking_history (
    booking_id,
    event_type,
    event_data,
    description,
    user_id
  )
  SELECT 
    b.id,
    'payment_added',
    jsonb_build_object(
      'transaction_id', NEW.id,
      'amount', NEW.amount,
      'method', NEW.method,
      'status', NEW.status,
      'note', NEW.note
    ),
    'Une transaction de ' || NEW.amount || '€ en ' || v_method_text || ' a été ajoutée',
    b.user_id
  FROM bookings b
  WHERE b.id = (
    SELECT booking_id 
    FROM jsonb_array_elements(b.transactions) AS t
    WHERE (t->>'id')::uuid = NEW.id
    LIMIT 1
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Créer les triggers
DROP TRIGGER IF EXISTS trigger_log_booking_creation ON bookings;
CREATE TRIGGER trigger_log_booking_creation
  AFTER INSERT ON bookings
  FOR EACH ROW
  EXECUTE FUNCTION log_booking_creation();

DROP TRIGGER IF EXISTS trigger_log_booking_status_change ON bookings;
CREATE TRIGGER trigger_log_booking_status_change
  AFTER UPDATE ON bookings
  FOR EACH ROW
  EXECUTE FUNCTION log_booking_status_change();

-- Fonction RPC pour récupérer l'historique d'une réservation
CREATE OR REPLACE FUNCTION get_booking_history(booking_id_param uuid)
RETURNS TABLE (
  id uuid,
  event_type text,
  event_data jsonb,
  description text,
  created_at timestamptz,
  user_email text
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    bh.id,
    bh.event_type,
    bh.event_data,
    bh.description,
    bh.created_at,
    u.email as user_email
  FROM booking_history bh
  LEFT JOIN auth.users u ON u.id = bh.user_id
  WHERE bh.booking_id = booking_id_param
  ORDER BY bh.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Créer des entrées d'historique pour les réservations existantes
INSERT INTO booking_history (booking_id, event_type, event_data, description, created_at, user_id)
SELECT 
  id,
  'created',
  jsonb_build_object(
    'service_name', COALESCE(
      (SELECT name FROM services WHERE id = bookings.service_id),
      (custom_service_data->>'name')
    ),
    'date', date,
    'time', time,
    'client_name', client_firstname || ' ' || client_name,
    'total_amount', total_amount
  ),
  'Réservation créée',
  created_at,
  user_id
FROM bookings
WHERE NOT EXISTS (
  SELECT 1 FROM booking_history 
  WHERE booking_history.booking_id = bookings.id 
  AND booking_history.event_type = 'created'
);

-- Ajouter un commentaire sur la table
COMMENT ON TABLE booking_history IS 'Historique complet de toutes les modifications apportées aux réservations';
