/*
  # Fix Profile Creation on Signup
  
  ## Problem
  - Profile creation fails because auth.uid() is null right after signup
  - Manual profile creation in app code violates RLS
  
  ## Solution
  1. Create automatic trigger to create profile when user signs up
  2. Update RLS policy to allow service_role to insert profiles
*/

-- Fonction pour créer automatiquement un profil lors de la création d'un utilisateur
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, created_at, updated_at)
  VALUES (
    NEW.id,
    NEW.email,
    NOW(),
    NOW()
  )
  ON CONFLICT (id) DO NOTHING;
  
  RETURN NEW;
END;
$$;

-- Trigger sur auth.users pour créer le profil automatiquement
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Ajouter une politique pour permettre au service_role d'insérer
DROP POLICY IF EXISTS "Service role can insert profiles" ON profiles;
CREATE POLICY "Service role can insert profiles"
  ON profiles
  FOR INSERT
  TO service_role
  WITH CHECK (true);

NOTIFY pgrst, 'reload schema';
