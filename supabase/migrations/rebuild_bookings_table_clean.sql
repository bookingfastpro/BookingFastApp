/*
  # Reconstruction complète de la table bookings
  
  1. Sauvegarde des données
  2. Suppression complète de la table
  3. Recréation propre sans aucun trigger/constraint problématique
  4. Restauration des données
  5. RLS simple et propre
*/

-- 1. Créer une table temporaire pour sauvegarder les données
CREATE TABLE IF NOT EXISTS bookings_backup AS 
SELECT * FROM bookings;

-- 2. Supprimer COMPLÈTEMENT la table bookings (cascade pour tout supprimer)
DROP TABLE IF EXISTS bookings CASCADE;

-- 3. Recréer la table PROPREMENT
CREATE TABLE bookings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  service_id uuid NOT NULL REFERENCES services(id) ON DELETE CASCADE,
  date date NOT NULL,
  time time NOT NULL,
  duration_minutes integer NOT NULL,
  quantity integer NOT NULL DEFAULT 1,
  client_name text NOT NULL,
  client_firstname text NOT NULL,
  client_email text NOT NULL,
  client_phone text NOT NULL,
  total_amount numeric(10,2) NOT NULL,
  payment_status text NOT NULL DEFAULT 'pending' CHECK (payment_status IN ('pending', 'partial', 'completed')),
  payment_amount numeric(10,2) DEFAULT 0,
  transactions jsonb DEFAULT '[]'::jsonb,
  booking_status text DEFAULT 'pending' CHECK (booking_status IN ('pending', 'confirmed', 'cancelled')),
  assigned_user_id uuid REFERENCES auth.users(id),
  notes text,
  custom_service_data jsonb,
  google_calendar_event_id text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 4. Index pour les performances
CREATE INDEX idx_bookings_user_id ON bookings(user_id);
CREATE INDEX idx_bookings_service_id ON bookings(service_id);
CREATE INDEX idx_bookings_date ON bookings(date);
CREATE INDEX idx_bookings_assigned_user ON bookings(assigned_user_id);

-- 5. Trigger pour updated_at (SANS substring !)
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_bookings_updated_at
  BEFORE UPDATE ON bookings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- 6. Enable RLS
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;

-- 7. Policies SIMPLES (sans substring !)
CREATE POLICY "bookings_select"
  ON bookings FOR SELECT
  TO authenticated
  USING (
    user_id = auth.uid() OR 
    EXISTS (
      SELECT 1 FROM team_members 
      WHERE team_members.user_id = auth.uid() 
        AND team_members.owner_id = bookings.user_id 
        AND team_members.is_active = true
    )
  );

CREATE POLICY "bookings_insert"
  ON bookings FOR INSERT
  TO authenticated
  WITH CHECK (
    user_id = auth.uid() OR 
    EXISTS (
      SELECT 1 FROM team_members 
      WHERE team_members.user_id = auth.uid() 
        AND team_members.owner_id = bookings.user_id 
        AND team_members.is_active = true
    )
  );

CREATE POLICY "bookings_update"
  ON bookings FOR UPDATE
  TO authenticated
  USING (
    user_id = auth.uid() OR 
    EXISTS (
      SELECT 1 FROM team_members 
      WHERE team_members.user_id = auth.uid() 
        AND team_members.owner_id = bookings.user_id 
        AND team_members.is_active = true
    )
  )
  WITH CHECK (
    user_id = auth.uid() OR 
    EXISTS (
      SELECT 1 FROM team_members 
      WHERE team_members.user_id = auth.uid() 
        AND team_members.owner_id = bookings.user_id 
        AND team_members.is_active = true
    )
  );

CREATE POLICY "bookings_delete"
  ON bookings FOR DELETE
  TO authenticated
  USING (
    user_id = auth.uid() OR 
    EXISTS (
      SELECT 1 FROM team_members 
      WHERE team_members.user_id = auth.uid() 
        AND team_members.owner_id = bookings.user_id 
        AND team_members.is_active = true
    )
  );

-- 8. Restaurer les données
INSERT INTO bookings 
SELECT * FROM bookings_backup;

-- 9. Supprimer la sauvegarde
DROP TABLE bookings_backup;

-- 10. Vérification finale
DO $$
BEGIN
  RAISE NOTICE 'Table bookings reconstruite avec succès !';
  RAISE NOTICE 'Nombre de réservations restaurées: %', (SELECT COUNT(*) FROM bookings);
END $$;
