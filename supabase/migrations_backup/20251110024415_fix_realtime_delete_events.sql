/*
  # Corriger les événements DELETE pour Supabase Realtime

  1. Problème
    - Les événements DELETE ne se propagent pas correctement via Realtime
    - La réplica identity par défaut ne contient que la clé primaire
    - Avec RLS, Supabase Realtime a besoin de plus d'informations

  2. Solution
    - Changer la réplica identity de 'DEFAULT' à 'FULL'
    - Permet à Realtime d'envoyer tous les champs dans le payload DELETE
    - Nécessaire pour que les RLS puissent évaluer correctement les permissions

  3. Impact
    - Les événements DELETE seront maintenant correctement propagés
    - Légère augmentation de la taille des événements Realtime
    - Améliore la fiabilité de la synchronisation
*/

-- Changer la réplica identity pour bookings
ALTER TABLE bookings REPLICA IDENTITY FULL;

-- Changer la réplica identity pour unavailabilities
ALTER TABLE unavailabilities REPLICA IDENTITY FULL;
