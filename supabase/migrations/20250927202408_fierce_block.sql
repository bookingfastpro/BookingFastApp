/*
  # Create service categories table

  1. New Tables
    - `service_categories`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key to auth.users)
      - `name` (text, required)
      - `description` (text, optional)
      - `color` (text, required, hex color)
      - `icon` (text, optional, emoji)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on `service_categories` table
    - Add policy for users to manage their own categories
    - Add policy for team members to access owner's categories

  3. Changes
    - Add `category_id` column to `services` table
    - Add foreign key constraint
    - Update RLS policies
*/

-- Create service_categories table
CREATE TABLE IF NOT EXISTS service_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text DEFAULT '',
  color text NOT NULL DEFAULT '#3B82F6',
  icon text DEFAULT '📋',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Add category_id to services table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'services' AND column_name = 'category_id'
  ) THEN
    ALTER TABLE services ADD COLUMN category_id uuid REFERENCES service_categories(id) ON DELETE SET NULL;
  END IF;
END $$;

-- Enable RLS
ALTER TABLE service_categories ENABLE ROW LEVEL SECURITY;

-- RLS Policies for service_categories
CREATE POLICY "Public can view service categories for booking"
  ON service_categories
  FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Relaxed service categories access policy"
  ON service_categories
  FOR ALL
  TO authenticated
  USING (
    (user_id = auth.uid()) OR 
    (EXISTS (
      SELECT 1 FROM team_members tm 
      WHERE tm.user_id = auth.uid() 
      AND tm.owner_id = service_categories.user_id 
      AND tm.is_active = true
    ))
  )
  WITH CHECK (
    (user_id = auth.uid()) OR 
    (EXISTS (
      SELECT 1 FROM team_members tm 
      WHERE tm.user_id = auth.uid() 
      AND tm.owner_id = service_categories.user_id 
      AND tm.is_active = true
    ))
  );

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_service_categories_user_id ON service_categories(user_id);
CREATE INDEX IF NOT EXISTS idx_service_categories_name ON service_categories(name);
CREATE INDEX IF NOT EXISTS idx_services_category_id ON services(category_id);

-- Trigger for updated_at
CREATE OR REPLACE FUNCTION update_service_categories_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER IF NOT EXISTS update_service_categories_updated_at
  BEFORE UPDATE ON service_categories
  FOR EACH ROW
  EXECUTE FUNCTION update_service_categories_updated_at();
