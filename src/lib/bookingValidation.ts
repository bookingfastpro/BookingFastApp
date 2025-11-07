import { BusinessSettings } from '../types';
import { getBusinessTimezone, getCurrentDateInTimezone } from './timezone';

export interface BookingValidationResult {
  isValid: boolean;
  error?: string;
  minimumDateTime?: string;
}

/**
 * Valide si une date/heure de réservation respecte le délai minimum
 * Le délai est calculé par rapport à l'heure exacte du rendez-vous
 */
export function validateBookingDateTime(
  date: string,
  time: string,
  settings: BusinessSettings,
  isPublicBooking: boolean = false
): BookingValidationResult {
  // Si ce n'est pas une réservation publique (backend/admin), autoriser toujours
  if (!isPublicBooking) {
    return { isValid: true };
  }

  const timezone = getBusinessTimezone(settings);
  const minimumDelayHours = settings.minimum_booking_delay_hours || 24;
  
  // Obtenir la date/heure actuelle dans le fuseau horaire de l'entreprise
  const now = new Date();
  
  // Créer la date/heure du rendez-vous dans le fuseau horaire local
  const appointmentDateTime = new Date(`${date}T${time}:00`);
  
  // Calculer la date/heure minimum autorisée (maintenant + délai)
  const minimumDateTime = new Date(now.getTime() + (minimumDelayHours * 60 * 60 * 1000));
  
  // Vérifier si le rendez-vous est trop tôt
  if (appointmentDateTime < minimumDateTime) {
    const hoursUntilAvailable = Math.ceil((minimumDateTime.getTime() - now.getTime()) / (1000 * 60 * 60));
    
    return {
      isValid: false,
      error: `Réservation possible dans ${hoursUntilAvailable}h minimum (délai de ${minimumDelayHours}h requis)`,
      minimumDateTime: minimumDateTime.toISOString()
    };
  }
  
  // Vérifier si c'est dans le passé
  if (appointmentDateTime < now) {
    return {
      isValid: false,
      error: 'Impossible de réserver dans le passé'
    };
  }
  
  return { isValid: true };
}

/**
 * Obtient la prochaine date/heure disponible pour une réservation publique
 */
export function getNextAvailableDateTime(settings: BusinessSettings): { date: string; time: string } {
  const timezone = getBusinessTimezone(settings);
  const minimumDelayHours = settings.minimum_booking_delay_hours || 24;
  
  const now = new Date();
  const minimumDateTime = new Date(now.getTime() + (minimumDelayHours * 60 * 60 * 1000));
  
  const date = minimumDateTime.toLocaleDateString('en-CA', { timeZone: timezone });
  const time = minimumDateTime.toLocaleTimeString('fr-FR', {
    timeZone: timezone,
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  });
  
  return { date, time };
}

/**
 * Vérifie si une date est disponible pour les réservations publiques
 */
export function isDateAvailableForBooking(
  date: string, 
  settings: BusinessSettings, 
  isPublicBooking: boolean = false
): boolean {
  // Si ce n'est pas une réservation publique, autoriser toujours
  if (!isPublicBooking) {
    return true;
  }

  // Pour les réservations publiques, vérifier avec une heure par défaut
  const validation = validateBookingDateTime(date, '09:00', settings, true);
  return validation.isValid || (validation.minimumDateTime && date >= validation.minimumDateTime.split('T')[0]);
}

/**
 * Vérifie si un créneau horaire spécifique est disponible pour les réservations publiques
 */
export function isTimeSlotAvailableForBooking(
  date: string,
  time: string,
  settings: BusinessSettings,
  isPublicBooking: boolean = false
): boolean {
  // Si ce n'est pas une réservation publique, autoriser toujours
  if (!isPublicBooking) {
    return true;
  }

  const validation = validateBookingDateTime(date, time, settings, true);
  return validation.isValid;
}

/**
 * Formate le délai minimum en texte lisible
 */
export function formatMinimumDelay(hours: number): string {
  if (hours < 24) {
    return `${hours} heure${hours > 1 ? 's' : ''}`;
  } else {
    const days = Math.floor(hours / 24);
    const remainingHours = hours % 24;
    
    if (remainingHours === 0) {
      return `${days} jour${days > 1 ? 's' : ''}`;
    } else {
      return `${days} jour${days > 1 ? 's' : ''} et ${remainingHours} heure${remainingHours > 1 ? 's' : ''}`;
    }
  }
}

/**
 * Calcule le temps restant avant qu'un créneau devienne disponible
 */
export function getTimeUntilAvailable(
  date: string,
  time: string,
  settings: BusinessSettings
): number {
  const now = new Date();
  const appointmentDateTime = new Date(`${date}T${time}:00`);
  const minimumDelayHours = settings.minimum_booking_delay_hours || 24;
  const minimumDateTime = new Date(now.getTime() + (minimumDelayHours * 60 * 60 * 1000));
  
  return Math.max(0, minimumDateTime.getTime() - appointmentDateTime.getTime());
}
