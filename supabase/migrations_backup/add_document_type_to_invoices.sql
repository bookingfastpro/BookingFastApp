/*
  # Ajout du type de document (devis/facture)

  1. Modifications
    - Ajout de la colonne `document_type` (enum: 'quote', 'invoice')
    - Ajout de la colonne `converted_at` pour tracer la conversion
    - Ajout de la colonne `quote_number` pour les numéros de devis
    - Mise à jour des contraintes et index

  2. Migration des données existantes
    - Les factures existantes sont marquées comme 'invoice'
*/

-- Ajouter le type de document
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'invoices' AND column_name = 'document_type'
  ) THEN
    ALTER TABLE invoices ADD COLUMN document_type text NOT NULL DEFAULT 'quote' CHECK (document_type IN ('quote', 'invoice'));
  END IF;
END $$;

-- Ajouter la date de conversion
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'invoices' AND column_name = 'converted_at'
  ) THEN
    ALTER TABLE invoices ADD COLUMN converted_at timestamptz;
  END IF;
END $$;

-- Ajouter le numéro de devis
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'invoices' AND column_name = 'quote_number'
  ) THEN
    ALTER TABLE invoices ADD COLUMN quote_number text;
  END IF;
END $$;

-- Migrer les données existantes (marquer comme factures)
UPDATE invoices 
SET document_type = 'invoice', 
    converted_at = created_at
WHERE document_type = 'quote';

-- Créer un index pour les performances
CREATE INDEX IF NOT EXISTS idx_invoices_document_type ON invoices(document_type);
CREATE INDEX IF NOT EXISTS idx_invoices_quote_number ON invoices(quote_number);

-- Fonction pour générer le prochain numéro de devis
CREATE OR REPLACE FUNCTION generate_quote_number(p_user_id uuid)
RETURNS text
LANGUAGE plpgsql
AS $$
DECLARE
  v_year text;
  v_count integer;
  v_number text;
BEGIN
  v_year := TO_CHAR(CURRENT_DATE, 'YYYY');
  
  SELECT COUNT(*) + 1 INTO v_count
  FROM invoices
  WHERE user_id = p_user_id
  AND document_type = 'quote'
  AND EXTRACT(YEAR FROM invoice_date) = EXTRACT(YEAR FROM CURRENT_DATE);
  
  v_number := 'D' || v_year || '-' || LPAD(v_count::text, 4, '0');
  
  RETURN v_number;
END;
$$;
