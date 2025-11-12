/*
  # Désactiver temporairement le trigger OneSignal
  
  1. Problème
    - Le trigger OneSignal cause des erreurs lors de la suppression de bookings
    - L'erreur persiste malgré les corrections
    
  2. Solution
    - Désactiver complètement le trigger OneSignal
    - Cela permettra les suppressions sans erreur
    
  3. Impact
    - Les notifications OneSignal ne seront plus envoyées automatiquement
    - Les suppressions de bookings fonctionneront normalement
*/

-- Désactiver le trigger OneSignal sur la table notifications
DROP TRIGGER IF EXISTS trigger_send_onesignal_notification ON notifications;

-- Supprimer la fonction pour éviter qu'elle soit appelée ailleurs
DROP FUNCTION IF EXISTS send_onesignal_notification_trigger() CASCADE;
