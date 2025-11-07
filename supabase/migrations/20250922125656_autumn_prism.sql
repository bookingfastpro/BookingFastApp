/*
  # Ajouter le statut de réservation

  1. Modifications
    - Ajouter la colonne `booking_status` à la table `bookings`
    - Valeurs possibles: 'pending' (en attente) ou 'confirmed' (confirmée)
    - Valeur par défaut: 'pending'

  2. Migration des données existantes
    - Toutes les réservations existantes passent en statut 'pending'
*/

-- Ajouter la colonne booking_status
ALTER TABLE bookings 
ADD COLUMN IF NOT EXISTS booking_status text DEFAULT 'pending' CHECK (booking_status IN ('pending', 'confirmed'));

-- Mettre à jour les réservations existantes
UPDATE bookings 
SET booking_status = 'pending' 
WHERE booking_status IS NULL;
