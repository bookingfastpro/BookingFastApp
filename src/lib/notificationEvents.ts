import { supabase } from './supabase';
import { logger } from '../utils/logger';

class NotificationEventEmitter {
  private listeners: { [key: string]: Function[] } = {};

  on(event: string, callback: Function) {
    if (!this.listeners[event]) {
      this.listeners[event] = [];
    }
    this.listeners[event].push(callback);
  }

  off(event: string, callback: Function) {
    if (this.listeners[event]) {
      this.listeners[event] = this.listeners[event].filter(cb => cb !== callback);
    }
  }

  emit(event: string, data?: any) {
    console.log('🔔 Événement notification émis:', event, data);
    if (this.listeners[event]) {
      this.listeners[event].forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error('❌ Erreur dans callback notification:', error);
        }
      });
    }
  }
}

export const notificationEvents = new NotificationEventEmitter();

export async function sendPushForNotification(
  notificationId: string,
  userId: string,
  type: string,
  bookingId: string,
  clientName: string,
  serviceName: string,
  startTime: string
) {
  try {
    const { data: profile } = await supabase
      .from('profiles')
      .select('onesignal_player_id, push_notifications_enabled')
      .eq('id', userId)
      .maybeSingle();

    if (!profile?.onesignal_player_id || !profile?.push_notifications_enabled) {
      logger.debug('User does not have push notifications enabled');
      return;
    }

    const { data: booking } = await supabase
      .from('bookings')
      .select('*, clients(*)')
      .eq('id', bookingId)
      .maybeSingle();

    const clientPhone = booking?.clients?.phone;

    let title = '';
    let message = '';
    let actionType = '';
    let buttons: any[] = [];

    const formattedDate = new Date(startTime).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });

    switch (type) {
      case 'booking_created':
        title = 'Nouvelle réservation';
        message = `Réservation créée pour ${clientName} - ${serviceName} le ${formattedDate}`;
        actionType = 'booking_created';
        buttons = [
          { id: 'view', text: 'Voir', url: `/calendar?bookingId=${bookingId}` },
          { id: 'call', text: 'Appeler', url: `tel:${clientPhone || ''}` }
        ];
        break;
      case 'booking_updated':
        title = 'Réservation modifiée';
        message = `Réservation modifiée pour ${clientName} - ${serviceName} le ${formattedDate}`;
        actionType = 'booking_updated';
        buttons = [
          { id: 'view', text: 'Voir changements', url: `/calendar?bookingId=${bookingId}` },
          { id: 'confirm', text: 'Confirmer', url: `/calendar?bookingId=${bookingId}&action=confirm` }
        ];
        break;
      case 'booking_cancelled':
        title = 'Réservation annulée';
        message = `Réservation annulée pour ${clientName} - ${serviceName} le ${formattedDate}`;
        actionType = 'booking_cancelled';
        buttons = [
          { id: 'view', text: 'Voir détails', url: `/calendar?bookingId=${bookingId}` },
          { id: 'contact', text: 'Contacter', url: `/calendar?bookingId=${bookingId}&action=contact` }
        ];
        break;
    }

    logger.info('🔔 Sending OneSignal push notification:', { title, message, actionType });

    const { data, error } = await supabase.functions.invoke('send-onesignal-notification', {
      body: {
        playerId: profile.onesignal_player_id,
        title,
        message,
        data: {
          bookingId,
          type: actionType,
          clientPhone: clientPhone || ''
        },
        buttons
      }
    });

    if (error) {
      logger.error('Failed to send OneSignal notification:', error);
      throw error;
    }

    logger.info('✅ OneSignal notification sent successfully:', data);

    await supabase.rpc('mark_notification_push_sent', {
      p_notification_id: notificationId
    });

  } catch (error) {
    logger.error('❌ Error sending push notification:', error);
  }
}
