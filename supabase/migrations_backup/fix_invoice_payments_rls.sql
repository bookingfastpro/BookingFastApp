/*
  # Fix RLS Policies pour invoice_payments

  1. Suppression des anciennes policies
  2. Création de nouvelles policies séparées pour chaque opération
*/

-- Supprimer l'ancienne policy
DROP POLICY IF EXISTS "Users can manage payments for their invoices" ON invoice_payments;

-- Policy pour SELECT
CREATE POLICY "Users can view their invoice payments"
  ON invoice_payments
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM invoices
      WHERE invoices.id = invoice_payments.invoice_id
      AND invoices.user_id = auth.uid()
    )
  );

-- Policy pour INSERT
CREATE POLICY "Users can insert payments for their invoices"
  ON invoice_payments
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM invoices
      WHERE invoices.id = invoice_payments.invoice_id
      AND invoices.user_id = auth.uid()
    )
  );

-- Policy pour UPDATE
CREATE POLICY "Users can update their invoice payments"
  ON invoice_payments
  FOR UPDATE
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

-- Policy pour DELETE
CREATE POLICY "Users can delete their invoice payments"
  ON invoice_payments
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM invoices
      WHERE invoices.id = invoice_payments.invoice_id
      AND invoices.user_id = auth.uid()
    )
  );
