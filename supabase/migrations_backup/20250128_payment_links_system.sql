/*
  # Système de liens de paiement

  1. Nouvelles Tables
    - `payment_links`
      - `id` (uuid, primary key)
      - `booking_id` (uuid, foreign key vers bookings)
      - `user_id` (uuid, foreign key vers users)
      - `amount` (numeric) - Montant du paiement
      - `status` (text) - pending, completed, expired, cancelled
      - `expires_at` (timestamptz) - Date d'expiration
      - `payment_url` (text) - URL du lien de paiement
      - `stripe_session_id` (text) - ID de session Stripe
      - `paid_at` (timestamptz) - Date de paiement
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Security
    - Enable RLS on `payment_links` table
    - Add policies for authenticated users
    - Add PUBLIC policy for reading payment links (for payment page)

  3. Indexes
    - Index sur booking_id pour recherche rapide
    - Index sur status pour filtrage
    - Index sur expires_at pour nettoyage automatique
*/

-- Créer la table payment_links
CREATE TABLE IF NOT EXISTS payment_links (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id uuid NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  amount numeric NOT NULL CHECK (amount > 0),
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'expired', 'cancelled')),
  expires_at timestamptz NOT NULL,
  payment_url text,
  stripe_session_id text,
  paid_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Activer RLS
ALTER TABLE payment_links ENABLE ROW LEVEL SECURITY;

-- 🔥 POLITIQUE CRITIQUE : Lecture publique pour la page de paiement
CREATE POLICY "Public can view payment links for payment page"
  ON payment_links
  FOR SELECT
  TO anon, authenticated
  USING (true);

-- Politique : Les utilisateurs peuvent créer leurs propres liens
CREATE POLICY "Users can create own payment links"
  ON payment_links
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Politique : Les utilisateurs peuvent mettre à jour leurs propres liens
CREATE POLICY "Users can update own payment links"
  ON payment_links
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

-- Politique : Les utilisateurs peuvent supprimer leurs propres liens
CREATE POLICY "Users can delete own payment links"
  ON payment_links
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Index pour performance
CREATE INDEX IF NOT EXISTS idx_payment_links_booking_id ON payment_links(booking_id);
CREATE INDEX IF NOT EXISTS idx_payment_links_status ON payment_links(status);
CREATE INDEX IF NOT EXISTS idx_payment_links_expires_at ON payment_links(expires_at);
CREATE INDEX IF NOT EXISTS idx_payment_links_user_id ON payment_links(user_id);

-- Fonction pour mettre à jour updated_at automatiquement
CREATE OR REPLACE FUNCTION update_payment_links_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger pour updated_at
DROP TRIGGER IF EXISTS update_payment_links_updated_at_trigger ON payment_links;
CREATE TRIGGER update_payment_links_updated_at_trigger
  BEFORE UPDATE ON payment_links
  FOR EACH ROW
  EXECUTE FUNCTION update_payment_links_updated_at();

-- Fonction pour marquer les liens expirés automatiquement
CREATE OR REPLACE FUNCTION mark_expired_payment_links()
RETURNS void AS $$
BEGIN
  UPDATE payment_links
  SET status = 'expired'
  WHERE status = 'pending'
    AND expires_at < now();
END;
$$ LANGUAGE plpgsql;
