/*
  # Ajout de la colonne notes à la table bookings

  1. Modifications
    - Ajout de la colonne `notes` (TEXT, nullable) à la table `bookings`
    - Permet de stocker des notes internes sur les réservations
    - Colonne optionnelle pour ne pas impacter les réservations existantes

  2. Sécurité
    - Pas de modification des politiques RLS nécessaire
    - La colonne hérite des permissions existantes de la table
*/

-- Ajouter la colonne notes si elle n'existe pas
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'bookings' AND column_name = 'notes'
  ) THEN
    ALTER TABLE bookings ADD COLUMN notes TEXT;
    
    -- Ajouter un commentaire pour documenter la colonne
    COMMENT ON COLUMN bookings.notes IS 'Notes internes sur la réservation, visibles uniquement par l''équipe';
  END IF;
END $$;

-- Créer un index pour améliorer les recherches sur les notes (optionnel)
CREATE INDEX IF NOT EXISTS idx_bookings_notes ON bookings USING gin(to_tsvector('french', notes))
WHERE notes IS NOT NULL;
