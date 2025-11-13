/*
  # Synchronisation forcée de tous les utilisateurs

  1. Objectif
    - Copier TOUS les utilisateurs de auth.users vers la table users
    - Corriger le problème d'affichage dans l'interface super admin
    - Assurer que tous les utilisateurs existants sont visibles

  2. Actions
    - Insertion de tous les utilisateurs auth.users dans users
    - Gestion des conflits avec UPSERT
    - Calcul automatique des dates d'essai
    - Préservation des données existantes

  3. Sécurité
    - Utilise UPSERT pour éviter les doublons
    - Préserve les données existantes (is_super_admin, etc.)
    - Calcule les dates d'essai pour les nouveaux utilisateurs
*/

-- Synchroniser tous les utilisateurs de auth.users vers users
INSERT INTO users (
  id,
  email,
  full_name,
  is_super_admin,
  subscription_status,
  trial_started_at,
  trial_ends_at,
  created_at,
  updated_at
)
SELECT 
  au.id,
  au.email,
  COALESCE(au.raw_user_meta_data->>'full_name', au.raw_user_meta_data->>'name'),
  CASE 
    WHEN au.email = 'jetservice2a@gmail.com' THEN true
    ELSE false
  END as is_super_admin,
  'trial' as subscription_status,
  au.created_at as trial_started_at,
  (au.created_at + interval '7 days') as trial_ends_at,
  au.created_at,
  au.updated_at
FROM auth.users au
ON CONFLICT (id) DO UPDATE SET
  email = EXCLUDED.email,
  full_name = COALESCE(users.full_name, EXCLUDED.full_name),
  -- Préserver is_super_admin existant, sinon utiliser la nouvelle valeur
  is_super_admin = COALESCE(users.is_super_admin, EXCLUDED.is_super_admin),
  -- Préserver subscription_status existant, sinon utiliser trial
  subscription_status = COALESCE(users.subscription_status, EXCLUDED.subscription_status),
  -- Préserver les dates d'essai existantes
  trial_started_at = COALESCE(users.trial_started_at, EXCLUDED.trial_started_at),
  trial_ends_at = COALESCE(users.trial_ends_at, EXCLUDED.trial_ends_at),
  updated_at = now();

-- Afficher le résultat
DO $$
DECLARE
  user_count INTEGER;
  super_admin_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO user_count FROM users;
  SELECT COUNT(*) INTO super_admin_count FROM users WHERE is_super_admin = true;
  
  RAISE NOTICE 'Synchronisation terminée:';
  RAISE NOTICE '- % utilisateurs au total', user_count;
  RAISE NOTICE '- % super administrateurs', super_admin_count;
END $$;
