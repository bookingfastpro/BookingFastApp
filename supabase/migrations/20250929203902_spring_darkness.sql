/*
  # Fix Row Level Security Policies

  1. Security Updates
    - Drop existing conflicting policies on bookings and services tables
    - Create comprehensive RLS policies for authenticated users
    - Ensure team members can access owner's data
    - Allow public access for booking functionality

  2. Tables Updated
    - `bookings` - Allow users to access their own bookings and team member bookings
    - `services` - Allow users to access their own services and team member services
    - Maintain public read access for booking functionality

  3. Policy Structure
    - Authenticated users can manage their own data
    - Team members can access owner's data through team_members table
    - Public users can view data needed for booking process
*/

-- Drop existing policies that might be causing conflicts
DROP POLICY IF EXISTS "Users can manage own bookings" ON bookings;
DROP POLICY IF EXISTS "Team members can access owner bookings" ON bookings;
DROP POLICY IF EXISTS "Public can view bookings for availability" ON bookings;
DROP POLICY IF EXISTS "Public can create bookings" ON bookings;
DROP POLICY IF EXISTS "Relaxed booking access policy" ON bookings;

DROP POLICY IF EXISTS "Users can manage own services" ON services;
DROP POLICY IF EXISTS "Team members can access owner services" ON services;
DROP POLICY IF EXISTS "Public can view services for booking" ON services;
DROP POLICY IF EXISTS "Relaxed service access policy" ON services;

-- Ensure RLS is enabled
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE services ENABLE ROW LEVEL SECURITY;

-- Create comprehensive policies for bookings
CREATE POLICY "Authenticated users can manage own bookings"
  ON bookings
  FOR ALL
  TO authenticated
  USING (
    user_id = auth.uid() OR 
    assigned_user_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM team_members tm 
      WHERE tm.user_id = auth.uid() 
      AND tm.owner_id = bookings.user_id 
      AND tm.is_active = true
    )
  )
  WITH CHECK (
    user_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM team_members tm 
      WHERE tm.user_id = auth.uid() 
      AND tm.owner_id = bookings.user_id 
      AND tm.is_active = true
    )
  );

CREATE POLICY "Public can view bookings for availability"
  ON bookings
  FOR SELECT
  TO anon
  USING (true);

CREATE POLICY "Public can create bookings"
  ON bookings
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- Create comprehensive policies for services
CREATE POLICY "Authenticated users can manage own services"
  ON services
  FOR ALL
  TO authenticated
  USING (
    user_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM team_members tm 
      WHERE tm.user_id = auth.uid() 
      AND tm.owner_id = services.user_id 
      AND tm.is_active = true
    )
  )
  WITH CHECK (
    user_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM team_members tm 
      WHERE tm.user_id = auth.uid() 
      AND tm.owner_id = services.user_id 
      AND tm.is_active = true
    )
  );

CREATE POLICY "Public can view services for booking"
  ON services
  FOR SELECT
  TO anon, authenticated
  USING (true);

-- Verify policies are working by testing access
DO $$
BEGIN
  -- Test that policies exist
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'bookings' 
    AND policyname = 'Authenticated users can manage own bookings'
  ) THEN
    RAISE EXCEPTION 'Booking policy not created correctly';
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'services' 
    AND policyname = 'Authenticated users can manage own services'
  ) THEN
    RAISE EXCEPTION 'Services policy not created correctly';
  END IF;
  
  RAISE NOTICE 'RLS policies successfully created and verified';
END $$;
