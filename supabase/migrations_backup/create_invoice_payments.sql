/*
  # Système de Paiements pour Factures

  1. Nouvelle Table
    - `invoice_payments` - Paiements des factures
      - `id` (uuid, primary key)
      - `invoice_id` (uuid, foreign key)
      - `payment_method` (text) - especes, carte, virement, cheque
      - `amount` (decimal)
      - `payment_date` (date)
      - `reference` (text) - numéro de chèque, référence virement, etc.
      - `notes` (text)
      - `created_at` (timestamptz)

  2. Sécurité
    - Enable RLS
    - Policies pour les utilisateurs authentifiés
*/

CREATE TABLE IF NOT EXISTS invoice_payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id uuid REFERENCES invoices(id) ON DELETE CASCADE NOT NULL,
  payment_method text NOT NULL CHECK (payment_method IN ('especes', 'carte', 'virement', 'cheque')),
  amount decimal(10,2) NOT NULL CHECK (amount > 0),
  payment_date date NOT NULL DEFAULT CURRENT_DATE,
  reference text,
  notes text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE invoice_payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage payments for their invoices"
  ON invoice_payments
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM invoices
      WHERE invoices.id = invoice_payments.invoice_id
      AND invoices.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM invoices
      WHERE invoices.id = invoice_payments.invoice_id
      AND invoices.user_id = auth.uid()
    )
  );

-- Index pour les performances
CREATE INDEX IF NOT EXISTS idx_invoice_payments_invoice_id ON invoice_payments(invoice_id);
CREATE INDEX IF NOT EXISTS idx_invoice_payments_payment_date ON invoice_payments(payment_date);
