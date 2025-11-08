// Enregistrement du Service Worker pour PWA

export async function registerServiceWorker() {
  // Vérifier si le navigateur supporte les Service Workers
  if (!('serviceWorker' in navigator)) {
    console.log('❌ Service Worker non supporté par ce navigateur');
    return;
  }

  try {
    // Attendre que la page soit complètement chargée
    if (document.readyState === 'loading') {
      await new Promise(resolve => {
        window.addEventListener('load', resolve);
      });
    }

    // Enregistrer le Service Worker
    const registration = await navigator.serviceWorker.register('/sw.js', {
      scope: '/',
      updateViaCache: 'none'
    });

    console.log('✅ Service Worker enregistré:', registration.scope);

    // Vérifier les mises à jour toutes les heures
    setInterval(() => {
      registration.update();
    }, 60 * 60 * 1000);

    // Gérer les mises à jour
    registration.addEventListener('updatefound', () => {
      const newWorker = registration.installing;

      if (!newWorker) return;

      newWorker.addEventListener('statechange', () => {
        if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
          // Une nouvelle version est disponible
          console.log('🔄 Nouvelle version disponible');

          // Notifier l'utilisateur
          if (confirm('Une nouvelle version de l\'application est disponible. Recharger maintenant ?')) {
            newWorker.postMessage({ type: 'SKIP_WAITING' });
            window.location.reload();
          }
        }
      });
    });

    // Écouter les changements de contrôleur
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      console.log('🔄 Service Worker mis à jour');
      window.location.reload();
    });

  } catch (error) {
    console.error('❌ Erreur lors de l\'enregistrement du Service Worker:', error);
  }
}

// Désenregistrer tous les Service Workers (pour développement)
export async function unregisterServiceWorker() {
  if (!('serviceWorker' in navigator)) {
    return;
  }

  try {
    const registrations = await navigator.serviceWorker.getRegistrations();

    for (const registration of registrations) {
      await registration.unregister();
      console.log('✅ Service Worker désenregistré');
    }

    // Nettoyer le cache
    if ('caches' in window) {
      const cacheNames = await caches.keys();
      await Promise.all(cacheNames.map(name => caches.delete(name)));
      console.log('✅ Cache nettoyé');
    }
  } catch (error) {
    console.error('❌ Erreur lors du désenregistrement:', error);
  }
}

// Vérifier si l'application est installée comme PWA
export function isPWAInstalled(): boolean {
  // Vérifier le mode d'affichage
  const isStandalone = window.matchMedia('(display-mode: standalone)').matches;

  // Vérifier iOS
  const isIOSStandalone = (window.navigator as any).standalone === true;

  return isStandalone || isIOSStandalone;
}

// Obtenir les informations PWA
export function getPWAInfo() {
  return {
    isInstalled: isPWAInstalled(),
    isOnline: navigator.onLine,
    isServiceWorkerSupported: 'serviceWorker' in navigator,
    isPushSupported: 'PushManager' in window,
    isNotificationSupported: 'Notification' in window,
    platform: navigator.platform,
    userAgent: navigator.userAgent
  };
}

// Demander la permission pour les notifications
export async function requestNotificationPermission(): Promise<NotificationPermission> {
  if (!('Notification' in window)) {
    console.log('❌ Notifications non supportées');
    return 'denied';
  }

  if (Notification.permission === 'granted') {
    return 'granted';
  }

  if (Notification.permission !== 'denied') {
    const permission = await Notification.requestPermission();
    return permission;
  }

  return Notification.permission;
}

// Afficher une notification
export async function showNotification(
  title: string,
  options?: NotificationOptions
) {
  const permission = await requestNotificationPermission();

  if (permission !== 'granted') {
    console.log('❌ Permission de notification refusée');
    return;
  }

  if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
    const registration = await navigator.serviceWorker.ready;

    await registration.showNotification(title, {
      icon: '/pwa-192x192.png',
      badge: '/pwa-192x192.png',
      vibrate: [200, 100, 200],
      ...options
    });
  } else {
    new Notification(title, {
      icon: '/pwa-192x192.png',
      ...options
    });
  }
}

// Nettoyer le cache manuellement
export async function clearCache() {
  if ('caches' in window) {
    const cacheNames = await caches.keys();
    await Promise.all(cacheNames.map(name => caches.delete(name)));
    console.log('✅ Cache nettoyé');
    return true;
  }
  return false;
}
