import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import './index.css';
import './styles/modal-safe-area.css';
import { initCacheBuster } from './utils/cacheBuster';

// Initialize cache buster before rendering
initCacheBuster().then(async (hasNewVersion) => {
  if (hasNewVersion) {
    console.log('🔄 First load with new version detected, updating...');
    const { CacheBuster } = await import('./utils/cacheBuster');
    await CacheBuster.clearAllCaches();
    await CacheBuster.updateVersion();
    console.log('✅ Version updated, reloading...');
    window.location.reload();
    return;
  }

  // Créer le conteneur pour les modals s'il n'existe pas
  if (!document.getElementById('modal-root')) {
    const modalRoot = document.createElement('div');
    modalRoot.id = 'modal-root';
    document.body.appendChild(modalRoot);
  }

  ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </React.StrictMode>
  );
}).catch(error => {
  console.error('Failed to initialize cache buster:', error);
  // Continue rendering even if cache buster fails
  if (!document.getElementById('modal-root')) {
    const modalRoot = document.createElement('div');
    modalRoot.id = 'modal-root';
    document.body.appendChild(modalRoot);
  }

  ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </React.StrictMode>
  );
});
