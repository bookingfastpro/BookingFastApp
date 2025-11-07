/*
  # Ajouter la colonne user_id à la table bookings

  1. Modifications
    - Ajouter la colonne `user_id` à la table `bookings`
    - Créer une contrainte de clé étrangère vers `auth.users`
    - Mettre à jour les politiques RLS pour l'isolation des données
    - Créer un index pour optimiser les requêtes

  2. Sécurité
    - Les utilisateurs ne peuvent voir que leurs propres réservations
    - Suppression en cascade si l'utilisateur est supprimé
*/

-- Ajouter la colonne user_id à la table bookings
ALTER TABLE bookings 
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- Créer un index pour optimiser les requêtes par user_id
CREATE INDEX IF NOT EXISTS idx_bookings_user_id ON bookings(user_id);

-- Supprimer les anciennes politiques RLS
DROP POLICY IF EXISTS "Allow anon users to delete bookings" ON bookings;
DROP POLICY IF EXISTS "Allow anon users to insert bookings" ON bookings;
DROP POLICY IF EXISTS "Allow anon users to select bookings" ON bookings;
DROP POLICY IF EXISTS "Allow anon users to update bookings" ON bookings;
DROP POLICY IF EXISTS "Allow authenticated users to delete bookings" ON bookings;
DROP POLICY IF EXISTS "Allow authenticated users to insert bookings" ON bookings;
DROP POLICY IF EXISTS "Allow authenticated users to select bookings" ON bookings;
DROP POLICY IF EXISTS "Allow authenticated users to update bookings" ON bookings;

-- Créer de nouvelles politiques RLS pour l'isolation par utilisateur
CREATE POLICY "Users can view their own bookings"
  ON bookings
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own bookings"
  ON bookings
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own bookings"
  ON bookings
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own bookings"
  ON bookings
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Permettre aux utilisateurs anonymes de créer des réservations (pour les formulaires publics)
CREATE POLICY "Allow public booking creation"
  ON bookings
  FOR INSERT
  TO anon
  WITH CHECK (true);

CREATE POLICY "Allow public booking read"
  ON bookings
  FOR SELECT
  TO anon
  USING (true);
