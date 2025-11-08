import React, { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  headerGradient?: string;
}

export function Modal({ isOpen, onClose, title, children, size = 'lg', headerGradient }: ModalProps) {
  const scrollPositionRef = useRef(0);

  useEffect(() => {
    if (isOpen) {
      // Sauvegarder la position de scroll actuelle
      scrollPositionRef.current = window.pageYOffset || document.documentElement.scrollTop;

      // Bloquer complètement le scroll
      document.body.classList.add('modal-open');
      document.body.style.top = `-${scrollPositionRef.current}px`;
      document.body.style.position = 'fixed';
      document.body.style.width = '100%';
      document.body.style.overflow = 'hidden';

      // Créer le conteneur modal-root s'il n'existe pas
      if (!document.getElementById('modal-root')) {
        const modalRoot = document.createElement('div');
        modalRoot.id = 'modal-root';
        document.body.appendChild(modalRoot);
      }

      return () => {
        // Restaurer le scroll
        document.body.classList.remove('modal-open');
        document.body.style.position = '';
        document.body.style.top = '';
        document.body.style.width = '';
        document.body.style.overflow = '';

        // Restaurer la position de scroll
        window.scrollTo(0, scrollPositionRef.current);
      };
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const sizeClasses = {
    sm: 'max-w-md',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl',
    '2xl': 'max-w-6xl'
  };
  
  // Gradient par défaut si non spécifié
  const defaultGradient = 'from-purple-600 via-pink-600 to-indigo-600';
  const gradient = headerGradient || defaultGradient;

  const modalContent = (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[9998] transition-opacity duration-200"
        onClick={onClose}
        style={{ touchAction: 'none' }}
      />

      {/* Modal */}
      <div
        className="fixed inset-0 flex items-end sm:items-center justify-center p-0 sm:p-4 z-[9999] pointer-events-none"
        style={{ touchAction: 'none' }}
      >
        <div
          className={`bg-white w-full sm:${sizeClasses[size]} max-h-full sm:max-h-[90vh] sm:rounded-3xl shadow-2xl flex flex-col pointer-events-auto transition-transform duration-300 ease-out`}
          style={{
            transform: 'translateY(0)',
            touchAction: 'pan-y'
          }}
        >
          {/* Header avec safe area pour mobile */}
          <div
            className="flex-shrink-0 relative overflow-hidden sm:rounded-t-3xl"
            style={{
              paddingTop: 'env(safe-area-inset-top, 0px)'
            }}
          >
            <div className={`absolute inset-0 bg-gradient-to-br ${gradient}`}></div>

            <div className="relative z-10 p-4 sm:p-6">
              <div className="flex items-center justify-between">
                <h2 className="text-lg sm:text-2xl font-bold text-white drop-shadow-lg">{title}</h2>
                <button
                  onClick={onClose}
                  className="p-2 sm:p-3 text-white hover:bg-white/20 rounded-xl sm:rounded-2xl transition-colors duration-200 active:scale-95"
                  aria-label="Fermer"
                >
                  <X className="w-5 h-5 sm:w-6 sm:h-6" />
                </button>
              </div>
            </div>
          </div>

          {/* Content scrollable avec safe area pour mobile */}
          <div
            className="flex-1 overflow-y-auto overscroll-contain"
            style={{
              paddingBottom: 'env(safe-area-inset-bottom, 0px)',
              WebkitOverflowScrolling: 'touch'
            }}
          >
            <div className="p-4 sm:p-6">
              {children}
            </div>
          </div>
        </div>
      </div>
    </>
  );

  // Utiliser le portail React
  const modalRoot = document.getElementById('modal-root');
  if (!modalRoot) return null;

  return createPortal(modalContent, modalRoot);
}
