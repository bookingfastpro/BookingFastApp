/*
  # Désactiver RLS temporairement pour tester

  1. Actions
    - Désactiver RLS sur multi_user_settings
    - Supprimer toutes les policies
    - Ajouter des logs pour debug

  2. Note
    - TEMPORAIRE - pour identifier le problème
    - À réactiver une fois le problème résolu
*/

-- Désactiver RLS
ALTER TABLE multi_user_settings DISABLE ROW LEVEL SECURITY;

-- Supprimer toutes les policies existantes
DROP POLICY IF EXISTS "multi_user_settings_select_policy" ON multi_user_settings;
DROP POLICY IF EXISTS "multi_user_settings_insert_policy" ON multi_user_settings;
DROP POLICY IF EXISTS "multi_user_settings_update_policy" ON multi_user_settings;
DROP POLICY IF EXISTS "multi_user_settings_delete_policy" ON multi_user_settings;

-- Vérifier que RLS est bien désactivé
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_tables 
    WHERE schemaname = 'public' 
    AND tablename = 'multi_user_settings' 
    AND rowsecurity = true
  ) THEN
    RAISE EXCEPTION 'RLS still enabled on multi_user_settings';
  END IF;
  
  RAISE NOTICE 'RLS successfully disabled on multi_user_settings';
END $$;
