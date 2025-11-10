import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import './index.css';
import './styles/modal-safe-area.css';
import { initCacheBuster } from './utils/cacheBuster';

// Créer le conteneur pour les modals
if (!document.getElementById('modal-root')) {
  const modalRoot = document.createElement('div');
  modalRoot.id = 'modal-root';
  document.body.appendChild(modalRoot);
}

// Render immédiatement sans attendre le cache buster
ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>
);

// Vérifier la version en arrière-plan (non bloquant)
initCacheBuster().then(async (hasNewVersion) => {
  if (hasNewVersion) {
    const { CacheBuster } = await import('./utils/cacheBuster');
    await CacheBuster.clearAllCaches();
    await CacheBuster.updateVersion();
    window.location.reload();
  }
}).catch(error => {
  console.error('Failed to initialize cache buster:', error);
});
