/*
  # Ajout de la colonne payment_link à la table bookings

  1. Modifications
    - Ajoute la colonne `payment_link` à la table `bookings`
    - Cette colonne permet de stocker le lien de paiement Stripe généré
    - Permet de déclencher le workflow payment_link_created
    - Permet de tracer les liens de paiement envoyés aux clients
    
  2. Notes
    - La colonne est nullable car les anciennes réservations n'ont pas de lien de paiement
    - Un index est ajouté pour optimiser les recherches par payment_link
    - Type TEXT pour supporter les URLs longues
*/

-- Ajouter la colonne payment_link
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'bookings' AND column_name = 'payment_link'
  ) THEN
    ALTER TABLE bookings ADD COLUMN payment_link TEXT;
    
    -- Ajouter un index pour les recherches rapides
    CREATE INDEX IF NOT EXISTS idx_bookings_payment_link ON bookings(payment_link);
    
    -- Ajouter un commentaire pour documenter la colonne
    COMMENT ON COLUMN bookings.payment_link IS 'Lien de paiement Stripe généré pour cette réservation';
  END IF;
END $$;
