import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { oneSignalService } from '../lib/oneSignalService';
import { supabase } from '../lib/supabase';
import { logger } from '../utils/logger';

export function useOneSignal() {
  const { user } = useAuth();
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [playerId, setPlayerId] = useState<string | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const checkSubscriptionStatus = useCallback(async () => {
    try {
      const subscribed = await oneSignalService.isSubscribed();
      const id = await oneSignalService.getPlayerId();

      setIsSubscribed(subscribed);
      setPlayerId(id);

      logger.debug('OneSignal status - Subscribed:', subscribed, 'Player ID:', id);
    } catch (err) {
      logger.error('Failed to check OneSignal status:', err);
    }
  }, []);

  useEffect(() => {
    const initOneSignal = async () => {
      const appId = import.meta.env.VITE_ONESIGNAL_APP_ID;

      if (!appId) {
        logger.warn('VITE_ONESIGNAL_APP_ID not configured');
        setError('OneSignal App ID not configured');
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        await oneSignalService.initialize(appId);
        setIsInitialized(true);
        await checkSubscriptionStatus();
        setError(null);
      } catch (err) {
        logger.error('Failed to initialize OneSignal:', err);
        setError(err instanceof Error ? err.message : 'Failed to initialize OneSignal');
      } finally {
        setIsLoading(false);
      }
    };

    initOneSignal();
  }, [checkSubscriptionStatus]);

  useEffect(() => {
    if (!user || !isInitialized) return;

    const setupUser = async () => {
      try {
        await oneSignalService.setExternalUserId(user.id);

        const id = await oneSignalService.getPlayerId();
        if (id) {
          setPlayerId(id);
        }
      } catch (err) {
        logger.error('Failed to set up OneSignal user:', err);
      }
    };

    setupUser();
  }, [user, isInitialized]);

  useEffect(() => {
    if (!user && isInitialized) {
      oneSignalService.logout().catch(err => {
        logger.error('Failed to logout from OneSignal:', err);
      });
    }
  }, [user, isInitialized]);

  const requestPermission = useCallback(async () => {
    if (!isInitialized) {
      setError('OneSignal is not initialized');
      return false;
    }

    try {
      setIsLoading(true);
      setError(null);

      const granted = await oneSignalService.requestPermission();

      if (granted) {
        await oneSignalService.subscribe();
        await checkSubscriptionStatus();
      }

      return granted;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to request permission';
      setError(errorMessage);
      logger.error('Failed to request notification permission:', err);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [isInitialized, checkSubscriptionStatus]);

  const subscribe = useCallback(async () => {
    if (!isInitialized) {
      setError('OneSignal is not initialized');
      return false;
    }

    try {
      setIsLoading(true);
      setError(null);

      await oneSignalService.subscribe();
      await checkSubscriptionStatus();

      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to subscribe';
      setError(errorMessage);
      logger.error('Failed to subscribe:', err);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [isInitialized, checkSubscriptionStatus]);

  const unsubscribe = useCallback(async () => {
    if (!isInitialized) {
      setError('OneSignal is not initialized');
      return false;
    }

    try {
      setIsLoading(true);
      setError(null);

      await oneSignalService.unsubscribe();
      await checkSubscriptionStatus();

      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to unsubscribe';
      setError(errorMessage);
      logger.error('Failed to unsubscribe:', err);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [isInitialized, checkSubscriptionStatus]);

  const sendTestNotification = useCallback(async () => {
    if (!user || !playerId) {
      setError('Not subscribed to notifications');
      return false;
    }

    try {
      setIsLoading(true);
      setError(null);

      const { data, error: funcError } = await supabase.functions.invoke('send-onesignal-notification', {
        body: {
          playerId,
          title: 'Test de notification',
          message: 'Ceci est une notification de test depuis BookingFast',
          data: {
            type: 'test',
            bookingId: 'test-123'
          },
          buttons: [
            { id: 'view', text: 'Voir', url: '/calendar' }
          ]
        }
      });

      if (funcError) {
        throw funcError;
      }

      logger.info('Test notification sent successfully:', data);
      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to send test notification';
      setError(errorMessage);
      logger.error('Failed to send test notification:', err);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [user, playerId]);

  return {
    isSubscribed,
    playerId,
    isInitialized,
    isLoading,
    error,
    requestPermission,
    subscribe,
    unsubscribe,
    sendTestNotification,
    checkSubscriptionStatus
  };
}
