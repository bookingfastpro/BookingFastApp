/*
  # Activer Supabase Realtime pour synchronisation multi-appareils

  1. Configuration
    - Active la réplication Realtime pour la table `bookings`
    - Active la réplication Realtime pour la table `unavailabilities`
    - Permet la synchronisation instantanée entre tous les appareils connectés

  2. Sécurité
    - Les RLS existantes continuent de protéger les données
    - Chaque utilisateur ne reçoit que les événements pour ses propres données
*/

-- Activer la réplication Realtime pour bookings
ALTER PUBLICATION supabase_realtime ADD TABLE bookings;

-- Activer la réplication Realtime pour unavailabilities
ALTER PUBLICATION supabase_realtime ADD TABLE unavailabilities;
