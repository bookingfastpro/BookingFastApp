/*
  # Grant permissions PostgreSQL pour blocked_date_ranges
  
  1. Permissions de base
    - GRANT SELECT, INSERT, UPDATE, DELETE sur blocked_date_ranges
    - Pour le rôle authenticated
    - Pour le rôle anon (lecture seule)
  
  2. Permissions sur les séquences
    - GRANT USAGE sur les séquences si nécessaire
*/

-- Permissions pour les utilisateurs authentifiés (lecture/écriture complète)
GRANT SELECT, INSERT, UPDATE, DELETE ON blocked_date_ranges TO authenticated;

-- Permissions pour les utilisateurs anonymes (lecture seule pour iframe)
GRANT SELECT ON blocked_date_ranges TO anon;

-- Permissions sur les séquences (si la table utilise des séquences)
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO anon;
