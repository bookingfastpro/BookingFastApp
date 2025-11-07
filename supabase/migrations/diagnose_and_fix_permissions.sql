/*
  # Diagnostic et Fix Permissions PostgreSQL
  
  1. Vérification de la structure
  2. Fix des permissions
  3. Recréation complète des policies
*/

-- 1. Vérifier que la table existe et a RLS activé
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE tablename = 'invoice_payments';

-- 2. Vérifier les policies existantes
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies 
WHERE tablename = 'invoice_payments';

-- 3. Supprimer TOUTES les policies existantes
DROP POLICY IF EXISTS "Users can manage payments for their invoices" ON invoice_payments;
DROP POLICY IF EXISTS "Users can view their invoice payments" ON invoice_payments;
DROP POLICY IF EXISTS "Users can insert payments for their invoices" ON invoice_payments;
DROP POLICY IF EXISTS "Users can update their invoice payments" ON invoice_payments;
DROP POLICY IF EXISTS "Users can delete their invoice payments" ON invoice_payments;

-- 4. Vérifier que la colonne user_id existe dans invoices
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'invoices' AND column_name = 'user_id';

-- 5. Recréer les policies avec une approche simplifiée
CREATE POLICY "Enable read access for authenticated users"
  ON invoice_payments
  FOR SELECT
  TO authenticated
  USING (
    invoice_id IN (
      SELECT id FROM invoices WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Enable insert access for authenticated users"
  ON invoice_payments
  FOR INSERT
  TO authenticated
  WITH CHECK (
    invoice_id IN (
      SELECT id FROM invoices WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Enable update access for authenticated users"
  ON invoice_payments
  FOR UPDATE
  TO authenticated
  USING (
    invoice_id IN (
      SELECT id FROM invoices WHERE user_id = auth.uid()
    )
  )
  WITH CHECK (
    invoice_id IN (
      SELECT id FROM invoices WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Enable delete access for authenticated users"
  ON invoice_payments
  FOR DELETE
  TO authenticated
  USING (
    invoice_id IN (
      SELECT id FROM invoices WHERE user_id = auth.uid()
    )
  );

-- 6. Vérifier les nouvelles policies
SELECT policyname, cmd 
FROM pg_policies 
WHERE tablename = 'invoice_payments';
