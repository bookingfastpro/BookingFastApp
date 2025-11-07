-- 🔍 VOIR LES COLONNES QUI EXISTENT VRAIMENT
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'bookings' 
ORDER BY ordinal_position;

-- 🔍 VOIR LES DONNÉES DE LA RÉSERVATION (sans deposit_amount)
SELECT 
  id,
  created_at,
  service_id,
  date,
  time,
  client_name,
  client_firstname,
  client_email,
  total_amount,
  payment_amount,
  payment_status,
  booking_status,
  quantity,
  stripe_session_id,
  stripe_payment_intent_id,
  transactions
FROM bookings
WHERE id = '9222ceae-5bf3-4b00-ae12-ac7f83e2483a';
