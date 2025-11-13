/*
  # Correction du type de retour de get_booking_history
  
  1. Modifications
    - Modifier la fonction get_booking_history pour caster l'email en text
    - Cela résout l'erreur 42804 de PostgreSQL
*/

-- Recréer la fonction avec le cast approprié
CREATE OR REPLACE FUNCTION get_booking_history(booking_id_param uuid)
RETURNS TABLE (
  id uuid,
  event_type text,
  event_data jsonb,
  description text,
  created_at timestamptz,
  user_email text
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    bh.id,
    bh.event_type,
    bh.event_data,
    bh.description,
    bh.created_at,
    u.email::text as user_email
  FROM booking_history bh
  LEFT JOIN auth.users u ON u.id = bh.user_id
  WHERE bh.booking_id = booking_id_param
  ORDER BY bh.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
