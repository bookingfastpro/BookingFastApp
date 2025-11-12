import OneSignal from 'react-onesignal';
import { supabase } from './supabase';
import { logger } from '../utils/logger';

interface OneSignalConfig {
  appId: string;
  allowLocalhostAsSecureOrigin: boolean;
  notifyButton?: {
    enable: boolean;
  };
}

class OneSignalService {
  private initialized: boolean = false;
  private initializing: boolean = false;
  private initPromise: Promise<void> | null = null;
  private appId: string;
  private restApiKey: string;

  constructor() {
    this.appId = import.meta.env.VITE_ONESIGNAL_APP_ID || '';
    this.restApiKey = import.meta.env.VITE_ONESIGNAL_REST_API_KEY || '';

    logger.debug('OneSignalService constructor');
    logger.debug('App ID configured:', !!this.appId);
    logger.debug('REST API Key configured:', !!this.restApiKey);
  }

  async initialize(): Promise<void> {
    if (this.initialized) {
      logger.debug('OneSignal already initialized');
      return;
    }

    if (this.initializing) {
      logger.debug('OneSignal initialization in progress, waiting...');
      return this.initPromise!;
    }

    if (!this.appId) {
      logger.error('OneSignal App ID not configured');
      return;
    }

    this.initializing = true;

    this.initPromise = (async () => {
      try {
        logger.debug('Initializing OneSignal...');

        await OneSignal.init({
          appId: this.appId,
          allowLocalhostAsSecureOrigin: true,
          notifyButton: {
            enable: false
          }
        });

        this.initialized = true;
        this.initializing = false;
        logger.debug('OneSignal initialized successfully');

        this.setupEventListeners();
      } catch (error) {
        this.initializing = false;
        if (error instanceof Error && error.message.includes('already initialized')) {
          logger.debug('OneSignal was already initialized externally');
          this.initialized = true;
          this.setupEventListeners();
        } else {
          logger.error('Failed to initialize OneSignal:', error);
          throw error;
        }
      }
    })();

    return this.initPromise;
  }

  private setupEventListeners(): void {
    OneSignal.Notifications.addEventListener('click', (event) => {
      logger.debug('Notification clicked:', event);

      const data = event.notification.additionalData;
      if (data?.bookingId) {
        sessionStorage.setItem('openBookingId', data.bookingId);
        window.dispatchEvent(new CustomEvent('openBookingFromNotification', {
          detail: { bookingId: data.bookingId }
        }));

        if (window.location.pathname !== '/calendar') {
          window.location.href = '/calendar';
        }
      }
    });

    OneSignal.Notifications.addEventListener('permissionChange', (permissionChange) => {
      logger.debug('Permission changed:', permissionChange);
    });
  }


  async getPlayerId(): Promise<string | null> {
    try {
      if (!this.initialized) {
        await this.initialize();
      }

      const userId = await OneSignal.User.PushSubscription.id;
      return userId;
    } catch (error) {
      logger.error('Error getting player ID:', error);
      return null;
    }
  }

  async registerUser(userId: string): Promise<void> {
    try {
      if (!this.initialized) {
        await this.initialize();
      }

      await OneSignal.login(userId);

      const playerId = await this.getPlayerId();
      if (playerId) {
        const { error } = await supabase
          .from('user_onesignal')
          .upsert({
            user_id: userId,
            player_id: playerId,
            subscription_status: 'active',
            updated_at: new Date().toISOString()
          }, {
            onConflict: 'user_id'
          });

        if (error) {
          logger.error('Error saving player ID to database:', error);
        } else {
          logger.debug('Player ID saved to database:', playerId);
        }
      }

      await OneSignal.User.addTag('user_id', userId);

      logger.debug('User registered with OneSignal:', userId);
    } catch (error) {
      logger.error('Error registering user:', error);
    }
  }

  async setTags(tags: Record<string, string>): Promise<void> {
    try {
      if (!this.initialized) {
        await this.initialize();
      }

      for (const [key, value] of Object.entries(tags)) {
        await OneSignal.User.addTag(key, value);
      }

      logger.debug('Tags set:', tags);
    } catch (error) {
      logger.error('Error setting tags:', error);
    }
  }

  async isPushEnabled(): Promise<boolean> {
    try {
      if (!this.initialized) {
        await this.initialize();
      }

      const permission = await OneSignal.Notifications.permission;
      return permission;
    } catch (error) {
      logger.error('Error checking push status:', error);
      return false;
    }
  }

  async sendNotification(
    playerIds: string[],
    heading: string,
    content: string,
    data?: Record<string, any>
  ): Promise<boolean> {
    if (!this.restApiKey) {
      logger.error('OneSignal REST API Key not configured');
      return false;
    }

    try {
      const response = await fetch('https://onesignal.com/api/v1/notifications', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Basic ${this.restApiKey}`
        },
        body: JSON.stringify({
          app_id: this.appId,
          include_player_ids: playerIds,
          headings: { en: heading },
          contents: { en: content },
          data: data || {},
          web_push_topic: 'booking_notifications'
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        logger.error('OneSignal API error:', errorData);
        return false;
      }

      const result = await response.json();
      logger.debug('Notification sent successfully:', result);
      return true;
    } catch (error) {
      logger.error('Error sending notification:', error);
      return false;
    }
  }

  async sendNotificationToUser(
    userId: string,
    heading: string,
    content: string,
    data?: Record<string, any>
  ): Promise<boolean> {
    try {
      const { data: userOneSignal, error } = await supabase
        .from('user_onesignal')
        .select('player_id')
        .eq('user_id', userId)
        .maybeSingle();

      if (error || !userOneSignal?.player_id) {
        logger.error('User does not have a OneSignal player ID');
        return false;
      }

      return await this.sendNotification(
        [userOneSignal.player_id],
        heading,
        content,
        data
      );
    } catch (error) {
      logger.error('Error sending notification to user:', error);
      return false;
    }
  }

  async getNotificationPermission(): Promise<'default' | 'granted' | 'denied'> {
    try {
      if (!this.initialized) {
        await this.initialize();
      }

      const permission = await OneSignal.Notifications.permission;
      return permission ? 'granted' : 'default';
    } catch (error) {
      logger.error('Error getting notification permission:', error);
      return 'default';
    }
  }

  async showSlidedown(): Promise<void> {
    try {
      if (!this.initialized) {
        await this.initialize();
      }

      logger.debug('Requesting notification permission...');
      const granted = await this.requestPermission();
      logger.debug('Permission request result:', granted);
      return;
    } catch (error) {
      logger.error('Error requesting permission:', error);
      throw error;
    }
  }

  async requestPermission(): Promise<boolean> {
    try {
      if (!this.initialized) {
        await this.initialize();
      }

      logger.debug('Requesting notification permission...');

      const permission = await OneSignal.Notifications.requestPermission();

      if (permission) {
        logger.debug('Notification permission granted');
        return true;
      } else {
        logger.warn('Notification permission denied');
        return false;
      }
    } catch (error) {
      logger.error('Error requesting notification permission:', error);
      return false;
    }
  }

  isInitialized(): boolean {
    return this.initialized;
  }
}

export const oneSignalService = new OneSignalService();
