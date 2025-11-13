/*
  # Ajout de TOUTES les colonnes manquantes

  1. Tables modifiées
    - bookings: booking_status, payment_link
    - business_settings: nombreuses colonnes de configuration
    - services: unit_name
    - company_info: pdf_accent_color, pdf_text_color
    - invoice_payments: user_id, reference

  2. Sécurité
    - Maintien des politiques RLS existantes
*/

-- ============================================================================
-- BOOKINGS - Colonnes manquantes
-- ============================================================================

-- Ajouter booking_status
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'bookings' AND column_name = 'booking_status'
  ) THEN
    ALTER TABLE bookings ADD COLUMN booking_status text DEFAULT 'confirmed' CHECK (booking_status IN ('pending', 'confirmed', 'cancelled'));
  END IF;
END $$;

-- Ajouter payment_link
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'bookings' AND column_name = 'payment_link'
  ) THEN
    ALTER TABLE bookings ADD COLUMN payment_link text;
  END IF;
END $$;

-- ============================================================================
-- BUSINESS_SETTINGS - Colonnes manquantes
-- ============================================================================

-- Ajouter business_email
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'business_settings' AND column_name = 'business_email'
  ) THEN
    ALTER TABLE business_settings ADD COLUMN business_email text;
  END IF;
END $$;

-- Ajouter business_phone
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'business_settings' AND column_name = 'business_phone'
  ) THEN
    ALTER TABLE business_settings ADD COLUMN business_phone text;
  END IF;
END $$;

-- Ajouter business_address
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'business_settings' AND column_name = 'business_address'
  ) THEN
    ALTER TABLE business_settings ADD COLUMN business_address text;
  END IF;
END $$;

-- Ajouter timezone
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'business_settings' AND column_name = 'timezone'
  ) THEN
    ALTER TABLE business_settings ADD COLUMN timezone text DEFAULT 'Europe/Paris';
  END IF;
END $$;

-- Ajouter currency
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'business_settings' AND column_name = 'currency'
  ) THEN
    ALTER TABLE business_settings ADD COLUMN currency text DEFAULT 'EUR';
  END IF;
END $$;

-- Ajouter date_format
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'business_settings' AND column_name = 'date_format'
  ) THEN
    ALTER TABLE business_settings ADD COLUMN date_format text DEFAULT 'DD/MM/YYYY';
  END IF;
END $$;

-- Ajouter time_format
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'business_settings' AND column_name = 'time_format'
  ) THEN
    ALTER TABLE business_settings ADD COLUMN time_format text DEFAULT '24h' CHECK (time_format IN ('12h', '24h'));
  END IF;
END $$;

-- Ajouter week_start_day
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'business_settings' AND column_name = 'week_start_day'
  ) THEN
    ALTER TABLE business_settings ADD COLUMN week_start_day integer DEFAULT 1 CHECK (week_start_day >= 0 AND week_start_day <= 6);
  END IF;
END $$;

-- Ajouter minimum_booking_delay_hours
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'business_settings' AND column_name = 'minimum_booking_delay_hours'
  ) THEN
    ALTER TABLE business_settings ADD COLUMN minimum_booking_delay_hours integer DEFAULT 0;
  END IF;
END $$;

-- Ajouter stripe_enabled
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'business_settings' AND column_name = 'stripe_enabled'
  ) THEN
    ALTER TABLE business_settings ADD COLUMN stripe_enabled boolean DEFAULT false;
  END IF;
END $$;

-- Ajouter stripe_public_key
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'business_settings' AND column_name = 'stripe_public_key'
  ) THEN
    ALTER TABLE business_settings ADD COLUMN stripe_public_key text;
  END IF;
END $$;

-- Ajouter stripe_secret_key
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'business_settings' AND column_name = 'stripe_secret_key'
  ) THEN
    ALTER TABLE business_settings ADD COLUMN stripe_secret_key text;
  END IF;
END $$;

-- Ajouter payment_link_expiry_minutes
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'business_settings' AND column_name = 'payment_link_expiry_minutes'
  ) THEN
    ALTER TABLE business_settings ADD COLUMN payment_link_expiry_minutes integer DEFAULT 1440;
  END IF;
END $$;

-- ============================================================================
-- SERVICES - Colonnes manquantes
-- ============================================================================

-- Ajouter unit_name
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'services' AND column_name = 'unit_name'
  ) THEN
    ALTER TABLE services ADD COLUMN unit_name text DEFAULT 'personne';
  END IF;
END $$;

-- ============================================================================
-- COMPANY_INFO - Colonnes manquantes
-- ============================================================================

-- Ajouter pdf_accent_color
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'company_info' AND column_name = 'pdf_accent_color'
  ) THEN
    ALTER TABLE company_info ADD COLUMN pdf_accent_color text DEFAULT '#8B5CF6';
  END IF;
END $$;

-- Ajouter pdf_text_color
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'company_info' AND column_name = 'pdf_text_color'
  ) THEN
    ALTER TABLE company_info ADD COLUMN pdf_text_color text DEFAULT '#000000';
  END IF;
END $$;

-- ============================================================================
-- INVOICE_PAYMENTS - Colonnes manquantes
-- ============================================================================

-- Ajouter user_id si manquant (déjà dans la migration précédente mais on vérifie)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'invoice_payments' AND column_name = 'user_id'
  ) THEN
    ALTER TABLE invoice_payments ADD COLUMN user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;
  END IF;
END $$;

-- Ajouter reference
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'invoice_payments' AND column_name = 'reference'
  ) THEN
    ALTER TABLE invoice_payments ADD COLUMN reference text;
  END IF;
END $$;

-- ============================================================================
-- INVOICES - Colonnes manquantes
-- ============================================================================

-- Ajouter quote_number
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'invoices' AND column_name = 'quote_number'
  ) THEN
    ALTER TABLE invoices ADD COLUMN quote_number text;
  END IF;
END $$;

-- ============================================================================
-- CLIENTS - Colonnes manquantes
-- ============================================================================

-- Ajouter country si manquant
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'clients' AND column_name = 'country'
  ) THEN
    ALTER TABLE clients ADD COLUMN country text DEFAULT 'France';
  END IF;
END $$;

-- ============================================================================
-- PROFILES - Colonnes manquantes
-- ============================================================================

-- Ajouter is_super_admin
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'is_super_admin'
  ) THEN
    ALTER TABLE profiles ADD COLUMN is_super_admin boolean DEFAULT false;
  END IF;
END $$;

-- Ajouter subscription_tier
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'subscription_tier'
  ) THEN
    ALTER TABLE profiles ADD COLUMN subscription_tier text DEFAULT 'free' CHECK (subscription_tier IN ('free', 'starter', 'pro', 'enterprise'));
  END IF;
END $$;

-- ============================================================================
-- PAYMENT_LINKS - Colonnes manquantes
-- ============================================================================

-- S'assurer que user_id existe
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'payment_links' AND column_name = 'user_id'
  ) THEN
    ALTER TABLE payment_links ADD COLUMN user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;
  END IF;
END $$;

-- ============================================================================
-- INDEX POUR PERFORMANCES
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_bookings_booking_status ON bookings(booking_status);
CREATE INDEX IF NOT EXISTS idx_profiles_is_super_admin ON profiles(is_super_admin);
CREATE INDEX IF NOT EXISTS idx_profiles_subscription_tier ON profiles(subscription_tier);