/*
  # Correction du schéma bookings - Ajout des colonnes manquantes
  
  1. Colonnes ajoutées
    - service_id (uuid, clé étrangère vers services)
    - user_id (uuid, clé étrangère vers auth.users)
    - deposit_amount (numeric, montant de l'acompte)
    - stripe_payment_intent_id (text, ID Stripe)
    - stripe_customer_id (text, Client Stripe)
  
  2. Sécurité
    - Contraintes de clés étrangères
    - Index pour performances
*/

-- ============================================================================
-- AJOUT DES COLONNES MANQUANTES
-- ============================================================================

-- 1️⃣ service_id (CRITIQUE - relation avec services)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'bookings' AND column_name = 'service_id'
  ) THEN
    ALTER TABLE bookings ADD COLUMN service_id uuid REFERENCES services(id) ON DELETE CASCADE;
    CREATE INDEX IF NOT EXISTS idx_bookings_service_id ON bookings(service_id);
  END IF;
END $$;

-- 2️⃣ user_id (CRITIQUE - propriétaire de la réservation)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'bookings' AND column_name = 'user_id'
  ) THEN
    ALTER TABLE bookings ADD COLUMN user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;
    CREATE INDEX IF NOT EXISTS idx_bookings_user_id ON bookings(user_id);
  END IF;
END $$;

-- 3️⃣ deposit_amount (CRITIQUE - montant de l'acompte payé)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'bookings' AND column_name = 'deposit_amount'
  ) THEN
    ALTER TABLE bookings ADD COLUMN deposit_amount numeric(10,2) DEFAULT 0;
  END IF;
END $$;

-- 4️⃣ stripe_payment_intent_id (ID du paiement Stripe)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'bookings' AND column_name = 'stripe_payment_intent_id'
  ) THEN
    ALTER TABLE bookings ADD COLUMN stripe_payment_intent_id text;
    CREATE INDEX IF NOT EXISTS idx_bookings_stripe_payment_intent ON bookings(stripe_payment_intent_id);
  END IF;
END $$;

-- 5️⃣ stripe_customer_id (ID du client Stripe)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'bookings' AND column_name = 'stripe_customer_id'
  ) THEN
    ALTER TABLE bookings ADD COLUMN stripe_customer_id text;
  END IF;
END $$;

-- ============================================================================
-- VÉRIFICATION FINALE
-- ============================================================================

-- Afficher toutes les colonnes après migration
SELECT 
  column_name, 
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'bookings' 
ORDER BY ordinal_position;
