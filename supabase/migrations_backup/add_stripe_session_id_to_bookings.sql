/*
  # Ajout de stripe_session_id à la table bookings

  1. Modifications
    - Ajoute la colonne `stripe_session_id` à la table `bookings`
    - Cette colonne permet de lier une réservation à une session de paiement Stripe
    - Permet d'éviter les doublons et de tracer les paiements
    
  2. Notes
    - La colonne est nullable car les anciennes réservations n'ont pas de session Stripe
    - Un index est ajouté pour optimiser les recherches par session_id
*/

-- Ajouter la colonne stripe_session_id
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'bookings' AND column_name = 'stripe_session_id'
  ) THEN
    ALTER TABLE bookings ADD COLUMN stripe_session_id text;
    
    -- Ajouter un index pour les recherches rapides
    CREATE INDEX IF NOT EXISTS idx_bookings_stripe_session_id ON bookings(stripe_session_id);
    
    -- Ajouter un commentaire pour documenter la colonne
    COMMENT ON COLUMN bookings.stripe_session_id IS 'ID de la session Stripe Checkout utilisée pour le paiement';
  END IF;
END $$;
