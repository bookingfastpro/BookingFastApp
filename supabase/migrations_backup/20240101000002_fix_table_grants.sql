/*
  # Fix PostgreSQL Table Grants

  1. Problème identifié
    - Code erreur 42501 persiste après fix RLS
    - Le rôle 'authenticated' n'a probablement pas les permissions GRANT sur la table

  2. Solution
    - Donner explicitement les permissions GRANT au rôle authenticated
    - Vérifier les permissions sur les séquences aussi

  3. Sécurité
    - Les permissions sont données uniquement au rôle authenticated
    - RLS reste actif pour la sécurité au niveau des lignes
*/

-- Donner toutes les permissions sur la table au rôle authenticated
GRANT ALL ON TABLE google_calendar_tokens TO authenticated;

-- Donner les permissions sur la séquence (pour l'auto-increment de l'ID)
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- Vérifier que RLS est bien activé
ALTER TABLE google_calendar_tokens ENABLE ROW LEVEL SECURITY;

-- Forcer le refresh des permissions
NOTIFY pgrst, 'reload schema';
