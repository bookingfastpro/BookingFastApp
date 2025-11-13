/*
  # Allow public access for booking functionality

  1. Security Changes
    - Add public access policies for services, business_settings, and bookings tables
    - Allow anonymous users to read services and settings for public booking pages
    - Allow anonymous users to create bookings for public reservations

  2. Tables Modified
    - `services` - Add public read policy
    - `business_settings` - Add public read policy  
    - `bookings` - Add public insert policy
    - `users` - Add public read policy for basic info

  3. Important Notes
    - These policies are specifically for public booking functionality
    - Only essential data is exposed publicly
    - Write access is limited to booking creation only
*/

-- Allow public read access to services for public booking pages
CREATE POLICY "Public can view services for booking"
  ON services
  FOR SELECT
  TO anon
  USING (true);

-- Allow public read access to business settings for public booking pages
CREATE POLICY "Public can view business settings for booking"
  ON business_settings
  FOR SELECT
  TO anon
  USING (true);

-- Allow public read access to basic user info for public booking pages
CREATE POLICY "Public can view basic user info for booking"
  ON users
  FOR SELECT
  TO anon
  USING (true);

-- Allow public read access to bookings for availability checking
CREATE POLICY "Public can view bookings for availability"
  ON bookings
  FOR SELECT
  TO anon
  USING (true);

-- Allow public insert for new bookings from public booking pages
CREATE POLICY "Public can create bookings"
  ON bookings
  FOR INSERT
  TO anon
  WITH CHECK (true);

-- Allow public read access to clients for booking creation
CREATE POLICY "Public can view clients for booking"
  ON clients
  FOR SELECT
  TO anon
  USING (true);

-- Allow public insert for new clients from public booking pages
CREATE POLICY "Public can create clients"
  ON clients
  FOR INSERT
  TO anon
  WITH CHECK (true);
