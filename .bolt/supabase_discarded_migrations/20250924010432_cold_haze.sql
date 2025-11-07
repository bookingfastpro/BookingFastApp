/*
  # Create gift_cards table

  1. New Tables
    - `gift_cards`
      - `id` (uuid, primary key)
      - `code` (text, unique) - Code unique du bon cadeau
      - `amount` (numeric) - Montant du bon cadeau
      - `description` (text) - Description optionnelle
      - `is_active` (boolean) - Si le bon est actif
      - `is_used` (boolean) - Si le bon a été utilisé
      - `used_by` (text) - Email de la personne qui a utilisé le bon
      - `used_at` (timestamp) - Date d'utilisation
      - `expires_at` (timestamp) - Date d'expiration
      - `created_by` (uuid) - ID de l'utilisateur qui a créé le bon
      - `created_at` (timestamp) - Date de création
      - `updated_at` (timestamp) - Date de mise à jour

  2. Security
    - Enable RLS on `gift_cards` table
    - Add policies for authenticated users to manage gift cards
    - Add policy for anonymous users to use gift cards

  3. Indexes
    - Index on code for fast lookups
    - Index on is_active and is_used for filtering
    - Index on expires_at for cleanup queries
*/

CREATE TABLE IF NOT EXISTS gift_cards (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text UNIQUE NOT NULL,
  amount numeric(10,2) NOT NULL CHECK (amount > 0),
  description text DEFAULT '',
  is_active boolean DEFAULT true NOT NULL,
  is_used boolean DEFAULT false NOT NULL,
  used_by text,
  used_at timestamptz,
  expires_at timestamptz,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

-- Enable RLS
ALTER TABLE gift_cards ENABLE ROW LEVEL SECURITY;

-- Policies for authenticated users (full access for management)
CREATE POLICY "Authenticated users can view all gift cards"
  ON gift_cards
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can create gift cards"
  ON gift_cards
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update gift cards"
  ON gift_cards
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete gift cards"
  ON gift_cards
  FOR DELETE
  TO authenticated
  USING (true);

-- Policy for anonymous users (can only read active, unused, non-expired gift cards for validation)
CREATE POLICY "Anonymous users can validate gift cards"
  ON gift_cards
  FOR SELECT
  TO anon
  USING (
    is_active = true 
    AND is_used = false 
    AND (expires_at IS NULL OR expires_at > now())
  );

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_gift_cards_code ON gift_cards(code);
CREATE INDEX IF NOT EXISTS idx_gift_cards_active_used ON gift_cards(is_active, is_used);
CREATE INDEX IF NOT EXISTS idx_gift_cards_expires_at ON gift_cards(expires_at);
CREATE INDEX IF NOT EXISTS idx_gift_cards_created_by ON gift_cards(created_by);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_gift_cards_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update updated_at
CREATE TRIGGER update_gift_cards_updated_at
  BEFORE UPDATE ON gift_cards
  FOR EACH ROW
  EXECUTE FUNCTION update_gift_cards_updated_at();
