/*
  # Ajout de colonnes manquantes à la table bookings

  1. Nouvelles colonnes
    - user_id: Propriétaire de la réservation
    - stripe_session_id: ID de session Stripe
    - payment_link_id: Lien vers payment_links
    - deposit_amount: Montant de l'acompte
    - is_deposit_multiplied: Si l'acompte est multiplié par la quantité
    - custom_service_name: Nom de service personnalisé
    - custom_service_price: Prix de service personnalisé
    - custom_service_duration: Durée de service personnalisé

  2. Modifications
    - Ajout des colonnes manquantes avec valeurs par défaut
*/

-- Ajouter user_id
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'bookings' AND column_name = 'user_id'
  ) THEN
    ALTER TABLE bookings ADD COLUMN user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;
  END IF;
END $$;

-- Ajouter stripe_session_id
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'bookings' AND column_name = 'stripe_session_id'
  ) THEN
    ALTER TABLE bookings ADD COLUMN stripe_session_id text;
  END IF;
END $$;

-- Ajouter payment_link_id
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'bookings' AND column_name = 'payment_link_id'
  ) THEN
    ALTER TABLE bookings ADD COLUMN payment_link_id uuid REFERENCES payment_links(id) ON DELETE SET NULL;
  END IF;
END $$;

-- Ajouter deposit_amount
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'bookings' AND column_name = 'deposit_amount'
  ) THEN
    ALTER TABLE bookings ADD COLUMN deposit_amount numeric(10,2) DEFAULT 0;
  END IF;
END $$;

-- Ajouter is_deposit_multiplied
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'bookings' AND column_name = 'is_deposit_multiplied'
  ) THEN
    ALTER TABLE bookings ADD COLUMN is_deposit_multiplied boolean DEFAULT false;
  END IF;
END $$;

-- Ajouter custom_service_name
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'bookings' AND column_name = 'custom_service_name'
  ) THEN
    ALTER TABLE bookings ADD COLUMN custom_service_name text;
  END IF;
END $$;

-- Ajouter custom_service_price
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'bookings' AND column_name = 'custom_service_price'
  ) THEN
    ALTER TABLE bookings ADD COLUMN custom_service_price numeric(10,2);
  END IF;
END $$;

-- Ajouter custom_service_duration
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'bookings' AND column_name = 'custom_service_duration'
  ) THEN
    ALTER TABLE bookings ADD COLUMN custom_service_duration integer;
  END IF;
END $$;

-- Ajouter category_id aux services
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'services' AND column_name = 'category_id'
  ) THEN
    ALTER TABLE services ADD COLUMN category_id uuid REFERENCES service_categories(id) ON DELETE SET NULL;
  END IF;
END $$;

-- Ajouter user_id aux services
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'services' AND column_name = 'user_id'
  ) THEN
    ALTER TABLE services ADD COLUMN user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;
  END IF;
END $$;

-- Ajouter is_active aux services
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'services' AND column_name = 'is_active'
  ) THEN
    ALTER TABLE services ADD COLUMN is_active boolean DEFAULT true;
  END IF;
END $$;

-- Ajouter require_deposit aux services
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'services' AND column_name = 'require_deposit'
  ) THEN
    ALTER TABLE services ADD COLUMN require_deposit boolean DEFAULT false;
  END IF;
END $$;

-- Ajouter deposit_amount aux services
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'services' AND column_name = 'deposit_amount'
  ) THEN
    ALTER TABLE services ADD COLUMN deposit_amount numeric(10,2);
  END IF;
END $$;

-- Ajouter multiply_deposit_by_quantity aux business_settings
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'business_settings' AND column_name = 'multiply_deposit_by_quantity'
  ) THEN
    ALTER TABLE business_settings ADD COLUMN multiply_deposit_by_quantity boolean DEFAULT false;
  END IF;
END $$;

-- Ajouter tax_rate aux business_settings
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'business_settings' AND column_name = 'tax_rate'
  ) THEN
    ALTER TABLE business_settings ADD COLUMN tax_rate numeric(5,2) DEFAULT 20.00;
  END IF;
END $$;

-- Créer des index
CREATE INDEX IF NOT EXISTS idx_bookings_user_id ON bookings(user_id);
CREATE INDEX IF NOT EXISTS idx_bookings_stripe_session_id ON bookings(stripe_session_id);
CREATE INDEX IF NOT EXISTS idx_bookings_payment_link_id ON bookings(payment_link_id);
CREATE INDEX IF NOT EXISTS idx_services_user_id ON services(user_id);
CREATE INDEX IF NOT EXISTS idx_services_category_id ON services(category_id);