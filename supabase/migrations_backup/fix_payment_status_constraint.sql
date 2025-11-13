/*
  # Correction de la contrainte payment_status

  1. Modifications
    - Supprime l'ancienne contrainte bookings_payment_status_check
    - Crée une nouvelle contrainte qui inclut 'paid'

  2. Valeurs autorisées
    - 'pending' : En attente
    - 'partial' : Acompte payé
    - 'paid' : Payé intégralement
    - 'completed' : Complété (alias de paid)
*/

-- Supprimer l'ancienne contrainte
ALTER TABLE bookings 
DROP CONSTRAINT IF EXISTS bookings_payment_status_check;

-- Créer la nouvelle contrainte avec 'paid' inclus
ALTER TABLE bookings 
ADD CONSTRAINT bookings_payment_status_check 
CHECK (payment_status IN ('pending', 'partial', 'paid', 'completed'));

-- Vérifier la contrainte
SELECT 
  conname as constraint_name,
  pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint
WHERE conname = 'bookings_payment_status_check';
