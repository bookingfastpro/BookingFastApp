import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import './index.css';
import './styles/modal-safe-area.css';
import { registerServiceWorker } from './utils/registerServiceWorker';

// Créer le conteneur pour les modals s'il n'existe pas
if (!document.getElementById('modal-root')) {
  const modalRoot = document.createElement('div');
  modalRoot.id = 'modal-root';
  document.body.appendChild(modalRoot);
}

// Enregistrer le Service Worker pour PWA
if (import.meta.env.PROD) {
  registerServiceWorker().catch(console.error);
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>
);
