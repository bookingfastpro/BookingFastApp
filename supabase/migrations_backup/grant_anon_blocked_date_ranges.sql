/*
  # Grant SELECT permission pour rôle anon sur blocked_date_ranges
  
  1. Permissions
    - GRANT SELECT sur blocked_date_ranges pour le rôle anon
    - Permet à l'Edge Function publique de lire les plages bloquées
  
  2. Sécurité
    - Lecture seule (SELECT uniquement)
    - RLS reste actif pour filtrer les données
*/

-- Permission SELECT pour le rôle anon (utilisé par Edge Functions publiques)
GRANT SELECT ON blocked_date_ranges TO anon;

-- Vérification des permissions
DO $$
BEGIN
  RAISE NOTICE 'Permissions granted: anon can now SELECT from blocked_date_ranges';
END $$;
