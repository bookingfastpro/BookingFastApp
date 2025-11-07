import { supabase } from './supabase';
import { Booking } from '../types';

interface GoogleCalendarEvent {
  summary: string;
  description: string;
  start: {
    dateTime: string;
    timeZone: string;
  };
  end: {
    dateTime: string;
    timeZone: string;
  };
  attendees?: Array<{
    email: string;
    displayName?: string;
  }>;
}

export class GoogleCalendarService {
  /**
   * Récupère l'ID du propriétaire pour un utilisateur donné
   * Si l'utilisateur est membre d'équipe, retourne l'owner_id
   * Sinon, retourne l'ID de l'utilisateur lui-même
   */
  private static async getOwnerId(userId: string): Promise<string> {
    try {
      const { data: teamMember } = await supabase
        .from('team_members')
        .select('owner_id, is_active')
        .eq('user_id', userId)
        .eq('is_active', true)
        .maybeSingle();

      if (teamMember?.owner_id) {
        console.log('👤 Membre d\'équipe - utilisation owner_id:', teamMember.owner_id);
        return teamMember.owner_id;
      }

      console.log('👑 Propriétaire - utilisation user_id:', userId);
      return userId;
    } catch (error) {
      console.error('❌ Erreur récupération owner_id:', error);
      return userId;
    }
  }

