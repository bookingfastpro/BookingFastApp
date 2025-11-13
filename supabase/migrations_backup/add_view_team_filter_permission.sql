/*
  # Ajout de la permission view_team_filter

  1. Modifications
    - Ajoute la permission 'view_team_filter' pour permettre aux membres d'équipe de voir le filtre par membre sur le calendrier
    - Cette permission est automatiquement accordée au propriétaire
    - Les membres d'équipe doivent avoir cette permission explicitement pour voir le filtre

  2. Notes
    - Le propriétaire voit toujours le filtre si le plugin multi-user est actif
    - Les membres d'équipe ne voient le filtre que s'ils ont cette permission ET que le plugin est actif
*/

-- La permission sera gérée au niveau de l'application
-- Pas besoin de modification de schéma, juste documentation de la nouvelle permission

-- Liste des permissions disponibles:
-- - view_calendar: Voir le calendrier
-- - create_booking: Créer des réservations
-- - edit_booking: Modifier ses propres réservations
-- - edit_all_bookings: Modifier toutes les réservations
-- - delete_booking: Supprimer ses propres réservations
-- - delete_all_bookings: Supprimer toutes les réservations
-- - view_clients: Voir les clients
-- - manage_clients: Gérer les clients
-- - view_services: Voir les services
-- - manage_services: Gérer les services
-- - view_reports: Voir les rapports
-- - manage_settings: Gérer les paramètres
-- - view_team_filter: Voir le filtre par membre d'équipe sur le calendrier (NOUVEAU)
