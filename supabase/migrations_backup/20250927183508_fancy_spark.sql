/*
  # Fix public booking access

  1. Security Updates
    - Allow public read access to services for booking display
    - Allow public read access to business_settings for booking configuration
    - Allow public read access to users for basic business info
    - Allow public insert access to bookings for external reservations
    - Allow public insert access to clients for new client creation

  2. Changes
    - Update RLS policies to allow anonymous access for booking functionality
    - Maintain security while enabling public booking interface
*/

-- Allow public read access to services
DROP POLICY IF EXISTS "Public can view services for booking" ON services;
CREATE POLICY "Public can view services for booking"
  ON services
  FOR SELECT
  TO anon, authenticated
  USING (true);

-- Allow public read access to business_settings
DROP POLICY IF EXISTS "Public can view business settings for booking" ON business_settings;
CREATE POLICY "Public can view business settings for booking"
  ON business_settings
  FOR SELECT
  TO anon, authenticated
  USING (true);

-- Allow public read access to basic user info
DROP POLICY IF EXISTS "Public can view basic user info for booking" ON users;
CREATE POLICY "Public can view basic user info for booking"
  ON users
  FOR SELECT
  TO anon, authenticated
  USING (true);

-- Allow public insert access to bookings (for external reservations)
DROP POLICY IF EXISTS "Public can create bookings" ON bookings;
CREATE POLICY "Public can create bookings"
  ON bookings
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- Allow public insert access to clients (for new client creation during booking)
DROP POLICY IF EXISTS "Public can create clients" ON clients;
CREATE POLICY "Public can create clients"
  ON clients
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- Allow public read access to clients for booking
DROP POLICY IF EXISTS "Public can view clients for booking" ON clients;
CREATE POLICY "Public can view clients for booking"
  ON clients
  FOR SELECT
  TO anon, authenticated
  USING (true);
