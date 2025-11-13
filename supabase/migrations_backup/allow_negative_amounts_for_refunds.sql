/*
  # Autoriser les montants négatifs pour les remboursements

  1. Modifications
    - Supprimer la contrainte `amount > 0`
    - Ajouter une nouvelle contrainte `amount != 0` (pas de montant nul)
  
  2. Raison
    - Permettre les remboursements (montants négatifs)
    - Empêcher les paiements de 0€
*/

-- Supprimer l'ancienne contrainte
ALTER TABLE invoice_payments 
DROP CONSTRAINT IF EXISTS invoice_payments_amount_check;

-- Ajouter la nouvelle contrainte (montant différent de zéro)
ALTER TABLE invoice_payments 
ADD CONSTRAINT invoice_payments_amount_check CHECK (amount != 0);
