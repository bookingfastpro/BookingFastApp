/*
  # Ajouter colonne payment_link à la table bookings

  1. Modifications
    - Ajouter la colonne `payment_link` de type TEXT à la table `bookings`
    - Cette colonne stockera les liens de paiement générés pour chaque réservation
    - La colonne est optionnelle (nullable)

  2. Notes
    - Les liens de paiement expireront après 30 minutes
    - Cette colonne permettra de retrouver et copier les liens existants
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'bookings' AND column_name = 'payment_link'
  ) THEN
    ALTER TABLE bookings ADD COLUMN payment_link TEXT;
  END IF;
END $$;
