/**
 * CRITICAL: Dynamic viewport height calculation for PWA
 * Fixes the 100vh issue on mobile devices where browser address bar affects viewport
 */

export function initViewportHeight() {
  // Calculate and set the real viewport height
  const setVH = () => {
    const vh = window.innerHeight * 0.01;
    document.documentElement.style.setProperty('--vh', `${vh}px`);
    
    console.log('📐 Viewport height updated:', {
      innerHeight: window.innerHeight,
      vh: `${vh}px`,
      isPWA: window.matchMedia('(display-mode: standalone)').matches
    });
  };

  // Set on initial load
  setVH();

  // Update on resize (handles orientation changes and keyboard appearance)
  let resizeTimeout: number;
  window.addEventListener('resize', () => {
    // Debounce to avoid too many calculations
    clearTimeout(resizeTimeout);
    resizeTimeout = window.setTimeout(setVH, 100);
  });

  // Update on orientation change
  window.addEventListener('orientationchange', () => {
    // Wait for the orientation change to complete
    setTimeout(setVH, 100);
  });

  // Update when keyboard appears/disappears (visualViewport API)
  if (window.visualViewport) {
    window.visualViewport.addEventListener('resize', setVH);
  }

  console.log('✅ Viewport height system initialized');
}
