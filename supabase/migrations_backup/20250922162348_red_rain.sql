/*
  # Synchronisation automatique des utilisateurs auth.users vers users

  1. Fonction de synchronisation
    - Copie automatiquement les nouveaux utilisateurs de auth.users vers users
    - Calcule la date de fin d'essai (7 jours)
    - Gère les erreurs de façon silencieuse

  2. Trigger automatique
    - Se déclenche à chaque nouvel utilisateur dans auth.users
    - Appelle la fonction de synchronisation

  3. Migration des utilisateurs existants
    - Copie tous les utilisateurs existants de auth.users vers users
    - Évite les doublons avec ON CONFLICT

  4. Sécurité
    - Maintient les politiques RLS existantes
    - Préserve les données existantes
*/

-- Fonction pour synchroniser un utilisateur de auth.users vers users
CREATE OR REPLACE FUNCTION sync_user_to_users_table()
RETURNS TRIGGER AS $$
BEGIN
  -- Insérer le nouvel utilisateur dans la table users
  INSERT INTO public.users (
    id,
    email,
    full_name,
    is_super_admin,
    subscription_status,
    trial_started_at,
    trial_ends_at,
    created_at,
    updated_at
  ) VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    false, -- Par défaut, pas super admin
    'trial',
    NOW(),
    NOW() + INTERVAL '7 days',
    NOW(),
    NOW()
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    full_name = COALESCE(EXCLUDED.full_name, users.full_name),
    updated_at = NOW();

  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- En cas d'erreur, on continue sans faire échouer l'inscription
    RAISE LOG 'Erreur lors de la synchronisation utilisateur %: %', NEW.id, SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Créer le trigger sur auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION sync_user_to_users_table();

-- Migrer tous les utilisateurs existants de auth.users vers users
INSERT INTO public.users (
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
  COALESCE(au.raw_user_meta_data->>'full_name', au.email),
  false, -- Par défaut, pas super admin
  'trial',
  COALESCE(au.created_at, NOW()),
  COALESCE(au.created_at, NOW()) + INTERVAL '7 days',
  COALESCE(au.created_at, NOW()),
  NOW()
FROM auth.users au
WHERE au.email IS NOT NULL
ON CONFLICT (id) DO UPDATE SET
  email = EXCLUDED.email,
  full_name = COALESCE(EXCLUDED.full_name, users.full_name),
  updated_at = NOW();

-- Promouvoir l'utilisateur jetservice2a@gmail.com en super admin
UPDATE public.users 
SET 
  is_super_admin = true,
  subscription_status = 'active',
  trial_ends_at = NOW() + INTERVAL '1 year',
  updated_at = NOW()
WHERE email = 'jetservice2a@gmail.com';
