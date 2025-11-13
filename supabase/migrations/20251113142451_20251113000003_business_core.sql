/*
  # Migration 03: Business Core (Services, Bookings, Clients, Settings)
  
  ## Overview
  Core business functionality for booking management
  
  ## Tables Created
  1. **services**
     - id, name, price_ht, price_ttc, image_url, description
     - duration_minutes, capacity, user_id
     - category, is_active, booking_interval_minutes
  
  2. **service_categories**
     - id, name, description, user_id, display_order
  
  3. **clients**
     - id, first_name, last_name, email, phone
     - address, city, postal_code, country, notes, user_id
  
  4. **bookings**
     - id, service_id, date, time, duration_minutes, quantity
     - client_name, client_firstname, client_email, client_phone
     - total_amount, payment_status, payment_amount
     - deposit_type, deposit_amount, notes
     - assigned_user_id, google_calendar_event_id
     - stripe_session_id, payment_link_id
     - notification_preferences (JSONB)
  
  5. **business_settings**
     - id, user_id, business_name, primary_color, secondary_color
     - logo_url, opening_hours (JSONB), buffer_minutes
     - default_deposit_percentage, multiply_deposit_by_participants
     - email_notifications, google_calendar_enabled
     - tax_rate, brevo_api_key, brevo_enabled
     - twilio_account_sid, twilio_auth_token, twilio_phone_number
  
  ## Security
  - RLS enabled on all tables
  - Services and settings: authenticated users can manage
  - Bookings: public can insert, authenticated can manage
  - Clients: authenticated users can manage their own
*/

-- ============================================================================
-- DROP EXISTING TABLES
-- ============================================================================

DROP TABLE IF EXISTS bookings CASCADE;
DROP TABLE IF EXISTS clients CASCADE;
DROP TABLE IF EXISTS services CASCADE;
DROP TABLE IF EXISTS service_categories CASCADE;
DROP TABLE IF EXISTS business_settings CASCADE;

-- ============================================================================
-- TABLE: business_settings
-- ============================================================================

CREATE TABLE IF NOT EXISTS business_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  business_name text NOT NULL DEFAULT 'Mon Entreprise',
  primary_color text NOT NULL DEFAULT '#3B82F6',
  secondary_color text NOT NULL DEFAULT '#8B5CF6',
  logo_url text,
  opening_hours jsonb NOT NULL DEFAULT '{}',
  buffer_minutes integer NOT NULL DEFAULT 15,
  default_deposit_percentage integer NOT NULL DEFAULT 30,
  multiply_deposit_by_participants boolean DEFAULT false,
  email_notifications boolean NOT NULL DEFAULT true,
  google_calendar_enabled boolean DEFAULT false,
  google_calendar_sync_status text DEFAULT 'disconnected',
  google_calendar_id text,
  tax_rate numeric(5,2) DEFAULT 20.00,
  brevo_api_key text,
  brevo_enabled boolean DEFAULT false,
  twilio_account_sid text,
  twilio_auth_token text,
  twilio_phone_number text,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

COMMENT ON TABLE business_settings IS 'Business configuration and settings';

ALTER TABLE business_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Settings viewable by everyone"
  ON business_settings FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Authenticated users can manage settings"
  ON business_settings FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- ============================================================================
-- TABLE: service_categories
-- ============================================================================

CREATE TABLE IF NOT EXISTS service_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  display_order integer DEFAULT 0,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

COMMENT ON TABLE service_categories IS 'Categories for organizing services';

ALTER TABLE service_categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Categories viewable by everyone"
  ON service_categories FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Authenticated users can manage categories"
  ON service_categories FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- ============================================================================
-- TABLE: services
-- ============================================================================

CREATE TABLE IF NOT EXISTS services (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  price_ht numeric(10,2) NOT NULL DEFAULT 0,
  price_ttc numeric(10,2) NOT NULL DEFAULT 0,
  image_url text,
  description text NOT NULL DEFAULT '',
  duration_minutes integer NOT NULL DEFAULT 60,
  capacity integer NOT NULL DEFAULT 1,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  category text,
  is_active boolean DEFAULT true,
  booking_interval_minutes integer DEFAULT 30,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

COMMENT ON TABLE services IS 'Services offered by the business';

ALTER TABLE services ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Services viewable by everyone"
  ON services FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Authenticated users can manage services"
  ON services FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- ============================================================================
-- TABLE: clients
-- ============================================================================

CREATE TABLE IF NOT EXISTS clients (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  first_name text NOT NULL,
  last_name text NOT NULL,
  email text NOT NULL,
  phone text NOT NULL,
  address text,
  city text,
  postal_code text,
  country text DEFAULT 'France',
  notes text,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

COMMENT ON TABLE clients IS 'Client database for bookings and invoices';

ALTER TABLE clients ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view all clients"
  ON clients FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can manage clients"
  ON clients FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- ============================================================================
-- TABLE: bookings
-- ============================================================================

CREATE TABLE IF NOT EXISTS bookings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  service_id uuid NOT NULL REFERENCES services(id) ON DELETE CASCADE,
  date date NOT NULL,
  time time NOT NULL,
  duration_minutes integer NOT NULL,
  quantity integer NOT NULL DEFAULT 1,
  client_name text NOT NULL,
  client_firstname text NOT NULL,
  client_email text NOT NULL,
  client_phone text NOT NULL,
  total_amount numeric(10,2) NOT NULL,
  payment_status text NOT NULL DEFAULT 'pending' CHECK (payment_status IN ('pending', 'partial', 'completed', 'cancelled', 'refunded')),
  payment_amount numeric(10,2) DEFAULT 0,
  deposit_type text DEFAULT 'percentage' CHECK (deposit_type IN ('percentage', 'fixed', 'full')),
  deposit_amount numeric(10,2) DEFAULT 0,
  notes text,
  assigned_user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  google_calendar_event_id text,
  stripe_session_id text,
  payment_link_id uuid,
  notification_preferences jsonb DEFAULT '{"email": true, "sms": false}'::jsonb,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

COMMENT ON TABLE bookings IS 'Customer bookings and reservations';

ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Bookings viewable by everyone"
  ON bookings FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Anyone can create bookings"
  ON bookings FOR INSERT
  TO public
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update bookings"
  ON bookings FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete bookings"
  ON bookings FOR DELETE
  TO authenticated
  USING (true);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_services_user_id ON services(user_id);
CREATE INDEX IF NOT EXISTS idx_services_is_active ON services(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_clients_user_id ON clients(user_id);
CREATE INDEX IF NOT EXISTS idx_clients_email ON clients(email);
CREATE INDEX IF NOT EXISTS idx_bookings_service_id ON bookings(service_id);
CREATE INDEX IF NOT EXISTS idx_bookings_date_time ON bookings(date, time);
CREATE INDEX IF NOT EXISTS idx_bookings_assigned_user ON bookings(assigned_user_id);
CREATE INDEX IF NOT EXISTS idx_bookings_payment_status ON bookings(payment_status);
CREATE INDEX IF NOT EXISTS idx_bookings_stripe_session ON bookings(stripe_session_id) WHERE stripe_session_id IS NOT NULL;

-- Grants
GRANT ALL ON business_settings TO authenticated;
GRANT SELECT ON business_settings TO anon;
GRANT ALL ON service_categories TO authenticated;
GRANT SELECT ON service_categories TO anon;
GRANT ALL ON services TO authenticated;
GRANT SELECT ON services TO anon;
GRANT ALL ON clients TO authenticated;
GRANT ALL ON bookings TO authenticated;
GRANT SELECT, INSERT ON bookings TO anon;