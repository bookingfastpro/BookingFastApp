/*
  # Trigger pour créer automatiquement le profil et les paramètres

  1. Trigger
    - Créer automatiquement un profil lors de l'inscription
    - Créer automatiquement les paramètres business
*/

-- Fonction pour créer le profil et les paramètres
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Créer le profil
  INSERT INTO public.profiles (id, email, created_at, updated_at)
  VALUES (
    NEW.id,
    NEW.email,
    NOW(),
    NOW()
  );
  
  -- Créer les paramètres business par défaut
  INSERT INTO public.business_settings (
    user_id,
    business_name,
    primary_color,
    secondary_color,
    opening_hours,
    buffer_minutes,
    default_deposit_percentage,
    email_notifications,
    created_at,
    updated_at
  )
  VALUES (
    NEW.id,
    'Mon Entreprise',
    '#3B82F6',
    '#8B5CF6',
    '{
      "monday": {"start": "08:00", "end": "18:00", "closed": false},
      "tuesday": {"start": "08:00", "end": "18:00", "closed": false},
      "wednesday": {"start": "08:00", "end": "18:00", "closed": false},
      "thursday": {"start": "08:00", "end": "18:00", "closed": false},
      "friday": {"start": "08:00", "end": "18:00", "closed": false},
      "saturday": {"start": "09:00", "end": "17:00", "closed": false},
      "sunday": {"start": "09:00", "end": "17:00", "closed": true}
    }'::jsonb,
    15,
    30,
    true,
    NOW(),
    NOW()
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Supprimer le trigger s'il existe
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Créer le trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user();
