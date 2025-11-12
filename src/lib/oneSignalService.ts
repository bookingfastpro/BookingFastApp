import OneSignal from 'react-onesignal';
import { supabase } from './supabase';
import { logger } from '../utils/logger';

export interface OneSignalConfig {
  appId: string;
  allowLocalhostAsSecureOrigin?: boolean;
  autoRegister?: boolean;
  notifyButton?: {
    enable: boolean;
  };
}

class OneSignalService {
  private initialized = false;
  private initializationPromise: Promise<void> | null = null;

  async initialize(appId: string): Promise<void> {
    if (this.initialized) {
      logger.debug('OneSignal already initialized');
      return;
    }

    if (this.initializationPromise) {
      return this.initializationPromise;
    }

    this.initializationPromise = (async () => {
      try {
        logger.info('🔔 Initializing OneSignal with App ID:', appId);

        await OneSignal.init({
          appId,
          allowLocalhostAsSecureOrigin: true,
          notifyButton: {
            enable: false,
          },
        });

        this.initialized = true;
        logger.info('✅ OneSignal initialized successfully');

        OneSignal.Notifications.addEventListener('click', (event) => {
          logger.info('🔔 Notification clicked:', event);
          this.handleNotificationClick(event);
        });

        OneSignal.User.PushSubscription.addEventListener('change', (subscription) => {
          logger.info('🔔 Subscription changed:', subscription);
          if (subscription.current.id) {
            this.savePlayerId(subscription.current.id);
          }
        });
      } catch (error) {
        logger.error('❌ Failed to initialize OneSignal:', error);
        this.initialized = false;
        this.initializationPromise = null;
        throw error;
      }
    })();

    return this.initializationPromise;
  }

  async requestPermission(): Promise<boolean> {
    try {
      if (!this.initialized) {
        logger.warn('OneSignal not initialized yet');
        return false;
      }

      logger.info('🔔 Requesting notification permission...');
      const permission = await OneSignal.Notifications.requestPermission();
      logger.info('🔔 Permission result:', permission);
      return permission;
    } catch (error) {
      logger.error('❌ Failed to request permission:', error);
      return false;
    }
  }

  async getPlayerId(): Promise<string | null> {
    try {
      if (!this.initialized) {
        logger.warn('OneSignal not initialized yet');
        return null;
      }

      const playerId = await OneSignal.User.PushSubscription.id;
      logger.debug('🔔 Player ID:', playerId);
      return playerId || null;
    } catch (error) {
      logger.error('❌ Failed to get player ID:', error);
      return null;
    }
  }

  async isSubscribed(): Promise<boolean> {
    try {
      if (!this.initialized) {
        return false;
      }

      const subscription = await OneSignal.User.PushSubscription.optedIn;
      return subscription || false;
    } catch (error) {
      logger.error('❌ Failed to check subscription status:', error);
      return false;
    }
  }

  async subscribe(): Promise<void> {
    try {
      if (!this.initialized) {
        throw new Error('OneSignal not initialized');
      }

      logger.info('🔔 Subscribing to push notifications...');
      await OneSignal.User.PushSubscription.optIn();
      logger.info('✅ Subscribed successfully');
    } catch (error) {
      logger.error('❌ Failed to subscribe:', error);
      throw error;
    }
  }

  async unsubscribe(): Promise<void> {
    try {
      if (!this.initialized) {
        throw new Error('OneSignal not initialized');
      }

      logger.info('🔔 Unsubscribing from push notifications...');
      await OneSignal.User.PushSubscription.optOut();
      logger.info('✅ Unsubscribed successfully');

      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase
          .from('profiles')
          .update({
            onesignal_player_id: null,
            push_notifications_enabled: false
          })
          .eq('id', user.id);
      }
    } catch (error) {
      logger.error('❌ Failed to unsubscribe:', error);
      throw error;
    }
  }

  private async savePlayerId(playerId: string): Promise<void> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        logger.warn('No user logged in, cannot save player ID');
        return;
      }

      logger.info('💾 Saving player ID to Supabase:', playerId);

      const { error } = await supabase
        .from('profiles')
        .update({
          onesignal_player_id: playerId,
          push_notifications_enabled: true
        })
        .eq('id', user.id);

      if (error) {
        logger.error('❌ Failed to save player ID:', error);
      } else {
        logger.info('✅ Player ID saved successfully');
      }
    } catch (error) {
      logger.error('❌ Error saving player ID:', error);
    }
  }

  private handleNotificationClick(event: any): void {
    try {
      const notification = event.notification;
      const data = notification.additionalData || {};

      logger.info('🔔 Notification data:', data);

      if (data.bookingId) {
        const action = event.action?.actionId;

        if (action === 'view') {
          window.location.href = `/calendar?bookingId=${data.bookingId}`;
        } else if (action === 'call' && data.clientPhone) {
          window.location.href = `tel:${data.clientPhone}`;
        } else if (action === 'confirm') {
          window.location.href = `/calendar?bookingId=${data.bookingId}&action=confirm`;
        } else if (action === 'contact') {
          window.location.href = `/calendar?bookingId=${data.bookingId}&action=contact`;
        } else {
          window.location.href = `/calendar?bookingId=${data.bookingId}`;
        }
      }
    } catch (error) {
      logger.error('❌ Error handling notification click:', error);
    }
  }

  async setExternalUserId(userId: string): Promise<void> {
    try {
      if (!this.initialized) {
        logger.warn('OneSignal not initialized yet');
        return;
      }

      logger.info('🔔 Setting external user ID:', userId);
      await OneSignal.login(userId);
      logger.info('✅ External user ID set successfully');
    } catch (error) {
      logger.error('❌ Failed to set external user ID:', error);
    }
  }

  async logout(): Promise<void> {
    try {
      if (!this.initialized) {
        return;
      }

      logger.info('🔔 Logging out from OneSignal...');
      await OneSignal.logout();
      logger.info('✅ Logged out successfully');
    } catch (error) {
      logger.error('❌ Failed to logout:', error);
    }
  }
}

export const oneSignalService = new OneSignalService();
