/*
  # Reconstruction complète du système d'authentification

  1. Nettoyage complet
    - Suppression de tous les triggers et fonctions existants
    - Suppression et recréation de la table users
    
  2. Nouvelle table users
    - `id` (uuid, lié à auth.users)
    - `email` (text, unique)
    - `full_name` (text, optionnel)
    - `is_super_admin` (boolean, défaut false)
    - `subscription_status` (enum)
    - `trial_started_at` et `trial_ends_at` (timestamps)
    - `created_at` et `updated_at` (timestamps)
    
  3. Fonction de création d'utilisateur
    - Fonction sécurisée pour créer un profil utilisateur
    - Gestion automatique de l'essai gratuit de 7 jours
    - Gestion des erreurs robuste
    
  4. Trigger d'authentification
    - Trigger sur auth.users pour création automatique du profil
    - Exécution sécurisée avec gestion d'erreur
    
  5. Politiques RLS
    - Politiques pour permettre la création automatique
    - Politiques pour la lecture/modification des profils
    - Politiques pour les super admins
    
  6. Fonction de vérification d'accès
    - Fonction pour vérifier si un utilisateur a un accès valide
    - Prise en compte des essais gratuits et abonnements
*/

-- 1. NETTOYAGE COMPLET
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP TRIGGER IF EXISTS create_user_profile_trigger ON auth.users;
DROP FUNCTION IF EXISTS public.create_user_with_trial() CASCADE;
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;
DROP FUNCTION IF EXISTS public.create_user_profile() CASCADE;
DROP FUNCTION IF EXISTS public.has_valid_access(uuid) CASCADE;

-- Supprimer et recréer la table users
DROP TABLE IF EXISTS public.users CASCADE;

-- 2. CRÉATION DE LA NOUVELLE TABLE USERS
CREATE TABLE public.users (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text UNIQUE NOT NULL,
  full_name text,
  is_super_admin boolean DEFAULT false NOT NULL,
  subscription_status text DEFAULT 'trial' NOT NULL CHECK (subscription_status IN ('trial', 'active', 'expired', 'cancelled')),
  trial_started_at timestamptz DEFAULT now(),
  trial_ends_at timestamptz DEFAULT (now() + interval '7 days'),
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

-- Index pour les performances
CREATE INDEX idx_users_email ON public.users(email);
CREATE INDEX idx_users_subscription_status ON public.users(subscription_status);
CREATE INDEX idx_users_trial_ends_at ON public.users(trial_ends_at);

-- 3. FONCTION DE CRÉATION D'UTILISATEUR SÉCURISÉE
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  trial_end_date timestamptz;
BEGIN
  -- Calculer la date de fin d'essai (7 jours)
  trial_end_date := now() + interval '7 days';
  
  -- Insérer le nouveau profil utilisateur
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
    COALESCE(NEW.raw_user_meta_data->>'full_name', NULL),
    false,
    'trial',
    now(),
    trial_end_date,
    now(),
    now()
  )
  ON CONFLICT (id) DO NOTHING; -- Éviter les doublons
  
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log l'erreur mais ne pas faire échouer l'authentification
    RAISE WARNING 'Erreur création profil utilisateur: %', SQLERRM;
    RETURN NEW;
END;
$$;

-- 4. TRIGGER D'AUTHENTIFICATION
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- 5. FONCTION DE VÉRIFICATION D'ACCÈS
CREATE OR REPLACE FUNCTION public.has_valid_access(user_uuid uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  user_record public.users%ROWTYPE;
  has_active_subscription boolean := false;
  has_valid_code boolean := false;
BEGIN
  -- Récupérer les informations utilisateur
  SELECT * INTO user_record
  FROM public.users
  WHERE id = user_uuid;
  
  -- Si l'utilisateur n'existe pas, pas d'accès
  IF NOT FOUND THEN
    RETURN false;
  END IF;
  
  -- Super admin a toujours accès
  IF user_record.is_super_admin THEN
    RETURN true;
  END IF;
  
  -- Vérifier l'abonnement actif
  IF user_record.subscription_status = 'active' THEN
    RETURN true;
  END IF;
  
  -- Vérifier l'essai gratuit
  IF user_record.subscription_status = 'trial' AND 
     user_record.trial_ends_at > now() THEN
    RETURN true;
  END IF;
  
  -- Vérifier les codes d'accès valides
  SELECT EXISTS(
    SELECT 1 
    FROM public.code_redemptions cr
    JOIN public.access_codes ac ON cr.code_id = ac.id
    WHERE cr.user_id = user_uuid
      AND ac.is_active = true
      AND (cr.access_granted_until IS NULL OR cr.access_granted_until > now())
  ) INTO has_valid_code;
  
  IF has_valid_code THEN
    RETURN true;
  END IF;
  
  -- Aucun accès valide trouvé
  RETURN false;
END;
$$;

-- 6. POLITIQUES RLS
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Politique pour permettre la lecture de son propre profil
CREATE POLICY "Users can read own profile"
  ON public.users
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

-- Politique pour permettre la mise à jour de son propre profil
CREATE POLICY "Users can update own profile"
  ON public.users
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Politique pour les super admins (lecture de tous les profils)
CREATE POLICY "Super admins can read all users"
  ON public.users
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE id = auth.uid() AND is_super_admin = true
    )
  );

-- Politique pour les super admins (modification de tous les profils)
CREATE POLICY "Super admins can update all users"
  ON public.users
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE id = auth.uid() AND is_super_admin = true
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE id = auth.uid() AND is_super_admin = true
    )
  );

-- Politique pour permettre l'insertion par le service role (pour les triggers)
CREATE POLICY "Service role can insert users"
  ON public.users
  FOR INSERT
  TO service_role
  WITH CHECK (true);

-- Politique pour permettre la lecture par le service role
CREATE POLICY "Service role can read users"
  ON public.users
  FOR SELECT
  TO service_role
  USING (true);

-- 7. CRÉER UN SUPER ADMIN PAR DÉFAUT (optionnel)
-- Vous pouvez décommenter et modifier l'email ci-dessous pour créer un super admin
/*
INSERT INTO auth.users (
  id,
  email,
  encrypted_password,
  email_confirmed_at,
  created_at,
  updated_at,
  confirmation_token,
  recovery_token
) VALUES (
  gen_random_uuid(),
  'admin@bookingpro.com',
  crypt('admin123', gen_salt('bf')),
  now(),
  now(),
  now(),
  '',
  ''
) ON CONFLICT (email) DO NOTHING;
*/

-- 8. FONCTION UTILITAIRE POUR VÉRIFIER SI UN UTILISATEUR EST SUPER ADMIN
CREATE OR REPLACE FUNCTION public.is_super_admin()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.users 
    WHERE id = auth.uid() AND is_super_admin = true
  );
END;
$$;

-- 9. MISE À JOUR AUTOMATIQUE DU TIMESTAMP
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON public.users
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
