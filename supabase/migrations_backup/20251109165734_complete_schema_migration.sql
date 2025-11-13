/*
  # Schéma complet BookingFast avec gestion d'équipe et Google Calendar

  1. Tables principales
    - profiles: Profils utilisateurs
    - teams: Équipes
    - team_members: Membres d'équipe avec permissions
    - team_invitations: Invitations en attente
    - services: Services proposés
    - bookings: Réservations
    - business_settings: Paramètres de l'entreprise
    - google_calendar_tokens: Tokens OAuth Google Calendar

  2. Sécurité
    - RLS activé sur toutes les tables
    - Politiques adaptées pour chaque table
*/

-- ============================================================================
-- TABLE: profiles
-- ============================================================================

CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text UNIQUE NOT NULL,
  full_name text,
  avatar_url text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Profiles are viewable by everyone" ON profiles;
CREATE POLICY "Profiles are viewable by everyone"
  ON profiles FOR SELECT
  TO public
  USING (true);

DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- ============================================================================
-- TABLE: teams
-- ============================================================================

CREATE TABLE IF NOT EXISTS teams (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  owner_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE teams ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Team owners can view their teams" ON teams;
CREATE POLICY "Team owners can view their teams"
  ON teams FOR SELECT
  TO authenticated
  USING (owner_id = auth.uid());

DROP POLICY IF EXISTS "Team owners can manage their teams" ON teams;
CREATE POLICY "Team owners can manage their teams"
  ON teams FOR ALL
  TO authenticated
  USING (owner_id = auth.uid())
  WITH CHECK (owner_id = auth.uid());

-- ============================================================================
-- TABLE: team_members
-- ============================================================================

CREATE TABLE IF NOT EXISTS team_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id uuid NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role text NOT NULL DEFAULT 'member' CHECK (role IN ('owner', 'admin', 'member')),
  permissions text[] DEFAULT ARRAY[]::text[],
  role_name text DEFAULT 'Membre',
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(team_id, user_id)
);

