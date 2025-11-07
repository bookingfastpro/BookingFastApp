/*
  # Ajout du champ assigned_user_id aux réservations

  1. Modifications
    - Ajouter colonne `assigned_user_id` à la table `bookings`
    - Ajouter index pour les performances
    - Ajouter contrainte de clé étrangère vers `users`

  2. Sécurité
    - Maintenir les policies RLS existantes
*/

-- Ajouter la colonne assigned_user_id si elle n'existe pas
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'bookings' AND column_name = 'assigned_user_id'
  ) THEN
    ALTER TABLE bookings ADD COLUMN assigned_user_id uuid REFERENCES users(id);
  END IF;
END $$;

-- Créer un index pour les performances
CREATE INDEX IF NOT EXISTS idx_bookings_assigned_user_id ON bookings(assigned_user_id);