  /**
   * Rafraîchit le token d'accès Google Calendar
   * Utilise le refresh_token pour obtenir un nouveau access_token
   */
  private static async refreshAccessToken(ownerId: string, refreshToken: string): Promise<string | null> {
    try {
      const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
      const clientSecret = import.meta.env.VITE_GOOGLE_CLIENT_SECRET;

      if (!clientId || !clientSecret) {
        console.error('❌ Configuration OAuth manquante (VITE_GOOGLE_CLIENT_ID ou VITE_GOOGLE_CLIENT_SECRET)');
        return null;
      }

      console.log('🔄 Rafraîchissement du token pour owner_id:', ownerId);

      // Appel à l'API Google OAuth2 pour rafraîchir le token
      const response = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          client_id: clientId,
          client_secret: clientSecret,
          refresh_token: refreshToken,
          grant_type: 'refresh_token',
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('❌ Erreur rafraîchissement token:', errorData);
        throw new Error(`Erreur rafraîchissement: ${errorData.error_description || errorData.error}`);
      }

      const data = await response.json();
      
      // Calculer la nouvelle date d'expiration (expires_in est en secondes)
      const newExpiry = new Date(Date.now() + data.expires_in * 1000);

      console.log('✅ Nouveau token obtenu, expiration:', newExpiry.toISOString());

      // Mettre à jour le token dans la base de données
      const { error: updateError } = await supabase
        .from('google_calendar_tokens')
        .update({
          access_token: data.access_token,
          token_expiry: newExpiry.toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', ownerId);

      if (updateError) {
        console.error('❌ Erreur mise à jour token en base:', updateError);
        throw updateError;
      }

      console.log('✅ Token rafraîchi et sauvegardé avec succès');
      return data.access_token;
    } catch (error) {
      console.error('❌ Erreur critique lors du rafraîchissement du token:', error);
      return null;
    }
  }

  /**
   * Vérifie si le token est expiré ou va expirer dans les 5 prochaines minutes
   */
  private static isTokenExpired(tokenExpiry: string): boolean {
    const expiryDate = new Date(tokenExpiry);
    const now = new Date();
    
    // Ajouter une marge de 5 minutes pour éviter les expirations pendant les requêtes
    const bufferTime = 5 * 60 * 1000; // 5 minutes en millisecondes
    const expiryWithBuffer = new Date(expiryDate.getTime() - bufferTime);
    
    const isExpired = now >= expiryWithBuffer;
    
    if (isExpired) {
      console.log('⚠️ Token expiré ou expire bientôt');
      console.log('   Expiration:', expiryDate.toISOString());
      console.log('   Maintenant:', now.toISOString());
    }
    
    return isExpired;
  }

  /**
   * Récupère le token d'accès Google Calendar
   * Rafraîchit automatiquement si expiré
   * ACCESSIBLE PUBLIQUEMENT pour les membres d'équipe
   */
  static async getAccessToken(userId: string): Promise<string | null> {
    try {
      // Récupérer le token du propriétaire
      const ownerId = await this.getOwnerId(userId);
      console.log('🔍 Récupération token pour owner_id:', ownerId);

      const { data, error } = await supabase
        .from('google_calendar_tokens')
        .select('access_token, token_expiry, refresh_token')
        .eq('user_id', ownerId)
        .maybeSingle();

      if (error) {
        console.error('❌ Erreur Supabase lors de la récupération du token:', error);
        console.error('   Code:', error.code);
        console.error('   Message:', error.message);
        console.error('   Details:', error.details);
        return null;
      }

      if (!data) {
        console.log('❌ Token non trouvé pour owner_id:', ownerId);
        return null;
      }

      console.log('✅ Token trouvé en base de données');

      // Vérifier si le token est expiré ou va expirer bientôt
      if (this.isTokenExpired(data.token_expiry)) {
        console.log('🔄 Token expiré, rafraîchissement automatique...');
        
        // Rafraîchir le token
        const newToken = await this.refreshAccessToken(ownerId, data.refresh_token);
        
        if (!newToken) {
          console.error('❌ Impossible de rafraîchir le token');
          return null;
        }
        
        return newToken;
      }

      console.log('✅ Token valide trouvé (expire:', data.token_expiry, ')');
      return data.access_token;
    } catch (error) {
      console.error('❌ Erreur récupération token:', error);
      return null;
    }
  }

  private static async getCalendarId(userId: string): Promise<string | null> {
    try {
      // Récupérer le calendar_id du propriétaire
      const ownerId = await this.getOwnerId(userId);
      console.log('🔍 Récupération calendar_id pour owner_id:', ownerId);

      const { data } = await supabase
        .from('business_settings')
        .select('google_calendar_id, google_calendar_enabled')
        .eq('user_id', ownerId)
        .maybeSingle();

      if (!data || !data.google_calendar_enabled) {
        console.log('❌ Google Calendar non activé pour owner_id:', ownerId);
        return null;
      }

      console.log('✅ Calendar ID trouvé:', data.google_calendar_id || 'primary');
      return data.google_calendar_id || 'primary';
    } catch (error) {
      console.error('❌ Erreur récupération calendar ID:', error);
      return null;
    }
  }

  static async createEvent(booking: Booking, userId: string): Promise<string | null> {
    try {
      console.log('📅 Création événement Google Calendar pour booking:', booking.id);
      console.log('👤 User ID:', userId);

      const accessToken = await this.getAccessToken(userId);
      const calendarId = await this.getCalendarId(userId);

      if (!accessToken || !calendarId) {
        console.log('❌ Token ou Calendar ID manquant');
        return null;
      }

      // Construire l'événement
      const startDateTime = new Date(`${booking.date}T${booking.time}`);
      const endDateTime = new Date(startDateTime.getTime() + booking.duration_minutes * 60000);

      const serviceName = booking.custom_service_data?.name || booking.service?.name || 'Réservation';
      const clientName = `${booking.client_firstname} ${booking.client_name}`;

      const event: GoogleCalendarEvent = {
        summary: `${serviceName} - ${clientName}`,
        description: `
📋 Réservation BookingFast

👤 Client: ${clientName}
📧 Email: ${booking.client_email}
📞 Téléphone: ${booking.client_phone}
🎯 Service: ${serviceName}
👥 Quantité: ${booking.quantity}
💰 Montant: ${booking.total_amount.toFixed(2)}€
${booking.notes ? `\n📝 Notes: ${booking.notes}` : ''}

Statut: ${booking.booking_status === 'confirmed' ? '✅ Confirmée' : booking.booking_status === 'cancelled' ? '❌ Annulée' : '⏳ En attente'}
Paiement: ${booking.payment_status === 'completed' ? '✅ Payé' : booking.payment_status === 'partial' ? '💵 Partiel' : '❌ Non payé'}
        `.trim(),
        start: {
          dateTime: startDateTime.toISOString(),
          timeZone: 'Europe/Paris',
        },
        end: {
          dateTime: endDateTime.toISOString(),
          timeZone: 'Europe/Paris',
        },
        attendees: [
          {
            email: booking.client_email,
            displayName: clientName,
          },
        ],
      };

      console.log('📤 Envoi événement à Google Calendar...');

      // Créer l'événement via l'API Google Calendar
      const response = await fetch(
        `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(event),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Erreur API Google Calendar: ${errorData.error?.message || 'Erreur inconnue'}`);
      }

      const createdEvent = await response.json();
      console.log('✅ Événement créé avec succès:', createdEvent.id);

      // Mettre à jour la réservation avec l'ID de l'événement
      await supabase
        .from('bookings')
        .update({ google_calendar_event_id: createdEvent.id })
        .eq('id', booking.id);

      return createdEvent.id;
    } catch (error) {
      console.error('❌ Erreur création événement Google Calendar:', error);
      return null;
    }
  }

