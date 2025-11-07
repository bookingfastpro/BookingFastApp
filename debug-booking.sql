-- 🔍 REQUÊTE DIRECTE POUR VOIR LES DONNÉES DE LA RÉSERVATION
-- Copie cette requête et exécute-la dans Supabase SQL Editor

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
  deposit_amount,
  payment_status,
  booking_status,
  quantity,
  stripe_session_id,
  stripe_payment_intent_id
FROM bookings
WHERE id = '9222ceae-5bf3-4b00-ae12-ac7f83e2483a';

-- 🔍 VOIR AUSSI LE SERVICE ASSOCIÉ
SELECT 
  s.id,
  s.name,
  s.price_ttc,
  s.duration_minutes,
  bs.default_deposit_percentage,
  bs.deposit_type,
  bs.deposit_fixed_amount,
  bs.multiply_deposit_by_services
FROM services s
LEFT JOIN business_settings bs ON bs.user_id = s.user_id
WHERE s.id = (
  SELECT service_id 
  FROM bookings 
  WHERE id = '9222ceae-5bf3-4b00-ae12-ac7f83e2483a'
);
