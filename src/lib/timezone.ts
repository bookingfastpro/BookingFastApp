// Utilitaires pour la gestion des fuseaux horaires

export interface TimezoneInfo {
  timezone: string;
  offset: string;
  name: string;
}

// Obtenir le fuseau horaire depuis les paramètres ou par défaut
export const getBusinessTimezone = (settings?: { timezone?: string }): string => {
  return settings?.timezone || 'Europe/Paris';
};

// Convertir une date UTC vers le fuseau horaire de l'entreprise
export const toBusinessTimezone = (date: Date | string, timezone: string = 'Europe/Paris'): Date => {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  
  // Créer une nouvelle date dans le fuseau horaire spécifié
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  });
  
  const parts = formatter.formatToParts(dateObj);
  const year = parseInt(parts.find(p => p.type === 'year')?.value || '0');
  const month = parseInt(parts.find(p => p.type === 'month')?.value || '0') - 1;
  const day = parseInt(parts.find(p => p.type === 'day')?.value || '0');
  const hour = parseInt(parts.find(p => p.type === 'hour')?.value || '0');
  const minute = parseInt(parts.find(p => p.type === 'minute')?.value || '0');
  const second = parseInt(parts.find(p => p.type === 'second')?.value || '0');
  
  return new Date(year, month, day, hour, minute, second);
};

// Convertir du fuseau horaire de l'entreprise vers UTC
export const fromBusinessTimezone = (date: Date | string, timezone: string = 'Europe/Paris'): Date => {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  
  // Si la date n'a pas d'information de fuseau, on assume qu'elle est dans le fuseau de l'entreprise
  const localDateString = dateObj.toISOString().slice(0, 19); // YYYY-MM-DDTHH:mm:ss
  
  // Créer une date en assumant qu'elle est dans le fuseau de l'entreprise
  const tempDate = new Date(localDateString);
  
  // Obtenir l'offset du fuseau horaire
  const formatter = new Intl.DateTimeFormat('en', {
    timeZone: timezone,
    timeZoneName: 'longOffset'
  });
  
  const offsetString = formatter.formatToParts(tempDate).find(part => part.type === 'timeZoneName')?.value;
  
  if (offsetString) {
    // Parser l'offset (ex: "GMT+01:00" -> +1)
    const match = offsetString.match(/GMT([+-])(\d{2}):(\d{2})/);
    if (match) {
      const sign = match[1] === '+' ? 1 : -1;
      const hours = parseInt(match[2]);
      const minutes = parseInt(match[3]);
      const offsetMs = sign * (hours * 60 + minutes) * 60 * 1000;
      
      return new Date(tempDate.getTime() - offsetMs);
    }
  }
  
  return tempDate;
};

// Formater une date dans le fuseau horaire de l'entreprise
export const formatInBusinessTimezone = (
  date: Date | string, 
  timezone: string = 'Europe/Paris',
  options: Intl.DateTimeFormatOptions = {}
): string => {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  
  return dateObj.toLocaleString('fr-FR', {
    timeZone: timezone,
    ...options
  });
};

// Obtenir la date actuelle dans le fuseau horaire de l'entreprise
export const getCurrentDateInTimezone = (timezone?: string): string => {
  // Utiliser la vraie date locale du navigateur sans conversion
  const now = new Date();
  const year = now.getFullYear();
  const month = (now.getMonth() + 1).toString().padStart(2, '0');
  const day = now.getDate().toString().padStart(2, '0');
  return `${year}-${month}-${day}`;
};

// Obtenir la date et heure actuelles dans le fuseau horaire de l'entreprise
export const getCurrentDateTimeInTimezone = (timezone: string = 'Europe/Paris'): { date: string; time: string } => {
  const now = new Date();
  
  const dateFormatter = new Intl.DateTimeFormat('sv-SE', {
    timeZone: timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  });
  
  const timeFormatter = new Intl.DateTimeFormat('en-GB', {
    timeZone: timezone,
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  });
  
  return {
    date: dateFormatter.format(now),
    time: timeFormatter.format(now)
  };
};

// Obtenir l'heure actuelle dans le fuseau horaire de l'entreprise
export const getCurrentTimeInTimezone = (timezone: string = 'Europe/Paris'): string => {
  const now = new Date();
  return formatInBusinessTimezone(now, timezone, {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  });
};

// Vérifier si une date est dans le passé selon le fuseau horaire de l'entreprise
export const isPastDateInTimezone = (date: string, timezone: string = 'Europe/Paris'): boolean => {
  const today = getCurrentDateInTimezone(timezone);
  return date < today;
};

// Obtenir les informations du fuseau horaire
export const getTimezoneInfo = (timezone: string): TimezoneInfo => {
  const now = new Date();
  
  const formatter = new Intl.DateTimeFormat('fr-FR', {
    timeZone: timezone,
    timeZoneName: 'longOffset'
  });
  
  const parts = formatter.formatToParts(now);
  const offsetPart = parts.find(part => part.type === 'timeZoneName');
  const offset = offsetPart?.value || 'UTC';
  
  const nameFormatter = new Intl.DateTimeFormat('fr-FR', {
    timeZone: timezone,
    timeZoneName: 'long'
  });
  
  const nameParts = nameFormatter.formatToParts(now);
  const namePart = nameParts.find(part => part.type === 'timeZoneName');
  const name = namePart?.value || timezone;
  
  return {
    timezone,
    offset,
    name
  };
};

// Liste des fuseaux horaires populaires
export const POPULAR_TIMEZONES = [
  { value: 'Europe/Paris', label: 'Europe/Paris (France, Belgique)', region: 'Europe' },
  { value: 'Europe/Berlin', label: 'Europe/Berlin (Allemagne, Autriche)', region: 'Europe' },
  { value: 'Europe/Rome', label: 'Europe/Rome (Italie, Espagne)', region: 'Europe' },
  { value: 'Europe/London', label: 'Europe/London (Royaume-Uni)', region: 'Europe' },
  { value: 'Europe/Zurich', label: 'Europe/Zurich (Suisse)', region: 'Europe' },
  { value: 'America/New_York', label: 'America/New_York (EST)', region: 'Amérique du Nord' },
  { value: 'America/Los_Angeles', label: 'America/Los_Angeles (PST)', region: 'Amérique du Nord' },
  { value: 'America/Toronto', label: 'America/Toronto (Canada)', region: 'Amérique du Nord' },
  { value: 'Asia/Tokyo', label: 'Asia/Tokyo (Japon)', region: 'Asie' },
  { value: 'Australia/Sydney', label: 'Australia/Sydney (Australie)', region: 'Océanie' },
  { value: 'UTC', label: 'UTC (Temps universel)', region: 'Universel' }
];
