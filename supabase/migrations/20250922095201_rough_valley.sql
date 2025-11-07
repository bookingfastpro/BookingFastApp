/*
  # Ajouter le système de transactions pour les réservations

  1. Nouvelles colonnes
    - Ajouter des colonnes pour gérer les transactions multiples
    - Garder la compatibilité avec l'existant

  2. Sécurité
    - Maintenir les politiques RLS existantes
*/

-- Ajouter une colonne pour stocker les transactions en JSON
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'bookings' AND column_name = 'transactions'
  ) THEN
    ALTER TABLE bookings ADD COLUMN transactions jsonb DEFAULT '[]'::jsonb;
  END IF;
END $$;

-- Ajouter un index sur les transactions pour les requêtes
CREATE INDEX IF NOT EXISTS idx_bookings_transactions ON bookings USING gin (transactions);

-- Fonction pour calculer le total payé à partir des transactions
CREATE OR REPLACE FUNCTION calculate_payment_amount(transactions_data jsonb)
RETURNS numeric AS $$
BEGIN
  IF transactions_data IS NULL OR jsonb_array_length(transactions_data) = 0 THEN
    RETURN 0;
  END IF;
  
  RETURN (
    SELECT COALESCE(SUM((transaction->>'amount')::numeric), 0)
    FROM jsonb_array_elements(transactions_data) AS transaction
  );
END;
$$ LANGUAGE plpgsql;

-- Trigger pour mettre à jour automatiquement payment_amount quand transactions change
CREATE OR REPLACE FUNCTION update_payment_amount_from_transactions()
RETURNS TRIGGER AS $$
BEGIN
  NEW.payment_amount = calculate_payment_amount(NEW.transactions);
  
  -- Mettre à jour le statut de paiement
  IF NEW.payment_amount = 0 THEN
    NEW.payment_status = 'pending';
  ELSIF NEW.payment_amount >= NEW.total_amount THEN
    NEW.payment_status = 'completed';
  ELSE
    NEW.payment_status = 'partial';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Créer le trigger
DROP TRIGGER IF EXISTS trigger_update_payment_amount ON bookings;
CREATE TRIGGER trigger_update_payment_amount
  BEFORE INSERT OR UPDATE OF transactions ON bookings
  FOR EACH ROW
  EXECUTE FUNCTION update_payment_amount_from_transactions();