ALTER TABLE team_members ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Team members can view their team" ON team_members;
CREATE POLICY "Team members can view their team"
  ON team_members FOR SELECT
  TO authenticated
  USING (
    user_id = auth.uid() OR
    team_id IN (
      SELECT team_id FROM team_members WHERE user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Team owners can manage members" ON team_members;
CREATE POLICY "Team owners can manage members"
  ON team_members FOR ALL
  TO authenticated
  USING (
    team_id IN (
      SELECT id FROM teams WHERE owner_id = auth.uid()
    )
  )
  WITH CHECK (
    team_id IN (
      SELECT id FROM teams WHERE owner_id = auth.uid()
    )
  );

-- ============================================================================
-- TABLE: team_invitations
-- ============================================================================

CREATE TABLE IF NOT EXISTS team_invitations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id uuid NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  email text NOT NULL,
  role text NOT NULL DEFAULT 'member',
  permissions text[] DEFAULT ARRAY[]::text[],
  role_name text DEFAULT 'Membre',
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined', 'expired')),
  expires_at timestamptz NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE team_invitations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Team owners can manage invitations" ON team_invitations;
CREATE POLICY "Team owners can manage invitations"
  ON team_invitations FOR ALL
  TO authenticated
  USING (
    team_id IN (
      SELECT id FROM teams WHERE owner_id = auth.uid()
    )
  )
  WITH CHECK (
    team_id IN (
      SELECT id FROM teams WHERE owner_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Invited users can view their invitations" ON team_invitations;
CREATE POLICY "Invited users can view their invitations"
  ON team_invitations FOR SELECT
  TO authenticated
  USING (
    email = (SELECT email FROM auth.users WHERE id = auth.uid())
  );

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
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE services ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Services are viewable by everyone" ON services;
CREATE POLICY "Services are viewable by everyone"
  ON services FOR SELECT
  TO public
  USING (true);

DROP POLICY IF EXISTS "Authenticated users can manage services" ON services;
CREATE POLICY "Authenticated users can manage services"
  ON services FOR ALL
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
  payment_status text NOT NULL DEFAULT 'pending' CHECK (payment_status IN ('pending', 'partial', 'completed')),
  payment_amount numeric(10,2) DEFAULT 0,
  notes text,
  assigned_user_id uuid REFERENCES auth.users(id),
  google_calendar_event_id text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_bookings_service_id ON bookings(service_id);
CREATE INDEX IF NOT EXISTS idx_bookings_date_time ON bookings(date, time);
CREATE INDEX IF NOT EXISTS idx_bookings_assigned_user ON bookings(assigned_user_id);

ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Bookings are viewable by everyone" ON bookings;
CREATE POLICY "Bookings are viewable by everyone"
  ON bookings FOR SELECT
  TO public
  USING (true);

DROP POLICY IF EXISTS "Anyone can create bookings" ON bookings;
CREATE POLICY "Anyone can create bookings"
  ON bookings FOR INSERT
  TO public
  WITH CHECK (true);

DROP POLICY IF EXISTS "Authenticated users can manage bookings" ON bookings;
CREATE POLICY "Authenticated users can manage bookings"
  ON bookings FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS "Authenticated users can delete bookings" ON bookings;
CREATE POLICY "Authenticated users can delete bookings"
  ON bookings FOR DELETE
  TO authenticated
  USING (true);

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
  email_notifications boolean NOT NULL DEFAULT true,
  google_calendar_enabled boolean DEFAULT false,
  google_calendar_sync_status text DEFAULT 'disconnected',
  google_calendar_id text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE business_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Business settings are viewable by everyone" ON business_settings;
CREATE POLICY "Business settings are viewable by everyone"
  ON business_settings FOR SELECT
  TO public
  USING (true);

DROP POLICY IF EXISTS "Authenticated users can manage settings" ON business_settings;
CREATE POLICY "Authenticated users can manage settings"
  ON business_settings FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- ============================================================================
-- TABLE: google_calendar_tokens
-- ============================================================================

CREATE TABLE IF NOT EXISTS google_calendar_tokens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  access_token text NOT NULL,
  refresh_token text NOT NULL,
  token_expiry timestamptz NOT NULL,
  scope text NOT NULL,
  calendar_id text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id)
);

ALTER TABLE google_calendar_tokens ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage their own tokens" ON google_calendar_tokens;
CREATE POLICY "Users can manage their own tokens"
  ON google_calendar_tokens FOR ALL
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- ============================================================================
-- DONNÉES PAR DÉFAUT
-- ============================================================================

-- Paramètres business par défaut
INSERT INTO business_settings (
  business_name,
  primary_color,
  secondary_color,
  opening_hours,
  buffer_minutes,
  default_deposit_percentage,
  email_notifications
)
SELECT
  'BookingFast',
  '#3B82F6',
  '#8B5CF6',
  '{
    "monday": {"start": "08:00", "end": "18:00", "closed": false},
    "tuesday": {"start": "08:00", "end": "18:00", "closed": false},
    "wednesday": {"start": "08:00", "end": "18:00", "closed": false},
    "thursday": {"start": "08:00", "end": "18:00", "closed": false},
    "friday": {"start": "08:00", "end": "18:00", "closed": false},
    "saturday": {"start": "09:00", "end": "17:00", "closed": false},
    "sunday": {"start": "09:00", "end": "17:00", "closed": true}
  }'::jsonb,
  15,
  30,
  true
WHERE NOT EXISTS (SELECT 1 FROM business_settings LIMIT 1);

-- Services d'exemple
INSERT INTO services (name, price_ht, price_ttc, description, duration_minutes, capacity)
SELECT * FROM (VALUES
  ('Consultation Standard', 50.00, 60.00, 'Consultation de base avec diagnostic complet', 60, 1),
  ('Séance Premium', 83.33, 100.00, 'Séance approfondie avec suivi personnalisé', 90, 1),
  ('Atelier Groupe', 41.67, 50.00, 'Session collective pour plusieurs participants', 120, 6)
) AS v(name, price_ht, price_ttc, description, duration_minutes, capacity)
WHERE NOT EXISTS (SELECT 1 FROM services WHERE services.name = v.name);