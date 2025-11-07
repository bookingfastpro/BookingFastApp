-- 🔍 ÉTAPE 1 : Voir TOUTES les colonnes qui existent
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'bookings' 
ORDER BY ordinal_position;
