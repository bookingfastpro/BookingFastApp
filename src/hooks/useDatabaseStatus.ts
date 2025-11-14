import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '../lib/supabase';

export function useDatabaseStatus() {
  const [isConnected, setIsConnected] = useState(true);
  const [isChecking, setIsChecking] = useState(false);
  const [lastCheck, setLastCheck] = useState<Date>(new Date());
  const [failureCount, setFailureCount] = useState(0);
  const checkTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const checkDatabaseConnection = useCallback(async () => {
    if (isChecking) return;

    setIsChecking(true);

    try {
      // Timeout de 5 secondes pour la requête
      const timeoutPromise = new Promise((_, reject) => {
        checkTimeoutRef.current = setTimeout(() => reject(new Error('Timeout')), 5000);
      });

      const queryPromise = supabase
        .from('business_settings')
        .select('id')
        .limit(1)
        .maybeSingle();

      const { error } = await Promise.race([queryPromise, timeoutPromise]) as any;

      if (checkTimeoutRef.current) {
        clearTimeout(checkTimeoutRef.current);
      }

      const connected = !error;

      if (connected) {
        // Connexion réussie
        if (!isConnected) {
          console.log('✅ Database connection restored');
        }
        setIsConnected(true);
        setFailureCount(0);
      } else {
        // Erreur détectée - augmenter le compteur
        const newFailureCount = failureCount + 1;
        setFailureCount(newFailureCount);

        // Seulement marquer comme déconnecté après 2 échecs consécutifs
        if (newFailureCount >= 2) {
          if (isConnected) {
            console.log('❌ Database connection lost (confirmed after 2 failures)');
          }
          setIsConnected(false);
        }
      }

      setLastCheck(new Date());
    } catch (err) {
      console.error('❌ Database check failed:', err);

      const newFailureCount = failureCount + 1;
      setFailureCount(newFailureCount);

      // Seulement marquer comme déconnecté après 2 échecs consécutifs
      if (newFailureCount >= 2) {
        if (isConnected) {
          console.log('❌ Database connection lost (confirmed after 2 failures)');
        }
        setIsConnected(false);
      }

      setLastCheck(new Date());
    } finally {
      setIsChecking(false);
    }
  }, [isConnected, isChecking, failureCount]);

  useEffect(() => {
    // Vérification initiale après 1 seconde
    const initialCheck = setTimeout(() => {
      checkDatabaseConnection();
    }, 1000);

    // Vérification périodique toutes les 10 secondes
    const interval = setInterval(() => {
      checkDatabaseConnection();
    }, 10000);

    return () => {
      clearTimeout(initialCheck);
      clearInterval(interval);
    };
  }, [checkDatabaseConnection]);

  // Écouter les erreurs de requêtes Supabase
  useEffect(() => {
    const handleOnlineStatusChange = () => {
      if (navigator.onLine) {
        console.log('🌐 Browser back online, checking database...');
        checkDatabaseConnection();
      } else {
        console.log('🔌 Browser offline');
        setIsConnected(false);
      }
    };

    window.addEventListener('online', handleOnlineStatusChange);
    window.addEventListener('offline', handleOnlineStatusChange);

    return () => {
      window.removeEventListener('online', handleOnlineStatusChange);
      window.removeEventListener('offline', handleOnlineStatusChange);
    };
  }, [checkDatabaseConnection]);

  return {
    isConnected,
    isChecking,
    lastCheck,
    checkConnection: checkDatabaseConnection
  };
}
