/*
  # Fix Permissions - Ajout user_id direct
  
  1. Ajout colonne user_id
  2. Remplissage des données existantes
  3. Suppression anciennes policies
  4. Création policies SIMPLES
*/

-- 1. Ajouter user_id directement dans invoice_payments
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'invoice_payments' AND column_name = 'user_id'
  ) THEN
    ALTER TABLE invoice_payments ADD COLUMN user_id uuid REFERENCES auth.users(id);
  END IF;
END $$;

-- 2. Remplir user_id pour les paiements existants
UPDATE invoice_payments
SET user_id = invoices.user_id
FROM invoices
WHERE invoice_payments.invoice_id = invoices.id
AND invoice_payments.user_id IS NULL;

-- 3. Rendre user_id obligatoire
ALTER TABLE invoice_payments ALTER COLUMN user_id SET NOT NULL;

-- 4. Supprimer TOUTES les anciennes policies
DROP POLICY IF EXISTS "Users can manage payments for their invoices" ON invoice_payments;
DROP POLICY IF EXISTS "Users can view their invoice payments" ON invoice_payments;
DROP POLICY IF EXISTS "Users can insert payments for their invoices" ON invoice_payments;
DROP POLICY IF EXISTS "Users can update their invoice payments" ON invoice_payments;
DROP POLICY IF EXISTS "Users can delete their invoice payments" ON invoice_payments;
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON invoice_payments;
DROP POLICY IF EXISTS "Enable insert access for authenticated users" ON invoice_payments;
DROP POLICY IF EXISTS "Enable update access for authenticated users" ON invoice_payments;
DROP POLICY IF EXISTS "Enable delete access for authenticated users" ON invoice_payments;

-- 5. Créer policies SIMPLES avec user_id direct
CREATE POLICY "Users can view own payments"
  ON invoice_payments
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own payments"
  ON invoice_payments
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own payments"
  ON invoice_payments
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own payments"
  ON invoice_payments
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- 6. Index pour performance
CREATE INDEX IF NOT EXISTS idx_invoice_payments_user_id ON invoice_payments(user_id);
