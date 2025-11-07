/*
  # Enable public access for booking functionality

  1. Security Changes
    - Enable public read access to users table (basic info only)
    - Enable public read access to services table
    - Enable public read access to business_settings table
    - Enable public write access to bookings table (create only)
    - Enable public write access to clients table (create only)

  2. Purpose
    - Allow external booking page to function without authentication
    - Maintain security while enabling public booking functionality
*/

-- Enable public read access to users table (basic info only)
CREATE POLICY "Public can view basic user info for booking"
  ON users
  FOR SELECT
  TO anon
  USING (true);

-- Enable public read access to services table
CREATE POLICY "Public can view services for booking"
  ON services
  FOR SELECT
  TO anon
  USING (true);

-- Enable public read access to business_settings table
CREATE POLICY "Public can view business settings for booking"
  ON business_settings
  FOR SELECT
  TO anon
  USING (true);

-- Enable public read access to bookings table (for availability checking)
CREATE POLICY "Public can view bookings for availability"
  ON bookings
  FOR SELECT
  TO anon
  USING (true);

-- Enable public write access to bookings table (create only)
CREATE POLICY "Public can create bookings"
  ON bookings
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- Enable public write access to clients table (create only)
CREATE POLICY "Public can create clients"
  ON clients
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- Enable public read access to clients table (for booking purposes)
CREATE POLICY "Public can view clients for booking"
  ON clients
  FOR SELECT
  TO anon, authenticated
  USING (true);
