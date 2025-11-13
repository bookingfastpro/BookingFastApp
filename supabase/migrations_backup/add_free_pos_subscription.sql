/*
  # Ajout d'abonnement gratuit au plugin POS

  1. Modifications
    - Ajoute un abonnement actif au plugin POS pour tous les utilisateurs existants
    - Statut: active
    - Période: illimitée
*/

-- Ajouter un abonnement POS gratuit pour tous les utilisateurs qui n'en ont pas
INSERT INTO plugin_subscriptions (
  user_id,
  plugin_id,
  status,
  current_period_start,
  current_period_end
)
SELECT 
  u.id as user_id,
  p.id as plugin_id,
  'active' as status,
  now() as current_period_start,
  now() + interval '100 years' as current_period_end
FROM auth.users u
CROSS JOIN plugins p
WHERE p.slug = 'pos'
AND NOT EXISTS (
  SELECT 1 
  FROM plugin_subscriptions ps 
  WHERE ps.user_id = u.id 
  AND ps.plugin_id = p.id
)
ON CONFLICT DO NOTHING;

-- Ajouter aussi pour le plugin reports
INSERT INTO plugin_subscriptions (
  user_id,
  plugin_id,
  status,
  current_period_start,
  current_period_end
)
SELECT 
  u.id as user_id,
  p.id as plugin_id,
  'active' as status,
  now() as current_period_start,
  now() + interval '100 years' as current_period_end
FROM auth.users u
CROSS JOIN plugins p
WHERE p.slug = 'reports'
AND NOT EXISTS (
  SELECT 1 
  FROM plugin_subscriptions ps 
  WHERE ps.user_id = u.id 
  AND ps.plugin_id = p.id
)
ON CONFLICT DO NOTHING;