  static async updateEvent(booking: Booking, userId: string): Promise<boolean> {
    try {
      console.log('📝 Mise à jour événement Google Calendar pour booking:', booking.id);

      if (!booking.google_calendar_event_id) {
        console.log('ℹ️ Pas d\'event_id, création d\'un nouvel événement');
        await this.createEvent(booking, userId);
        return true;
      }

      const accessToken = await this.getAccessToken(userId);
      const calendarId = await this.getCalendarId(userId);

      if (!accessToken || !calendarId) {
        console.log('❌ Token ou Calendar ID manquant');
        return false;
      }

      // Construire l'événement mis à jour
      const startDateTime = new Date(`${booking.date}T${booking.time}`);
      const endDateTime = new Date(startDateTime.getTime() + booking.duration_minutes * 60000);

      const serviceName = booking.custom_service_data?.name || booking.service?.name || 'Réservation';
      const clientName = `${booking.client_firstname} ${booking.client_name}`;

      const event: GoogleCalendarEvent = {
        summary: `${serviceName} - ${clientName}`,
        description: `
📋 Réservation BookingFast

👤 Client: ${clientName}
📧 Email: ${booking.client_email}
📞 Téléphone: ${booking.client_phone}
🎯 Service: ${serviceName}
👥 Quantité: ${booking.quantity}
💰 Montant: ${booking.total_amount.toFixed(2)}€
${booking.notes ? `\n📝 Notes: ${booking.notes}` : ''}

Statut: ${booking.booking_status === 'confirmed' ? '✅ Confirmée' : booking.booking_status === 'cancelled' ? '❌ Annulée' : '⏳ En attente'}
Paiement: ${booking.payment_status === 'completed' ? '✅ Payé' : booking.payment_status === 'partial' ? '💵 Partiel' : '❌ Non payé'}
        `.trim(),
        start: {
          dateTime: startDateTime.toISOString(),
          timeZone: 'Europe/Paris',
        },
        end: {
          dateTime: endDateTime.toISOString(),
          timeZone: 'Europe/Paris',
        },
        attendees: [
          {
            email: booking.client_email,
            displayName: clientName,
          },
        ],
      };

      console.log('📤 Mise à jour événement Google Calendar...');

      // Mettre à jour l'événement via l'API Google Calendar
      const response = await fetch(
        `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events/${booking.google_calendar_event_id}`,
        {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(event),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Erreur API Google Calendar: ${errorData.error?.message || 'Erreur inconnue'}`);
      }

      console.log('✅ Événement mis à jour avec succès');
      return true;
    } catch (error) {
      console.error('❌ Erreur mise à jour événement Google Calendar:', error);
      return false;
    }
  }

  static async deleteEvent(eventId: string, userId: string): Promise<boolean> {
    try {
      console.log('🗑️ Suppression événement Google Calendar:', eventId);

      const accessToken = await this.getAccessToken(userId);
      const calendarId = await this.getCalendarId(userId);

      if (!accessToken || !calendarId) {
        console.log('❌ Token ou Calendar ID manquant');
        return false;
      }

      // Supprimer l'événement via l'API Google Calendar
      const response = await fetch(
        `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events/${eventId}`,
        {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
          },
        }
      );

      if (!response.ok && response.status !== 404) {
        const errorData = await response.json();
        throw new Error(`Erreur API Google Calendar: ${errorData.error?.message || 'Erreur inconnue'}`);
      }

      console.log('✅ Événement supprimé avec succès');
      return true;
    } catch (error) {
      console.error('❌ Erreur suppression événement Google Calendar:', error);
      return false;
    }
  }

  /**
   * Vérifie manuellement l'état du token (pour debugging)
   */
  static async checkTokenStatus(userId: string): Promise<{
    hasToken: boolean;
    isExpired: boolean;
    expiresAt?: string;
    timeUntilExpiry?: string;
  }> {
    try {
      const ownerId = await this.getOwnerId(userId);
      console.log('🔍 Vérification statut token pour owner_id:', ownerId);
      
      const { data, error } = await supabase
        .from('google_calendar_tokens')
        .select('token_expiry')
        .eq('user_id', ownerId)
        .maybeSingle();

      if (error) {
        console.error('❌ Erreur vérification statut token:', error);
        console.error('   Code:', error.code);
        console.error('   Message:', error.message);
        return { hasToken: false, isExpired: true };
      }

      if (!data) {
        console.log('⚠️ Aucun token trouvé pour owner_id:', ownerId);
        return { hasToken: false, isExpired: true };
      }

      const expiryDate = new Date(data.token_expiry);
      const now = new Date();
      const isExpired = this.isTokenExpired(data.token_expiry);
      const timeUntilExpiry = Math.floor((expiryDate.getTime() - now.getTime()) / 1000 / 60); // en minutes

      console.log('✅ Token trouvé - Expire:', data.token_expiry);
      console.log('   Expiré:', isExpired);
      console.log('   Temps restant:', timeUntilExpiry, 'minutes');

      return {
        hasToken: true,
        isExpired,
        expiresAt: data.token_expiry,
        timeUntilExpiry: `${timeUntilExpiry} minutes`,
      };
    } catch (error) {
      console.error('❌ Erreur vérification statut token:', error);
      return { hasToken: false, isExpired: true };
    }
  }
}
