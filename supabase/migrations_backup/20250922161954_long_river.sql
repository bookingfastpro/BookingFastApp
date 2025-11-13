/*
  # Création de l'utilisateur super admin

  1. Insertion de l'utilisateur
    - Insère l'utilisateur jetservice2a@gmail.com avec les droits super admin
    - Configure l'essai gratuit et les dates appropriées
  
  2. Sécurité
    - Utilise INSERT ... ON CONFLICT pour éviter les doublons
    - Met à jour les informations si l'utilisateur existe déjà
*/

-- Insérer ou mettre à jour l'utilisateur super admin
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
  'jetservice2a@gmail.com',
  'Super Admin',
  true,
  'active',
  now(),
  now() + interval '365 days', -- 1 an d'accès
  now(),
  now()
FROM auth.users au
WHERE au.email = 'jetservice2a@gmail.com'
ON CONFLICT (id) 
DO UPDATE SET
  is_super_admin = true,
  subscription_status = 'active',
  trial_ends_at = now() + interval '365 days',
  updated_at = now();

-- Si l'utilisateur n'existe pas dans auth.users, créer un enregistrement temporaire
-- (cela ne devrait pas arriver en temps normal)
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
  gen_random_uuid(),
  'jetservice2a@gmail.com',
  'Super Admin (Temp)',
  true,
  'active',
  now(),
  now() + interval '365 days',
  now(),
  now()
WHERE NOT EXISTS (
  SELECT 1 FROM auth.users WHERE email = 'jetservice2a@gmail.com'
)
AND NOT EXISTS (
  SELECT 1 FROM users WHERE email = 'jetservice2a@gmail.com'
);
