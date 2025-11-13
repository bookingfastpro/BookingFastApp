/*
  # Reconstruction complète du système de paramètres

  1. Suppression et recréation des tables
    - Suppression de toutes les tables existantes
    - Recréation avec structure simplifiée
    - Insertion de données par défaut

  2. Sécurité
    - RLS activé sur toutes les tables
    - Politiques simples et claires
    - Accès public en lecture, authentifié en écriture

  3. Données par défaut
    - Paramètres d'entreprise avec horaires standards
    - Services d'exemple
*/

-- Suppression des tables existantes
DROP TABLE IF EXISTS bookings CASCADE;
DROP TABLE IF EXISTS services CASCADE;
DROP TABLE IF EXISTS business_settings CASCADE;

-- Table des paramètres d'entreprise
CREATE TABLE business_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_name text NOT NULL DEFAULT 'BookingPro',
  primary_color text NOT NULL DEFAULT '#3B82F6',
  secondary_color text NOT NULL DEFAULT '#8B5CF6',
  logo_url text,
  opening_hours jsonb NOT NULL DEFAULT '{
    "monday": {"start": "08:00", "end": "18:00", "closed": false},
    "tuesday": {"start": "08:00", "end": "18:00", "closed": false},
    "wednesday": {"start": "08:00", "end": "18:00", "closed": false},
    "thursday": {"start": "08:00", "end": "18:00", "closed": false},
    "friday": {"start": "08:00", "end": "18:00", "closed": false},
    "saturday": {"start": "09:00", "end": "17:00", "closed": false},
    "sunday": {"start": "10:00", "end": "16:00", "closed": true}
  }'::jsonb,
  buffer_minutes integer NOT NULL DEFAULT 15,
  default_deposit_percentage integer NOT NULL DEFAULT 30,
  email_notifications boolean NOT NULL DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Table des services
CREATE TABLE services (
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

-- Table des réservations
CREATE TABLE bookings (
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
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Index pour les performances
CREATE INDEX idx_services_name ON services(name);
CREATE INDEX idx_bookings_date_time ON bookings(date, time);
CREATE INDEX idx_bookings_service_id ON bookings(service_id);

-- Activation RLS
ALTER TABLE business_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE services ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;

-- Politiques RLS simples
CREATE POLICY "Lecture publique des paramètres" ON business_settings FOR SELECT TO public USING (true);
CREATE POLICY "Modification des paramètres par les authentifiés" ON business_settings FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Lecture publique des services" ON services FOR SELECT TO public USING (true);
CREATE POLICY "Modification des services par les authentifiés" ON services FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Lecture publique des réservations" ON bookings FOR SELECT TO public USING (true);
CREATE POLICY "Création de réservations par tous" ON bookings FOR INSERT TO public WITH CHECK (true);
CREATE POLICY "Modification des réservations par les authentifiés" ON bookings FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Suppression des réservations par les authentifiés" ON bookings FOR DELETE TO authenticated USING (true);

-- Insertion des données par défaut
INSERT INTO business_settings (
  business_name,
  primary_color,
  secondary_color,
  opening_hours,
  buffer_minutes,
  default_deposit_percentage,
  email_notifications
) VALUES (
  'BookingPro',
  '#3B82F6',
  '#8B5CF6',
  '{
    "monday": {"start": "08:00", "end": "18:00", "closed": false},
    "tuesday": {"start": "08:00", "end": "18:00", "closed": false},
    "wednesday": {"start": "08:00", "end": "18:00", "closed": false},
    "thursday": {"start": "08:00", "end": "18:00", "closed": false},
    "friday": {"start": "08:00", "end": "18:00", "closed": false},
    "saturday": {"start": "09:00", "end": "17:00", "closed": false},
    "sunday": {"start": "10:00", "end": "16:00", "closed": true}
  }'::jsonb,
  15,
  30,
  true
);

-- Services d'exemple
INSERT INTO services (name, price_ht, price_ttc, description, duration_minutes, capacity) VALUES
('Consultation Standard', 50.00, 60.00, 'Consultation de base avec diagnostic complet', 60, 1),
('Consultation Premium', 83.33, 100.00, 'Consultation approfondie avec suivi personnalisé', 90, 1),
('Séance de Groupe', 25.00, 30.00, 'Séance collective pour plusieurs participants', 45, 6);
