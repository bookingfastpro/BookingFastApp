/*
  # Create gift cards table

  1. New Tables
    - `gift_cards`
      - `id` (uuid, primary key)
      - `code` (text, unique) - Code du bon cadeau
      - `amount` (numeric) - Montant du bon cadeau
      - `description` (text, optional) - Description du bon
      - `is_active` (boolean) - Si le bon est actif
      - `is_used` (boolean) - Si le bon a été utilisé
      - `used_by` (text, optional) - Email de qui a utilisé le bon
      - `used_at` (timestamp, optional) - Quand le bon a été utilisé
      - `expires_at` (timestamp, optional) - Date d'expiration
      - `created_by` (uuid) - Qui a créé le bon
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on `gift_cards` table
    - Add policies for authenticated users to manage gift cards
    - Add policies for public validation of gift cards

  3. Indexes
    - Index on code for fast lookups
    - Index on is_active and is_used for filtering
    - Index on expires_at for expiration checks
*/

CREATE TABLE IF NOT EXISTS gift_cards (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text UNIQUE NOT NULL,
  amount numeric(10,2) NOT NULL CHECK (amount > 0),
  description text,
  is_active boolean DEFAULT true NOT NULL,
  is_used boolean DEFAULT false NOT NULL,
  used_by text,
  used_at timestamptz,
  expires_at timestamptz,
  created_by uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

-- Enable RLS
ALTER TABLE gift_cards ENABLE ROW LEVEL SECURITY;

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_gift_cards_code ON gift_cards(code);
CREATE INDEX IF NOT EXISTS idx_gift_cards_active_used ON gift_cards(is_active, is_used);
CREATE INDEX IF NOT EXISTS idx_gift_cards_expires_at ON gift_cards(expires_at);
CREATE INDEX IF NOT EXISTS idx_gift_cards_created_by ON gift_cards(created_by);

-- RLS Policies

-- Authenticated users can view all gift cards
CREATE POLICY "Authenticated users can view all gift cards"
  ON gift_cards
  FOR SELECT
  TO authenticated
  USING (true);

-- Authenticated users can create gift cards
CREATE POLICY "Authenticated users can create gift cards"
  ON gift_cards
  FOR INSERT
  TO authenticated
  WITH CHECK (created_by = auth.uid());

-- Authenticated users can update all gift cards
CREATE POLICY "Authenticated users can update all gift cards"
  ON gift_cards
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Authenticated users can delete gift cards they created
CREATE POLICY "Users can delete their own gift cards"
  ON gift_cards
  FOR DELETE
  TO authenticated
  USING (created_by = auth.uid());

-- Anonymous users can validate gift cards (for public booking)
CREATE POLICY "Anonymous users can validate gift cards"
  ON gift_cards
  FOR SELECT
  TO anon
  USING (is_active = true AND is_used = false AND (expires_at IS NULL OR expires_at > now()));

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_gift_cards_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update updated_at
DROP TRIGGER IF EXISTS update_gift_cards_updated_at ON gift_cards;
CREATE TRIGGER update_gift_cards_updated_at
  BEFORE UPDATE ON gift_cards
  FOR EACH ROW
  EXECUTE FUNCTION update_gift_cards_updated_at();
