/**
 * Détecte si l'application est lancée en mode PWA
 * Supporte iOS (standalone), Android (display-mode) et autres navigateurs
 */
export function isPWA(): boolean {
  // Vérifier si on est en mode standalone (iOS)
  const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
  
  // Vérifier navigator.standalone pour iOS Safari
  const isIOSStandalone = (window.navigator as any).standalone === true;
  
  // Vérifier si installé via Chrome/Edge
  const isInstalled = window.matchMedia('(display-mode: standalone)').matches ||
                      window.matchMedia('(display-mode: fullscreen)').matches ||
                      window.matchMedia('(display-mode: minimal-ui)').matches;
  
  const result = isStandalone || isIOSStandalone || isInstalled;
  
  console.log('🔍 Détection PWA:', {
    isStandalone,
    isIOSStandalone,
    isInstalled,
    result,
    userAgent: navigator.userAgent
  });
  
  return result;
}

/**
 * Hook React pour détecter le mode PWA
 */
export function usePWADetection() {
  const [isPWAMode, setIsPWAMode] = React.useState(false);
  
  React.useEffect(() => {
    const checkPWA = () => {
      const pwaMode = isPWA();
      setIsPWAMode(pwaMode);
      console.log('📱 Mode PWA détecté:', pwaMode);
    };
    
    checkPWA();
    
    // Écouter les changements de display-mode
    const mediaQuery = window.matchMedia('(display-mode: standalone)');
    const handleChange = () => checkPWA();
    
    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', handleChange);
      return () => mediaQuery.removeEventListener('change', handleChange);
    }
  }, []);
  
  return isPWAMode;
}

// Import React pour le hook
import React from 'react';
